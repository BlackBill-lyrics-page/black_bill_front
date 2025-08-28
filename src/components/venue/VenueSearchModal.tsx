// components/venue/VenueSearchModal.tsx
import React, { useState } from "react";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import VenueAutocomplete from "./VenueAutoComplete";

export default function VenueSearchModal({
  open,
  onClose,
  onSelect,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (p: KakaoPlace) => void;
  initial?: KakaoPlace;
}) {
  const [picked, setPicked] = useState<KakaoPlace | null>(initial ?? null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold">장소 찾기</h3>
          <button onClick={onClose} className="px-3 py-1 rounded-xl border">닫기</button>
        </div>

        <div className="grid gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-base font-bold">공연 장소</span>

            <VenueAutocomplete
              value={picked}
              onChange={setPicked}
              placeholder="장소 검색하기"
              autoFocus
              // ✅ input에 직접 적용될 클래스
              inputClassName="
    w-full px-4 py-3
    bg-[#F3F4F6] text-gray-800 placeholder-gray-400
    border-0 outline-none ring-0 focus:ring-0 focus:outline-none
    shadow-none appearance-none
    rounded-md
  "
            />
          </label>

          <div className="text-sm">
            <div className="text-gray-600 font-medium">이렇게 검색해 보세요</div>
            <ul className="mt-1 text-gray-500 space-y-1 list-disc list-inside">
              <li>도로명 + 건물번호 (마들로 127)</li>
              <li>건물명 + 번지 (방이동 44-2)</li>
              <li>건물명, 아파트명 (반포 자이, 분당 주공 1차)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            className="
              flex-1 h-12 px-4
              rounded-none                      /* 각진 버튼 */
              text-gray-800
              disabled:opacity-30 disabled:cursor-not-allowed
            "
            style={{ backgroundColor: "#F3F4F6" }}  // 고정 색상
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              onSelect(picked);
              onClose();
            }}
          >
            찾기
          </button>
        </div>
      </div>
    </div>
  );
}
