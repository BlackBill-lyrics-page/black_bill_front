// src/viewmodels/useStageCommentVM.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export type StageComment = {
  id: number;
  stage_id: number;
  user_id: string;
  content: string;
  photo_url: string | null;
  photo_w?: number | null;   
  photo_h?: number | null;   
  created_at: string;
  updated_at: string;
  users?: {
    username?: string | null;
    photo_url?: string | null;
  } | null;
};

const BUCKET = "stage-images"; // 버킷 Id 정확히!

// 파일명 안전화: 공백/한글/특수문자 → 제거/치환
const sanitizeFilename = (name: string) => {
  const i = name.lastIndexOf(".");
  const base = (i >= 0 ? name.slice(0, i) : name)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
  const ext = (i >= 0 ? name.slice(i + 1) : "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ext ? `${base || "file"}.${ext}` : (base || `${Date.now()}`);
};

// 확장자 기반 MIME 보정(.jfif → image/jpeg 등)
const guessMime = (name: string, fallback?: string) => {
  const n = name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".jfif")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  return fallback || "application/octet-stream";
};

export function useStageCommentVM(stageId: number | null) {
  const [comments, setComments] = useState<StageComment[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const enabled = useMemo(() => !!stageId, [stageId]);

  // public URL → storage 경로 (삭제용)
  const urlToStoragePath = (publicUrl: string) => {
    // 예: https://xxx.supabase.co/storage/v1/object/public/stage-images/<path>
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = publicUrl.indexOf(marker);
    return i >= 0 ? publicUrl.substring(i + marker.length) : null;
  };

  // 목록/카운트 동기 조회
  const fetchComments = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("stage_comments")
        .select(`
          id, stage_id, user_id, content, photo_url, photo_w, photo_h, created_at, updated_at,
          users( username, photo_url )
        `)
        .eq("stage_id", stageId!)
        .order("id", { ascending: true });
      if (error) throw error;
      setComments((data ?? []) as StageComment[]);

      const { count: c, error: cntErr } = await supabase
        .from("stage_comments")
        .select("*", { count: "exact", head: true })
        .eq("stage_id", stageId!);
      if (cntErr) throw cntErr;
      setCount(c ?? 0);
    } catch (e: any) {
      console.error(e);
      setErr(e.message ?? "댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [enabled, stageId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 등록: 텍스트만 / 사진만 / 둘 다 지원
  const addComment = useCallback(
    async (content: string, file?: File) => {
      if (!enabled) return;

      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id;


      if (!userId) throw new Error("로그인이 필요합니다.");

      let photo_url: string | null = null;
      let photo_w: number | null = null;   
      let photo_h: number | null = null;  

      if (file) {

        const {w,h}=await getImageSize(file);
        photo_w=w;
        photo_h=h;
        
        // 이미지 파일 가드 (MIME이 비어있을 때를 대비해 확장자도 체크)
        const isImage =
          file.type?.startsWith("image/") ||
          /\.(jpe?g|jfif|png|gif|webp)$/i.test(file.name);
        if (!isImage) throw new Error("이미지 파일만 업로드할 수 있습니다.");

        const safe = sanitizeFilename(file.name || "image");
        const path = `${userId}/${stageId}/${Date.now()}_${safe}`; // 앞에 '/' 금지
        const mime = guessMime(safe, file.type); // jfif → image/jpeg

        console.log("📂 Upload path:", path);
        console.log("📄 File type:", file.type, "→ using mime:", mime);


        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: true,
            contentType: mime, 
          });

        if (upErr) {
          console.error("Storage upload failed:", upErr);
          throw upErr;
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const { error } = await supabase.from("stage_comments").insert({
        stage_id: stageId!,
        user_id: userId,
        content: content || "", // 사진만 업로드 시 빈 문자열 허용
        photo_url,
        photo_w,
        photo_h,
      });
      if (error) throw error;

      await fetchComments();
    },
    [enabled, stageId, fetchComments]
  );

  // 수정: 텍스트만 수정 (사진 교체는 필요 시 별도 함수로)
  const editComment = useCallback(
    async (commentId: number, newContent: string) => {
      if (!enabled) return;
      const { error } = await supabase
        .from("stage_comments")
        .update({ content: newContent })
        .eq("id", commentId);
      if (error) throw error;
      await fetchComments();
    },
    [enabled, fetchComments]
  );

  // 삭제: DB row 삭제 + 사진 있으면 스토리지 파일도 삭제
  const deleteComment = useCallback(
    async (commentId: number) => {
      if (!enabled) return;

      // 우선 사진 URL 조회
      const { data: row, error: selErr } = await supabase
        .from("stage_comments")
        .select("photo_url")
        .eq("id", commentId)
        .maybeSingle();
      if (selErr) throw selErr;

      const { error } = await supabase
        .from("stage_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      if (row?.photo_url) {
        const path = urlToStoragePath(row.photo_url);
        if (path) {
          await supabase.storage.from(BUCKET).remove([path]);
        }
      }

      await fetchComments();
    },
    [enabled, fetchComments]
  );

  return {
    comments,
    count,
    loading,
    error: err,
    fetchComments,
    addComment,   // (content, file?) 둘 다 한 번에 처리
    editComment,  // 텍스트 수정
    deleteComment // row + storage 삭제
  };
}

//image size function
async function getImageSize(file: File): Promise<{ w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();  // 이미지 로드 보장
    return { w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
  } finally {
    URL.revokeObjectURL(url);
  }
}