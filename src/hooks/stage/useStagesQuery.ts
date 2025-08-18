// hooks/stage/useStagesQuery.ts
// ------------------------------------------------------------
// 책임
// - 특정 albumId 의 stage_info 목록을 서버에서 가져오는 순수 API 함수 제공
// - react-query 제거 버전
// ------------------------------------------------------------

import { supabase } from "../../lib/supabaseClient";

// StageInfo + Venue join 결과 타입
export type StageWithVenue = {
  id: number;
  album_id: number;
  venue_id: number | null;
  title: string | null;
  start_at: string; // ISO UTC
  duration_hours: number;
  end_at: string;
  promotion_url: string | null;
  address_detail: string | null;
  created_at: string;
  updated_at: string;
  venue: {
    id: number;
    name: string;
    road_address: string | null;
    formatted_address: string | null;
  } | null;
};

// ---------- 내부 유틸: Supabase 관계 결과(배열/객체) 정규화 ----------
function normalizeVenue(v: any): StageWithVenue["venue"] {
  if (!v) return null;
  if (Array.isArray(v)) {
    return v[0]
      ? {
          id: Number(v[0].id),
          name: String(v[0].name),
          road_address: v[0].road_address ?? null,
          formatted_address: v[0].formatted_address ?? null,
        }
      : null;
  }
  return {
    id: Number(v.id),
    name: String(v.name),
    road_address: v.road_address ?? null,
    formatted_address: v.formatted_address ?? null,
  };
}

function mapRowToStage(r: any): StageWithVenue {
  return {
    id: Number(r.id),
    album_id: Number(r.album_id),
    venue_id: r.venue_id === null ? null : Number(r.venue_id),
    title: r.title ?? null,
    start_at: String(r.start_at),
    duration_hours: Number(r.duration_hours),
    end_at: String(r.end_at),
    promotion_url: r.promotion_url ?? null,
    address_detail: r.address_detail ?? null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    venue: normalizeVenue(r.venue),
  };
}

/** 특정 앨범의 무대 목록 조회 (정렬: start_at 오름차순) */
export async function fetchAlbumStages(albumId: number): Promise<StageWithVenue[]> {
  const { data, error } = await supabase
    .from("stage_info")
    .select(
      `id, album_id, venue_id, title, start_at, duration_hours, end_at, promotion_url, address_detail, created_at, updated_at,
       venue:venue_id ( id, name, road_address, formatted_address )`
    )
    .eq("album_id", albumId)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stages: ${error.message}`);
  }
  return (data ?? []).map(mapRowToStage);
}

/** 다가오는 일주일 공연 목록 (선택 기능용, 필요 시 사용) */
export async function fetchUpcomingStages(): Promise<StageWithVenue[]> {
  const from = new Date();
  const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("stage_info")
    .select(
      `id, album_id, venue_id, title, start_at, duration_hours, end_at, promotion_url, address_detail, created_at, updated_at,
       venue:venue_id ( id, name, road_address, formatted_address )`
    )
    .gte("start_at", from.toISOString())
    .lt("start_at", to.toISOString())
    .order("start_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch upcoming stages: ${error.message}`);
  return (data ?? []).map(mapRowToStage);
}
