import React, { useEffect, useMemo, useState } from "react";
import StageForm, { type StageFormValues } from "./StageForm";
import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import UploadAndEditAlbumsModal from "../uploadAndEditAlbumsModal"; // ✅ 경로 확인

dayjs.extend(utc);
dayjs.extend(tz);

export type UploadAndEditStageModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  albumId: number;
  artistId: number;
  initialStage?: {
    id?: number;
    start_at?: string;
    duration_hours?: number;
    promotion_url?: string | null;
    address_detail?: string | null;
    album_id?: number;
    venue?: {
      id: number;
      name: string;
      road_address: string | null;
      formatted_address: string | null;
    } | null;
  } | null;
  initialForm?: Partial<StageFormValues>;
  onChanged?: (kind: "created" | "updated" | "deleted", payload?: any) => void;
};

function toKakaoPlace(v?: {
  id: number;
  name: string;
  road_address: string | null;
  formatted_address: string | null;
} | null): KakaoPlace | null {
  if (!v) return null;
  return {
    id: String(v.id ?? ""),
    place_name: v.name ?? "",
    road_address_name: v.road_address ?? undefined,
    address_name: v.formatted_address ?? undefined,
    x: undefined as any,
    y: undefined as any,
  } as unknown as KakaoPlace;
}

export default function UploadAndEditStageModal(props: UploadAndEditStageModalProps) {
  const { open, onClose, mode, albumId, artistId, initialStage, initialForm, onChanged } = props;
  const { submitting, handleCreate, handleUpdate, handleDelete } = useUploadStageVM({
    albumId, artistId, initialStage, onChanged,
  });

  // ✅ 가사집 모달/동기화 상태
  const [albumsOpen, setAlbumsOpen] = useState(false);
  const [albumsRefreshTick, setAlbumsRefreshTick] = useState(0);      // StageForm 앨범 리스트 재조회 트리거
  const [createdAlbumId, setCreatedAlbumId] = useState<number | undefined>(undefined); // 방금 만든 앨범 자동선택
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ 모달 열릴 때 유저 ID 확보
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [open]);

  const fromInitialStage: Partial<StageFormValues> | undefined = useMemo(() => {
    if (!initialStage) return undefined;
    let date: string | undefined;
    let time: string | undefined;
    if (initialStage.start_at) {
      const kst = dayjs(initialStage.start_at).tz("Asia/Seoul");
      date = kst.format("YYYY-MM-DD");
      time = kst.format("HH:mm");
    }
    return {
      // title은 더 이상 사용하지 않음
      duration_hours: initialStage.duration_hours ?? 1,
      promotion_url: initialStage.promotion_url ?? undefined,
      address_detail: initialStage.address_detail ?? undefined,
      date,
      time,
      venue: toKakaoPlace(initialStage.venue),
      album_id: initialStage.album_id,
    };
  }, [initialStage]);

  // ✅ 방금 생성된 가사집이 있으면 그것을 우선 선택
  const mergedInitial = useMemo(
    () => ({ ...(fromInitialStage ?? {}), ...(initialForm ?? {}), ...(createdAlbumId ? { album_id: createdAlbumId } : {}) }),
    [fromInitialStage, initialForm, createdAlbumId]
  );

  const [headerNote, setHeaderNote] = useState<string>("");

  if (!open) return null;

  const onSubmit = async (values: StageFormValues) => {
    if (mode === "create") await handleCreate(values);
    else if (initialStage?.id) await handleUpdate(initialStage.id, values);
    onClose();
  };

  const onClickDelete = async () => {
    if (!initialStage?.id) return;
    if (!window.confirm("정말 삭제할까요? 이 동작은 되돌릴 수 없습니다.")) return;
    try {
      await handleDelete(initialStage.id);
      onClose();
    } catch (e: any) {
      alert(e?.message ?? "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[1px] grid place-items-center p-4">
      <div className="w-full max-w-xl md:max-w-2xl rounded-[28px] bg-white shadow-2xl overflow-hidden">
        {/* 헤더(단일 표시) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "공연 추가하기" : "공연 수정하기"}
          </h2>
          <div className="flex items-center gap-3">
            {headerNote && <div className="text-sm text-gray-500 hidden sm:block">{headerNote}</div>}
            {mode === "edit" && initialStage?.id ? (
              <button
                onClick={onClickDelete}
                disabled={submitting}
                className="px-3 py-1.5 rounded-full border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                삭제
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 본문: 흰 배경 유지, 인풋만 연회색 */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 bg-white">
          <StageForm
            mode={mode}
            artistId={artistId}
            initial={mergedInitial}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitting={submitting}
            onClickAddAlbum={() => {
              if (!userId) {
                alert("로그인 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
                return;
              }
              setAlbumsOpen(true);
            }}
            onDatePrettyChange={(pretty) => setHeaderNote(pretty)}
            /** ✅ 새 앨범 생성/수정 시 목록 재조회 */
            refreshAlbumsSignal={albumsRefreshTick}
          />
        </div>
      </div>

      {/* ✅ 가사집 추가/수정 모달 */}
      {albumsOpen && userId && (
        <UploadAndEditAlbumsModal
          isOpen={albumsOpen}
          onClose={() => setAlbumsOpen(false)}
          artistId={artistId}
          userId={userId}
          onChanged={(kind, payload) => {
            // StageForm 앨범 리스트 재조회
            setAlbumsRefreshTick((v) => v + 1);
            // 방금 만든 앨범 자동 선택
            if (kind === "created" && payload?.id) {
              setCreatedAlbumId(Number(payload.id));
            }
            // UX: 생성/수정 완료 시 닫기
            if (kind === "created" || kind === "updated") {
              setAlbumsOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
