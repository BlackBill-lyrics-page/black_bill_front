// src/hooks/stage/useAlbumsWithStages.ts
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/** Venue(UI) */
export type UIVenue = {
  id: number;
  name: string | null;
  road_address: string | null;
  formatted_address: string | null;
};

/** Stage(UI) */
export type UIStage = {
  id: number;
  title: string | null;
  start_at: string | null;         // ISO
  end_at?: string | null;
  duration_hours?: number | null;
  promotion_url?: string | null;
  venue?: UIVenue | null;
};

/** Album(UI)
 *  - id는 number로 통일
 *  - latestStage, stages를 리스트 UX에서 사용
 */
export type UIAlbum = {
  id: number;
  name: string | null;
  photoUrl?: string | null;
  createdAt?: string | null;
  commentCount?: number;
  latestStage?: UIStage | null;
  stages?: UIStage[];
};

type Options =
  | { artistId: number; albumIds?: never; isPublicOnly?: boolean }
  | { artistId?: never; albumIds: number[]; isPublicOnly?: boolean }
  | { artistId?: number; albumIds?: number[]; isPublicOnly?: boolean }; // 유연성

export function useAlbumsWithStages(opts: Options = {}) {
  const { artistId, albumIds, isPublicOnly } = opts;
  const [data, setData] = useState<UIAlbum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let q = supabase
      .from("albums")
      .select(`
        id, name:albumname, photo_url, created_at,
        latest:stage_info(
          id, title, start_at, end_at, duration_hours, promotion_url,
          venue:venue_id ( id, name, road_address, formatted_address )
        ),
        stages:stage_info(
          id, title, start_at, end_at, duration_hours, promotion_url,
          venue:venue_id ( id, name, road_address, formatted_address )
        )
      `)
      .order("created_at", { ascending: false });

    if (artistId != null) q = q.eq("artist_id", artistId);
    if (albumIds && albumIds.length) q = q.in("id", albumIds);
    if (isPublicOnly) q = q.eq("is_public", true);

    // 중첩 정렬/리밋: latest는 1건만, stages는 최신순 전체
    q = q
      .order("start_at", { foreignTable: "latest", ascending: false, nullsFirst: false })
      .limit(1, { foreignTable: "latest" })
      .order("start_at", { foreignTable: "stages", ascending: false, nullsFirst: false });

    q.then(({ data: rows, error }) => {
      if (error) {
        console.error("[useAlbumsWithStages]", error);
        setData([]);
        setLoading(false);
        return;
      }

      const mapped: UIAlbum[] = (rows ?? []).map((r: any) => ({
        id: Number(r.id),
        name: r.name ?? null,
        photoUrl: r.photo_url ?? null,
        createdAt: r.created_at ?? null,
        commentCount: 0, // 필요 시 외부에서 합산해도 됨
        latestStage: (r.latest?.[0] ?? null) as UIStage | null,
        stages: (r.stages ?? []) as UIStage[],
      }));

      setData(mapped);
      setLoading(false);
    });
  }, [artistId, JSON.stringify(albumIds), isPublicOnly]); // albumIds 배열 감지

  return { data, loading };
}
