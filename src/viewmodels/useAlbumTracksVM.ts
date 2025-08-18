import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type UITrack = {
  position: number | null;
  id: number;
  title: string;
  song_photo?: string | null;
  song_link?: string | null;
  created_at?: string | null;
};

export function useAlbumTracksVM(albumId: number | null) {
  const [tracks, setTracks] = useState<UITrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId) {
      setTracks([]);
      return;
    }

    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("album_songs")
        .select(`
          position,
          songs (
            id, title, song_photo, song_link, created_at
          )
        `)
        .eq("album_id", albumId)
        .order("position", { ascending: true });

      if (error) {
        setError(error.message);
        setTracks([]);
      } 
      
      else {
        const rows = (data ?? []).map((r: any) => ({
          position: r.position ?? null,
          id: r.songs?.id,
          title: r.songs?.title ?? "",
          song_photo: r.songs?.song_photo ?? null,
          song_link: r.songs?.song_link ?? null,
          created_at: r.songs?.created_at ?? null,
        }));
        setTracks(rows);
      }
      setLoading(false);
    };

    fetchTracks();
  }, [albumId]);

  return { tracks, loading, error };
}
