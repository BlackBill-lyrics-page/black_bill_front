// components/stage/UploadAndEditStageModal.tsx
import React, { useMemo } from "react";
import StageForm, { type StageFormValues } from "./StageForm";
import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import type { KakaoPlace } from "../../hooks/stage/stageService";

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
    title?: string | null;
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
      title: initialStage.title ?? "",
      duration_hours: initialStage.duration_hours ?? 1,
      promotion_url: initialStage.promotion_url ?? undefined,
      address_detail: initialStage.address_detail ?? undefined,
      date,
      time,
      venue: toKakaoPlace(initialStage.venue),
      album_id: initialStage.album_id,
    };
  }, [initialStage]);

  const mergedInitial = useMemo(
    () => ({ ...(fromInitialStage ?? {}), ...(initialForm ?? {}) }),
    [fromInitialStage, initialForm]
  );

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-5 max-h-[85vh] overflow-y-auto"> {/* ★ 스크롤 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "공연 추가하기" : "공연 수정하기"}
          </h2>
          <div className="flex items-center gap-2">
            {mode === "edit" && initialStage?.id ? (
              <button
                onClick={onClickDelete}
                disabled={submitting}
                className="px-3 py-1 rounded-xl border text-red-600 border-red-200 disabled:opacity-60"
              >
                삭제
              </button>
            ) : null}
            <button onClick={onClose} className="px-3 py-1 rounded-xl border">닫기</button>
          </div>
        </div>

        <StageForm
          mode={mode}
          artistId={artistId}
          initial={mergedInitial}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
          onClickAddAlbum={() => alert("가사집 추가하기를 연결하세요.")}
        />
      </div>
    </div>
  );
}