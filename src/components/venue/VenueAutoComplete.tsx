// components/venue/VenueAutocomplete.tsx
// - Kakao Places 실시간 자동완성 인풋 (드롭다운)
// - 입력 → 디바운스 검색 → 목록 클릭/Enter로 선택 → onChange(place) 호출

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKakaoLoader } from "../../hooks/stage/useKakaoLoader";
import type { KakaoPlace } from "../../hooks/stage/stageService";

declare global {
  interface Window { kakao?: any; }
}

export type VenueAutocompleteProps = {
  value: KakaoPlace | null | undefined;
  onChange: (p: KakaoPlace | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  maxResults?: number;
};

export default function VenueAutocomplete({
  value,
  onChange,
  placeholder = "장소명/주소를 입력하세요 (예: 롤링홀)",
  disabled,
  className,
  autoFocus,
  maxResults = 10,
}: VenueAutocompleteProps) {
  const ready = useKakaoLoader(import.meta.env.VITE_KAKAO_JS_KEY!);

  const [keyword, setKeyword] = useState<string>(value?.place_name ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1); // 키보드 탐색용

  const svcRef = useRef<any>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Kakao Places 준비
  useEffect(() => {
    if (!ready) return;
    if (window.kakao?.maps?.services) {
      svcRef.current = new window.kakao.maps.services.Places();
    }
  }, [ready]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // value 바뀌면 input 동기화
  useEffect(() => {
    if (value?.place_name) setKeyword(value.place_name);
  }, [value?.place_name]);

  const toPlace = useCallback((item: any): KakaoPlace => ({
    id: String(item.id),
    place_name: String(item.place_name),
    address_name: item.address_name || undefined,
    road_address_name: item.road_address_name || undefined,
    phone: item.phone || undefined,
    place_url: item.place_url || undefined,
    x: item.x || undefined, // lng
    y: item.y || undefined, // lat
    raw: item,
  }), []);

  const doSearch = useCallback((kw: string) => {
    if (!svcRef.current || !kw.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setErr(null);
    svcRef.current.keywordSearch(
      kw.trim(),
      (data: any[], status: string) => {
        setLoading(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, maxResults));
          setOpen(true);
          setActiveIdx(-1);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setResults([]);
          setOpen(true);
          setActiveIdx(-1);
        } else {
          setErr("검색 중 오류가 발생했습니다.");
          setResults([]);
          setOpen(true);
        }
      },
      { size: maxResults }
    );
  }, [maxResults]);

  // 디바운스
  useEffect(() => {
    if (!ready) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      // 선택된 상태에서 같은 텍스트면 검색 생략
      if (value?.place_name && value.place_name === keyword.trim()) return;
      if (!keyword.trim()) { setResults([]); return; }
      doSearch(keyword);
    }, 250) as unknown as number;
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [keyword, doSearch, ready, value?.place_name]);

  const pick = (item: any) => {
    const place = toPlace(item);
    onChange(place);           // ✅ StageForm으로 즉시 반영
    setKeyword(place.place_name);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setKeyword("");
    setResults([]);
    setOpen(false);
  };

  // 키보드 탐색
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < results.length) {
        e.preventDefault();
        pick(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const inputDisabled = disabled || !ready || !svcRef.current;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full rounded-xl border px-3 py-2"
          placeholder={ready ? placeholder : "Kakao SDK 로딩 중…"}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          autoFocus={autoFocus}
        />
        {value ? (
          <button type="button" onClick={clear} className="px-2 py-2 rounded-xl border" title="선택 해제">해제</button>
        ) : null}
      </div>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
          {loading && <div className="px-3 py-2 text-sm text-gray-500">검색 중…</div>}
          {err && <div className="px-3 py-2 text-sm text-red-600">{err}</div>}

          {(!loading && !err && results.length === 0) ? (
            <div className="px-3 py-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            <ul className="max-h-72 overflow-auto divide-y">
              {results.map((r: any, i: number) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === activeIdx ? "bg-gray-50" : ""}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => pick(r)}
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
        </div>
      )}
    </div>
  );
}
