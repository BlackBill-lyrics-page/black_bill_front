// stageService.ts
// 가사집 프로젝트 — Stage(무대) 서비스 레이어
// ------------------------------------------------------------
// 책임
// - Kakao 장소 선택 결과를 venue 테이블에 upsert → venueId 반환
// - stage_info 생성/수정/삭제 (end_at, updated_at 은 DB 트리거가 처리)
// - 프론트에서는 start_at을 ISO(UTC)로 넘겨줌 (표시는 Asia/Seoul)
// - duration_hours 는 0.5 단위, 0<h<=8.0 검증
// -----------------------------------------------------------

// stageService.ts (포스터 제거 버전)
import { supabase } from "../../lib/supabaseClient";

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name?: string;
  road_address_name?: string;
  phone?: string;
  place_url?: string;
  x?: string;
  y?: string;
  raw?: any;
};

export type CreateStageDTO = {
  album_id: number;
  venue_id: number | null;
  start_at: string;            // ISO(UTC)
  duration_hours: number;      // 0.5 step
  title?: string;
  promotion_url?: string;
  address_detail?: string;
};

type VenueRow = { id: number; provider: string; provider_place_id: string; name: string };
type StageInfoRow = { id: number };

export class StageServiceError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "StageServiceError";
    this.code = code;
  }
}

function isIsoString(v?: string): boolean {
  if (!v) return false;
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/.test(v);
}

function validateDuration(h: number) {
  if (!(h > 0 && h <= 8)) throw new StageServiceError("duration_hours must be > 0 and <= 8");
  if (!Number.isInteger(h * 2)) throw new StageServiceError("duration_hours must be in 0.5 increments");
}

function toVenueInsert(p: KakaoPlace) {
  const lat = p.y ? Number.parseFloat(p.y) : null;
  const lng = p.x ? Number.parseFloat(p.x) : null;
  return {
    provider: "kakao",
    provider_place_id: p.id,
    name: p.place_name,
    formatted_address: p.address_name ?? null,
    road_address: p.road_address_name ?? null,
    phone: p.phone ?? null,
    place_url: p.place_url ?? null,
    lat,
    lng,
    provider_payload: p.raw ?? null,
  } as const;
}

export async function upsertVenueFromKakao(p: KakaoPlace): Promise<number> {
  const payload = toVenueInsert(p);
  const { data, error } = await supabase
    .from("venue")
    .upsert(payload, { onConflict: "provider,provider_place_id" })
    .select("id")
    .single<VenueRow>();
  if (error) throw new StageServiceError(`Failed to upsert venue: ${error.message}`, error.code);
  if (!data?.id) throw new StageServiceError("Venue upsert succeeded but no id was returned");
  return data.id;
}

export async function createStage(dto: CreateStageDTO): Promise<number> {
  if (!isIsoString(dto.start_at)) throw new StageServiceError("start_at must be an ISO(UTC) string");
  validateDuration(dto.duration_hours);

  const insert = {
    album_id: dto.album_id,
    venue_id: dto.venue_id ?? null,
    start_at: dto.start_at,
    duration_hours: dto.duration_hours,
    title: dto.title ?? null,
    promotion_url: dto.promotion_url ?? null,
    address_detail: dto.address_detail ?? null,
  };

  const { data, error } = await supabase
    .from("stage_info")
    .insert(insert)
    .select("id")
    .single<StageInfoRow>();

  if (error) throw new StageServiceError(`Failed to create stage: ${error.message}`, error.code);
  if (!data?.id) throw new StageServiceError("Stage creation succeeded but no id was returned");
  return data.id;
}

export async function updateStage(id: number, dto: Partial<CreateStageDTO>): Promise<void> {
  if (!id) throw new StageServiceError("id is required");
  const patch: Record<string, any> = {};
  if (dto.album_id !== undefined) patch.album_id = dto.album_id;
  if (dto.venue_id !== undefined) patch.venue_id = dto.venue_id;
  if (dto.start_at !== undefined) {
    if (!isIsoString(dto.start_at)) throw new StageServiceError("start_at must be an ISO(UTC) string");
    patch.start_at = dto.start_at;
  }
  if (dto.duration_hours !== undefined) {
    validateDuration(dto.duration_hours);
    patch.duration_hours = dto.duration_hours;
  }
  if (dto.title !== undefined) patch.title = dto.title ?? null;
  if (dto.promotion_url !== undefined) patch.promotion_url = dto.promotion_url ?? null;
  if (dto.address_detail !== undefined) patch.address_detail = dto.address_detail ?? null;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("stage_info")
    .update(patch)
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw new StageServiceError(`Failed to update stage: ${error.message}`, error.code);
}

export async function deleteStage(id: number): Promise<void> {
  if (!id) throw new StageServiceError("id is required");
  const { error } = await supabase.from("stage_info").delete().eq("id", id);
  if (error) throw new StageServiceError(`Failed to delete stage: ${error.message}`, error.code);
}
