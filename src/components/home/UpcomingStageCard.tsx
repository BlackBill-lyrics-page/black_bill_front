import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { UpcomingStage } from "../../viewmodels/useUpcomingStages";

export default function UpcomingStageCard({
  stage,
  onClick,
}: {
  stage: UpcomingStage;
  onClick?: () => void;
}) {
  const artistName = stage.artist?.name ?? "아티스트";
  const venue = stage.venue?.name ?? "장소 미정";

  // [NEW] 날짜 + 시간 → 좌상단 배지에 함께 노출
  const dateTime = useMemo(
    () => dayjs(stage.start_at).format("YYYY. MM. DD · HH:mm"),
    [stage?.start_at]
  );

  // [NEW] 커버 이미지 후보 + 오류 시 '이미지 없음' 처리
  const rawCover =
    stage.album?.photo_url?.trim() ||
    (stage as any)?.album?.cover_url?.trim?.() ||
    "";

  const [imgOk, setImgOk] = useState<boolean>(Boolean(rawCover));
  useEffect(() => setImgOk(Boolean(rawCover)), [rawCover, stage?.id]);

  return (
    <button
      onClick={onClick}
      className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
      aria-label={`${artistName} ${dateTime} ${venue}`}
      title={`${artistName} · ${dateTime} · ${venue}`}
    >
      {/* [CHANGED] 이미지 래퍼에 relative 추가 + 좌상단 배지 */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {imgOk ? (
          <img
            src={rawCover}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            이미지 없음
          </div>
        )}

        {/* [NEW] 날짜+시간 배지 (좌상단) */}
        <span className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] leading-none bg-black/70 text-white">
          {dateTime}
        </span>
      </div>

      {/* [CHANGED] 텍스트 구성 → 1) 아티스트  2) 장소 */}
      <div className="p-2">
        <div className="text-[12px] font-medium truncate">{artistName}</div>
        <div className="text-xs text-gray-500 truncate">{venue}</div>
      </div>
    </button>
  );
}
