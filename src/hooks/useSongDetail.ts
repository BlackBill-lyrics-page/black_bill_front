import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSongLikeVM } from "../viewmodels/useSongLikeVM";
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";

export type SongDetail = {
  id: number;
  title: string;
  lyrics: string | null;
  bio: string | null;
  song_photo: string | null;
  song_link: string | null;
  created_at: string | null;
  links?: { platform: string; url: string }[];
};

export function useSongDetail() {
  const [openSong, setOpenSong] = useState<SongDetail | null>(null);
  const [openLoading, setOpenLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 좋아요/댓글 VM은 현재 열려있는 곡 id 기준
  const { liked, likeCount, loading: likeLoading, toggleLike } = useSongLikeVM(openSong?.id);
  const { count: commentCount } = useSongCommentVM(openSong?.id ?? null);

  const open = async (songId: number) => {
    if (openSong?.id === songId) { setOpenSong(null); return; } // 다시 누르면 닫기
    setOpenLoading(true);
    try {
      const { data, error } = await supabase
        .from("songs")
        .select(`
          id,title,lyrics,bio,song_photo,song_link,created_at,
          song_links (platform, url)
        `)
        .eq("id", songId)
        .maybeSingle();

      if (error || !data) { setOpenSong(null); return; }

      setOpenSong({
        id: data.id,
        title: data.title ?? "",
        lyrics: data.lyrics ?? null,
        bio: data.bio ?? null,
        song_photo: data.song_photo ?? null,
        song_link: data.song_link ?? null,
        created_at: data.created_at ?? null,
        links: (data.song_links || []) as { platform: string; url: string }[],
      });

      // 패널로 스크롤
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } finally {
      setOpenLoading(false);
    }
  };

  const close = () => setOpenSong(null);

  return {
    openSong, openLoading, panelRef,
    liked: !!liked,
    likeCount: likeCount ?? 0,
    likeLoading: !!likeLoading,
    toggleLike,
    commentCount: commentCount ?? 0,
    open, close,
  };
}
