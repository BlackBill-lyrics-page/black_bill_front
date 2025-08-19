// src/viewmodels/useAlbumLikeVM.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export function useAlbumLikeVM(albumId?: number) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getUserId = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  }, []);

  // 초기 좋아요 상태 & 카운트
  useEffect(() => {
    let mounted = true;

    if (!albumId) {
      setError("albumId missing");
      return;
    }

    const currentAlbumId = albumId;

    (async () => {
      try {
        // 총 개수
        const { count: total, error: countErr } = await supabase
          .from("album_liked")
          .select("*", { count: "exact", head: true })
          .eq("album_id", albumId);

        if (countErr) {
          setError(countErr.message || "count error");
          return;
        }

        // 내가 눌렀는지
        const uid = await getUserId();
        let iLiked = false;

        if (uid) {
          const { data, error: mineErr } = await supabase
            .from("album_liked")
            .select("album_id")
            .eq("album_id", albumId)
            .eq("user_id", uid)
            .limit(1);

          if (mineErr) {
            setError(mineErr.message);
            return;
          }
          iLiked = !!(data && data.length > 0);
        }

        if (mounted && albumId === currentAlbumId) {
          setLikeCount(total ?? 0);
          setLiked(iLiked);
          setError(null);
        }
      } catch (e: any) {
        setError(e?.message ?? "unexpected error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [albumId, getUserId]);

  // 좋아요 토글
  const toggleLike = useCallback(async () => {
    if (!albumId || loading) return; // 중복 클릭 방지
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) {
        navigate(
          `/sign-in?redirect=${encodeURIComponent(
            location.pathname + location.search
          )}`
        );
        return;
      }

      if (liked) {
        // 좋아요 취소
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));

        const { error } = await supabase
          .from("album_liked")
          .delete()
          .eq("album_id", albumId)
          .eq("user_id", uid);

        if (error) {
          // 롤백
          setLiked(true);
          setLikeCount((c) => c + 1);
          console.error(error);
        }
      } else {
        // 좋아요 추가
        setLiked(true);
        setLikeCount((c) => c + 1);

        // 기본 insert
        const { error } = await supabase
          .from("album_liked")
          .insert([{ album_id: albumId, user_id: uid }]);

        // 경합 가능성 높으면 upsert 사용
        // const { error } = await supabase
        //   .from("album_liked")
        //   .upsert({ album_id: albumId, user_id: uid }, { onConflict: "album_id,user_id" });

        if (error) {
          // 롤백
          setLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
          console.error(error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [albumId, liked, loading, getUserId, navigate]);

  return { likeCount, liked, loading, toggleLike, error };
}
