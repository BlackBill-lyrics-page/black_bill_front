// components/venue/VenueSearchModal.tsx
import React, { useState } from "react";
import type { KakaoPlace } from "../../hooks/stage/stageService";

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
  const [text, setText] = useState<string>(
    initial?.place_name ||
      initial?.road_address_name ||
      initial?.address_name ||
      ""
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">장소 찾기</h3>
          <button onClick={onClose} className="px-3 py-1 rounded-xl border">닫기</button>
        </div>

        <div className="grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">공연 장소</span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="장소 검색하기"
              className="border rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
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

        <div className="flex justify-end mt-5">
          <button
            className="w-full px-4 py-3 rounded-xl bg-black text-white disabled:opacity-30"
            disabled={!text.trim()}
            onClick={() => {
              // ★ 자유 입력을 KakaoPlace 호환 객체로 래핑해서 돌려줌
              const t = text.trim();
              const fakePlace: KakaoPlace = {
                id: String(Date.now()),
                place_name: t,
                // 사용자가 보통 주소 전체를 입력하므로 address_name 로도 채움
                address_name: t,
                road_address_name: t,
                x: undefined as any,
                y: undefined as any,
              } as unknown as KakaoPlace;
              onSelect(fakePlace); // 부모(StageForm)로 전달
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
