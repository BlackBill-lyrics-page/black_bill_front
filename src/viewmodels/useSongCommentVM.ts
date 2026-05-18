import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { getUserId } from "../lib/auth";

export type SongComment = {
  id: number;
  comment: string;
  updated_at: string;
  user_id: string;
  album_id?: number | null;
  users?: { username?: string | null; photo_url?: string | null } | null;
  albums?: { albumname?: string | null } | null;
};

type Options = {
  albumId?: number | null;
  albumScoped?: boolean;
};

export function useSongCommentVM(songId: number | null, opts?: Options) {
  const [comments, setComments] = useState<SongComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const albumId = opts?.albumId ?? null;
  const albumScoped = opts?.albumScoped ?? false;

  // 불러오기
  const fetchComments = useCallback(async () => {
    if (!songId) return;
    setLoading(true);

    let query = supabase
      .from("song_comment")
      .select(`id, comment, updated_at, user_id, album_id, users(username, photo_url), albums(albumname)`)
      .eq("song_id", songId)
      .order("updated_at", { ascending: false });

    if (albumScoped) {
      query = albumId ? query.eq("album_id", albumId) : query.is("album_id", null);
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    else {
        setComments((data || []) as unknown as SongComment[]);
        setCount(data?.length||0);
    }
    setLoading(false);
  }, [songId, albumId, albumScoped]);


  // 추가
  const addComment = useCallback(async (content: string) => {
    const uid = await getUserId();
    if (!uid || !songId) return;
    const { error } = await supabase.from("song_comment").insert({
      song_id: songId,
      album_id: albumId,
      user_id: uid,
      comment : content,
    });
    if (!error) fetchComments();
  }, [songId, albumId, fetchComments]);

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
