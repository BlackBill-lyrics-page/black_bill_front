import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type TopAlbum = {
  album_id: number;
  albumname: string | null;
  album_photo: string | null;
  artist_name : string | null;
  artist_id : string | null;
};

// 주차 계산 유틸 (일요일 기준)
function weekIndexInMonthSundayStart(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0=Jan
  const first = new Date(y, m, 1);
  const firstDow = first.getDay(); // 0=Sun
  const offset = firstDow;
  return Math.floor((d.getDate() + offset - 1) / 7) + 1;
}

function formatWeekLabel(start: Date, end: Date) {
  const crossMonth = start.getMonth() !== end.getMonth();
  const labelDate = crossMonth ? end : start; // 걸치면 다음 달 기준
  const month = labelDate.getMonth() + 1;
  const week = crossMonth ? 1 : weekIndexInMonthSundayStart(labelDate);
  return `${month}월 ${week}번째 주`;
}

export function useHomeVM() {
  const [albums, setAlbums] = useState<TopAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState("");


   useEffect(() => {
    (async () => {
      setLoading(true);

      // 이번 주 시작/끝 계산 (일요일 기준)
      const now = new Date();
      const diffToSunday = now.getDay(); // 0=일
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSunday);
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

      // 주차 라벨 세팅
      setWeekLabel(formatWeekLabel(start, end));

      setLoading(false);
    })();
  }, []);

  return { albums, loading, weekLabel };
}
