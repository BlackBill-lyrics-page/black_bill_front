// components/venue/VenueSearchModal.tsx
// ------------------------------------------------------------------
// - Kakao Places 키워드 검색 모달 (동적 SDK 로더 사용)
// ------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import { useKakaoLoader } from "../../hooks/stage/useKakaoLoader";

declare global {
  interface Window { kakao?: any; }
}

export default function VenueSearchModal({
  initialKeyword = "",
  onClose,
  onPick,
}: {
  initialKeyword?: string;
  onClose: () => void;
  onPick: (p: KakaoPlace) => void;
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svcRef = useRef<any>(null);

  // ✅ Kakao SDK 준비 (env에서 키 읽기)
  const ready = useKakaoLoader(import.meta.env.VITE_KAKAO_JS_KEY!);

  // SDK 준비되면 Places 인스턴스 생성
  useEffect(() => {
    if (ready && window.kakao?.maps?.services) {
      svcRef.current = new window.kakao.maps.services.Places();
    }
  }, [ready]);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const search = useCallback(() => {
    if (!svcRef.current || !keyword.trim()) return;
    setLoading(true);
    setError(null);
    svcRef.current.keywordSearch(
      keyword.trim(),
      (data: any[], status: string) => {
        setLoading(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, 10));
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setResults([]);
        } else {
          setError("검색 중 오류가 발생했습니다.");
        }
      },
      { size: 10 }
    );
  }, [keyword]);

  // Enter로 검색
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) search();
  };

  const select = (item: any) => {
    const place: KakaoPlace = {
      id: String(item.id),
      place_name: String(item.place_name),
      address_name: item.address_name || undefined,
      road_address_name: item.road_address_name || undefined,
      phone: item.phone || undefined,
      place_url: item.place_url || undefined,
      x: item.x || undefined, // lng (string)
      y: item.y || undefined, // lat (string)
      raw: item,
    };
    onPick(place);
  };

  const disabled = !keyword.trim() || !svcRef.current;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="relative w-[420px] max-w-[92vw] bg-white rounded-2xl p-4 shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">장소 찾기</h3>
          <button onClick={onClose} className="text-gray-500" aria-label="닫기">
            ✕
          </button>
        </div>

        {/* 입력 */}
        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-2">공연 장소</label>
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2"
            placeholder={ready ? "장소명, 주소, 건물명 등" : "Kakao SDK 준비 중…"}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            disabled={!ready}
          />
        </div>

        {/* 가이드 */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-2">이렇게 검색해 보세요</div>
          <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
            <li>도로명 + 건물번호 (마들로 127)</li>
            <li>건물명 + 번지 (방이동 44-2)</li>
            <li>건물명, 아파트명 (반포 자이, 분당 주공 1차)</li>
          </ul>
        </div>

        {/* 찾기 버튼 */}
        <button
          className={`w-full rounded-2xl px-4 py-3 mb-3 ${
            disabled ? "bg-gray-200 text-gray-400" : "bg-black text-white"
          }`}
          disabled={disabled}
          onClick={search}
        >
          찾기
        </button>

        {/* 상태 */}
        {!ready && <div className="text-sm text-gray-500">Kakao SDK 로딩 중…</div>}
        {loading && <div className="text-sm text-gray-500">검색 중…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* 결과 */}
        {results.length > 0 && (
          <ul className="mt-2 max-h-72 overflow-auto border rounded-xl divide-y">
            {results.map((r: any) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => select(r)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium">{r.place_name}</div>
                  <div className="text-xs text-gray-600">
                    {r.road_address_name || r.address_name}
                  </div>
                  {r.phone && <div className="text-xs text-gray-500">{r.phone}</div>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* SDK 미로딩 안내 */}
        {!svcRef.current && ready && (
          <div className="text-sm text-gray-500 mt-2">
            Kakao Places 서비스 초기화 대기 중…
          </div>
        )}
      </div>
    </div>
  );
}
