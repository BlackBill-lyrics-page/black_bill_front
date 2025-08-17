import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { getUserId } from "../lib/auth";

export function useSongCommentVM(songId: number | null) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // 불러오기
  const fetchComments = useCallback(async () => {
    if (!songId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("song_comment")
      .select(`id, comment, updated_at, users(username, photo_url)`)
      .eq("song_id", songId)
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else {
        setComments(data || []);
        setCount(data?.length||0);
    }
    setLoading(false);
  }, [songId]);


  // 추가
  const addComment = useCallback(async (content: string) => {
    const uid = await getUserId();
    if (!uid || !songId) return;
    const { error } = await supabase.from("song_comment").insert({
      song_id: songId,
      user_id: uid,
      comment : content,
    });
    if (!error) fetchComments();
  }, [songId, fetchComments]);

  // 수정
  const editComment = useCallback(async (id: number, content: string) => {
    const uid = await getUserId();
    const { error } = await supabase
      .from("song_comment")
      .update({ comment : content })
      .eq("id", id)
      .eq("user_id", uid);
    if (!error) fetchComments();
  }, [fetchComments]);

  // 삭제
  const deleteComment = useCallback(async (id: number) => {
    const uid = await getUserId();
    const { error } = await supabase
      .from("song_comment")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);
    if (!error) fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, error, addComment, editComment, deleteComment, count };
}