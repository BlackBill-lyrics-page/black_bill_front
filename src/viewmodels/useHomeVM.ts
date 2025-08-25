import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type TopAlbum = {
  album_id: number;
  albumname: string | null;
  album_photo: string | null;
  artist_name : string | null;
  artist_id : string | null;
};

export function useHomeVM() {
  const [albums, setAlbums] = useState<TopAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 이번 주 시작/끝 계산
      const now = new Date();
      const day = now.getDay(); // 0=일요일
      const diffToMonday = (day + 6) % 7; // 월요일 기준
      const start = new Date(now);
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      // RPC 호출
      const { data, error } = await supabase.rpc("top_albums_for_week", {
        p_week_start: start.toISOString(),
        p_week_end: end.toISOString(),
        p_limit: 20,
      });

      if (error) {
        console.error("RPC error", error);
      } else {
        setAlbums(data || []);
      }

      setLoading(false);
    })();
  }, []);

  return { albums, loading };
}
