// src/components/stage/AlbumStagesPanel.tsx
// venue/type을 느슨하게 받고, 리스트 행 onClick으로 이벤트가 전파되지 않도록 처리

import { useState } from "react";

type Mode = "audience" | "artist";

// 문자열 venue 또는 {name} 객체 모두 허용
type VenueLike = string | { name?: string | null } | null | undefined;

// UIStage / UIStageLite를 모두 수용하는 느슨한 타입
export type StageLike = {
  id: number;
  title?: string | null;
  start_at?: string | null;
  venue?: VenueLike;
};

export default function AlbumStagesPanel({
  stages,
  mode,
}: {
  stages?: StageLike[] | null;
  mode: Mode;
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

  const label = mode === "artist" ? "연동무대정보 보기" : "무대 정보 더보기";

  // ✅ 빈 상태: 버튼 없이 메시지 **그대로** 노출
  if (!stages || stages.length === 0) {
    return (
      <div
        className="mt-1 text-xs text-gray-500"
        onClick={(e) => e.stopPropagation()} // 메시지 클릭해도 상위로 안 올라가도록
      >
        (연동된 무대 정보가 없습니다)
      </div>
    );
  }

  // ✅ 스테이지가 있을 때만 토글 버튼/패널 표시
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleToggle}
        className="text-xs text-gray-600 underline underline-offset-2"
      >
        {label}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border bg-white p-3" onClick={stopBubble}>
          <ul className="space-y-2 text-sm">
            {stages.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.title || `Stage #${s.id}`}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {venueToText(s.venue)} —{" "}
                    {s.start_at ? new Date(s.start_at).toLocaleString() : "-"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
