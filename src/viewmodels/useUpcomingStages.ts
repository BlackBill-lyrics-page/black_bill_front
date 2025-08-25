// 다가오는 공연 조회(프리뷰/전체보기 공용) — stage_info / albums / artists / venue 스키마용
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabaseClient";

export type UpcomingStage = {
  id: number;
  title: string | null;
  start_at: string; // ISO (UTC)
  end_at?: string | null;
  promotion_url?: string | null;
  // 관계 데이터 (분리조회로 매핑)
  artist: { id: number; name: string | null } | null;
  album: { id: number; albumname: string | null; photo_url: string | null } | null;
  venue: { id: number; name: string | null; formatted_address: string | null } | null;
};

type Options = {
  limit?: number;      // 프리뷰 개수 (ex. 10)
  page?: number;       // 전체보기 페이지
  pageSize?: number;   // 전체보기 페이지당 개수 (기본 40)
  from?: string;       // 시작 시점 ISO (기본: now)
  to?: string;         // 끝 시점 ISO (기본: 이번 달 말일)
};

export function useUpcomingStagesVM(opts: Options = {}) {
  const {
    limit,
    page = 0,
    pageSize = 40,
    from,
    to,
  } = opts;

  const [rows, setRows] = useState<UpcomingStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fromISO = useMemo(() => from ?? new Date().toISOString(), [from]);
  const toISO = useMemo(() => {
    if (to) return to;
    return dayjs().endOf("month").toDate().toISOString();
  }, [to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) stage_info 기본 필드만 조회 (관계는 나중에 따로)
        let q = supabase
          .from("stage_info")
          .select("id, title, start_at, end_at, promotion_url, album_id, venue_id")
          .gte("start_at", fromISO)
          .lte("start_at", toISO)
          .order("start_at", { ascending: true });

        const size = limit ?? pageSize;
        const fromRow = (limit ? 0 : page * size);
        const toRow = fromRow + size - 1;
        q = q.range(fromRow, toRow);

        const { data: stages, error: stagesErr } = await q;
        if (stagesErr) throw stagesErr;

        const base = stages ?? [];
        setHasMore(base.length >= size && !limit);

        if (base.length === 0) {
          if (!cancelled) setRows([]);
          return;
        }

        // 2) album, venue id 수집
        const albumIds = Array.from(new Set(base.map((r: any) => r.album_id).filter(Boolean)));
        const venueIds = Array.from(new Set(base.map((r: any) => r.venue_id).filter(Boolean)));

        // 3) 앨범/장소 병렬 조회
        const [albumsRes, venuesRes] = await Promise.all([
          albumIds.length
            ? supabase.from("albums").select("id, artist_id, albumname, photo_url").in("id", albumIds)
            : Promise.resolve({ data: [], error: null }),
          venueIds.length
            ? supabase.from("venue").select("id, name, formatted_address").in("id", venueIds)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (albumsRes.error) throw albumsRes.error;
        if (venuesRes.error) throw venuesRes.error;

        // 4) 아티스트 id 수집 후 조회
        const artistIds = Array.from(
          new Set((albumsRes.data ?? []).map((a: any) => a.artist_id).filter(Boolean))
        );

        const artistsRes = artistIds.length
          ? await supabase.from("artists").select("id, name").in("id", artistIds)
          : { data: [], error: null as any };

        if (artistsRes.error) throw artistsRes.error;

        // 5) 매핑 테이블
        const albumMap = new Map<number, { id: number; artist_id: number | null; albumname: string | null; photo_url: string | null }>();
        (albumsRes.data ?? []).forEach((a: any) => {
          albumMap.set(a.id, {
            id: a.id,
            artist_id: a.artist_id ?? null,
            albumname: a.albumname ?? null,
            photo_url: a.photo_url ?? null,
          });
        });

        const artistMap = new Map<number, { id: number; name: string | null }>();
        (artistsRes.data ?? []).forEach((ar: any) => {
          artistMap.set(ar.id, { id: ar.id, name: ar.name ?? null });
        });

        const venueMap = new Map<number, { id: number; name: string | null; formatted_address: string | null }>();
        (venuesRes.data ?? []).forEach((v: any) => {
          venueMap.set(v.id, {
            id: v.id,
            name: v.name ?? null,
            formatted_address: v.formatted_address ?? null,
          });
        });

        // 6) 결과 정규화
        const normalized: UpcomingStage[] = base.map((r: any) => {
          const alb = r.album_id ? albumMap.get(r.album_id) ?? null : null;
          const art = alb?.artist_id ? artistMap.get(alb.artist_id) ?? null : null;
          const ven = r.venue_id ? venueMap.get(r.venue_id) ?? null : null;

          return {
            id: r.id,
            title: r.title ?? null,
            start_at: r.start_at,
            end_at: r.end_at ?? null,
            promotion_url: r.promotion_url ?? null,
            artist: art,
            album: alb ? { id: alb.id, albumname: alb.albumname, photo_url: alb.photo_url } : null,
            venue: ven,
          };
        });

        if (!cancelled) setRows(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromISO, toISO, limit, page, pageSize]);

  // 날짜별 구분(YYYY. MM. DD)
  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingStage[]>();
    for (const s of rows) {
      const key = dayjs(s.start_at).format("YYYY. MM. DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [rows]);

  return { rows, grouped, loading, error, hasMore };
}
