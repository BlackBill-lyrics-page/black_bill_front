// src/viewmodels/useStageCommentVM.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export type StageComment = {
  id: number;
  stage_id: number;
  user_id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  users?: {
    username?: string | null;
    photo_url?: string | null;
  } | null;
};

const BUCKET = "stage-images";

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
          id, stage_id, user_id, content, photo_url, created_at,
          users:users!stage_comments_user_id_fkey ( username, photo_url )
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

      if (file) {
        // (선택) 간단한 파일 가드
        if (!file.type.startsWith("image/")) {
          throw new Error("이미지 파일만 업로드할 수 있습니다.");
        }
        // 경로 충돌 방지용 타임스탬프 prefix

        const path = `${userId}/${stageId}/${Date.now()}_${file.name}`;

        const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (up.error) throw up.error;

        const pub = supabase.storage.from(BUCKET).getPublicUrl(path);
        photo_url = pub.data.publicUrl;
      }

      const { error } = await supabase.from("stage_comments").insert({
        stage_id: stageId!,
        user_id: userId,
        content: content || "",  // 사진만 업로드 시 빈 문자열 허용
        photo_url,
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
