// components/venue/VenueAutoComplete.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useKakaoLoader } from "../../hooks/stage/useKakaoLoader";
import type { KakaoPlace } from "../../hooks/stage/stageService";

declare global { interface Window { kakao?: any; } }

export type VenueAutocompleteProps = {
  value: KakaoPlace | null | undefined;
  onChange: (p: KakaoPlace | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;        // wrapper <div>
  inputClassName?: string;   // 실제 <input> 스타일
  autoFocus?: boolean;
  maxResults?: number;
};

export default function VenueAutocomplete({
  value,
  onChange,
  placeholder = "장소명/주소를 입력하세요 (예: 롤링홀)",
  disabled,
  className,
  inputClassName,
  autoFocus,
  maxResults = 10,
}: VenueAutocompleteProps) {
  const ready = useKakaoLoader(import.meta.env.VITE_KAKAO_JS_KEY!);

  const [keyword, setKeyword] = useState<string>(value?.place_name ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const svcRef = useRef<any>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debounceRef = useRef<number | null>(null);
  const focusedRef = useRef(false);
  const [, _setFocused] = useState(false);
  const setFocused = (v: boolean) => { focusedRef.current = v; _setFocused(v); };

  const searchSeqRef = useRef(0);
  const mouseDownInsideRef = useRef(false); // ✅ 드롭다운 내부 클릭 보호

  useEffect(() => {
    if (!ready) return;
    if (window.kakao?.maps?.services) {
      svcRef.current = new window.kakao.maps.services.Places();
    }
  }, [ready]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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
    x: item.x || undefined,
    y: item.y || undefined,
    raw: item,
  }), []);

  const doSearch = useCallback((kw: string) => {
    if (!ready || !svcRef.current || !focusedRef.current || !kw.trim()) {
      setResults([]); setLoading(false); return;
    }
    setLoading(true); setErr(null);

    const mySeq = ++searchSeqRef.current;
    svcRef.current.keywordSearch(
      kw.trim(),
      (data: any[], status: string) => {
        if (mySeq < searchSeqRef.current) return; // 오래된 응답 무시
        setLoading(false);
        if (!focusedRef.current) { setOpen(false); return; }

        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, maxResults)); setActiveIdx(-1); setOpen(true);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setResults([]); setActiveIdx(-1); setOpen(true);
        } else {
          setErr("검색 중 오류가 발생했습니다."); setResults([]); setActiveIdx(-1); setOpen(true);
        }
      },
      { size: maxResults }
    );
  }, [maxResults, ready]);

  useEffect(() => {
    if (!focusedRef.current) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(keyword), 250) as unknown as number;
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [keyword, doSearch]);

  const hardClose = () => {
    searchSeqRef.current += 1;
    setOpen(false); setLoading(false); setErr(null);
  };

  const pick = (item: any) => {
    const place = toPlace(item);
    onChange(place);                 // ✅ 부모로 전달 → 모달 picked 채워짐
    setKeyword(place.place_name);
    hardClose(); setActiveIdx(-1);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    inputRef.current?.blur(); setFocused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && open && results.length > 0 && activeIdx >= 0 && activeIdx < results.length) {
      e.preventDefault();
      pick(results[activeIdx]);
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + results.length) % results.length); }
    else if (e.key === "Escape") { hardClose(); }
  };

  const inputDisabled = !!disabled;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`} style={{ position: "relative" }}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          className={inputClassName ?? "w-full rounded-xl border px-3 py-2"}
          placeholder={ready ? placeholder : "Kakao SDK 로딩 중…"}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => { setFocused(true); doSearch(keyword); setOpen(true); setActiveIdx(-1); }}
          onBlur={() => {
            setFocused(false);
            // ✅ 드롭다운 내부 클릭이면 닫지 않음 → onClick이 먼저 실행되게
            window.setTimeout(() => { if (!focusedRef.current && !mouseDownInsideRef.current) hardClose(); }, 0);
          }}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="venue-autocomplete-listbox"
        />
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden text-gray-900" // ✅ 텍스트 컬러 명시
          role="listbox"
          id="venue-autocomplete-listbox"
          onMouseDown={() => { mouseDownInsideRef.current = true; }}   // ✅ 클릭 보호
          onMouseUp={() => { mouseDownInsideRef.current = false; }}
        >
          {loading && <div className="px-3 py-2 text-sm text-gray-600">검색 중…</div>}
          {err && <div className="px-3 py-2 text-sm text-red-600">{err}</div>}

          {(!loading && !err && results.length === 0) ? (
            <div className="px-3 py-2 text-sm text-gray-600">검색 결과가 없습니다.</div>
          ) : (
            <ul className="max-h-72 overflow-auto divide-y">
              {results.map((r: any, i: number) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === activeIdx ? "bg-gray-50" : ""} text-gray-900`} // ✅ 항목 텍스트 컬러
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => pick(r)}
                  >
                    <div className="font-medium text-gray-900">{r.place_name}</div>      {/* ✅ 제목 색 */}
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
