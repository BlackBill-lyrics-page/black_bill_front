// src/components/stage/AlbumStagesPanel.tsx
// 스샷 톤앤매너: 담백한 토글 라인 + 3열(장소/날짜/시간) 리스트
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

type Mode = "audience" | "artist";

// 문자열 venue 또는 {name} 객체 모두 허용
type VenueLike = string | { name?: string | null } | null | undefined;

// 느슨한 스테이지 타입 (end_at도 있으면 시간범위 표시)
export type StageLike = {
  id: number;
  title?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  startAt?: string | null; // 안전 처리용
  endAt?: string | null;   // 안전 처리용
  venue?: VenueLike;
};

export default function AlbumStagesPanel({
  stages,
  mode,
  className,
  rowClassName,
  leftClassName,
  rightClassName,
}: {
  stages?: StageLike[] | null;
  mode: Mode;
  // 화면마다 톤을 더 맞추고 싶을 때 외부에서 스타일 주입 가능
  className?: string;
  rowClassName?: string;
  leftClassName?: string;   // 장소 영역
  rightClassName?: string;  // 날짜/시간 래퍼
}) {
  const [open, setOpen] = useState(false);

  const handleToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation(); // 상위 li onClick 막기
    e.preventDefault();
    setOpen((v) => !v);
  };

  const stopBubble: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  const venueToText = (v: VenueLike): string => {
    if (!v) return "-";
    if (typeof v === "string") return v || "-";
    return v.name ?? "-";
  };

  const toDate = (iso?: string | null) => (iso ? new Date(iso) : null);

  const fmtDateDot = (d: Date | null) => {
    if (!d) return "-";
    // 2025. 07. 11 형식
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}. ${m}. ${day}`;
  };

  const fmtTime = (d: Date | null) => {
    if (!d) return "-";
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const fmtRange = (start?: string | null, end?: string | null) => {
    const s = toDate(start || null);
    const e = toDate(end || null);
    const left = fmtTime(s);
    if (e) return `${left} – ${fmtTime(e)}`;
    return left;
  };

  const label = mode === "artist" ? "연동 무대 정보 보기" : "무대 정보 더보기";

  // 빈 상태: 버튼 없이 메시지 노출 (상위 클릭 전파 방지)
  if (!stages || stages.length === 0) {
    return (
      <div
        className="mt-1 text-xs text-gray-500"
        onClick={(e) => e.stopPropagation()}
      >
        (연동된 무대 정보가 없습니다)
      </div>
    );
  }

  // 스테이지가 있을 때만 토글 버튼/패널 표시
  return (
    <div className="mt-1">
      {/* 토글 라인 (밑줄 X, 얌전한 텍스트 + 아이콘) */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-2 text-sm text-gray-700"
      >
        <span>{label}</span>
        {open ? (
          <FiChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div
          className={`rounded-md border border-gray-100 bg-white ${className ?? ""}`}
          onClick={stopBubble}
        >
          <ul className="divide-y divide-gray-100">
            {stages.map((s) => {
              const start = s.start_at ?? s.startAt ?? null;
              const end = s.end_at ?? s.endAt ?? null;
              const d = toDate(start);
              return (
                <li
                  key={s.id}
                  className={`flex items-center ${
                    rowClassName ?? "text-[13px] text-gray-800"
                  }`}
                >
                  {/* 장소(좌측 정렬) */}
                  <div className={`flex-1 py-3 pl-3 ${leftClassName ?? ""}`}>
                    <div className="truncate">{venueToText(s.venue)}</div>
                  </div>

                  {/* 날짜/시간(우측 정렬) */}
                  <div
                    className={`flex items-center gap-6 pr-3 text-gray-500 ${
                      rightClassName ?? ""
                    }`}
                  >
                    <span className="whitespace-nowrap">{fmtDateDot(d)}</span>
                    <span className="whitespace-nowrap">
                      {fmtRange(start, end)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
