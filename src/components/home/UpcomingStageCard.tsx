// components/home/UpcomingStageCard.tsx
import { useEffect, useState } from "react";
import { FiImage } from "react-icons/fi";             // ✅ 아이콘
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
  const dateOnly = dayjs(stage.start_at).format("YYYY. MM. DD");
  const venue = stage.venue?.name ?? "장소 미정";

  const rawCover = stage.album?.photo_url?.trim() || "";
  const [showImg, setShowImg] = useState<boolean>(Boolean(rawCover));

  // 이미지 URL이 변경될 때 상태 초기화
  useEffect(() => {
    setShowImg(Boolean(rawCover));
  }, [rawCover]);

  return (
    <button
      onClick={onClick}
      aria-label={`${artistName} ${dateOnly} ${venue}`}
      className="
        relative overflow-hidden
        w-[121px] h-[121px] min-h-[40px]
        px-3 py-1
        rounded-xl border text-left
        hover:shadow-md transition
        flex flex-col justify-between items-start
      "
    >
      {/* 배경: 이미지가 있으면 이미지, 없거나 깨지면 명시적 플레이스홀더 */}
      {showImg ? (
        <>
          <img
            src={rawCover}
            alt=""
            loading="lazy"
            onError={() => setShowImg(false)}          // 실패 시 플레이스홀더로 전환
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-white/40" aria-hidden="true" />
        </>
      ) : (
        <div
          className="
            absolute inset-0 grid place-items-center
            bg-gray-200
          "
          aria-hidden="true"
        >
          <div className="flex flex-col items-center text-gray-500">
            <FiImage className="w-6 h-6" />
            <span className="mt-1 text-[10px] leading-none">이미지 없음</span>
          </div>
        </div>
      )}

      {/* 상단: 아티스트 이름 */}
      <div className="relative z-10 w-full">
        <div className="text-[13px] leading-tight font-medium truncate text-gray-900">
          {artistName}
        </div>
      </div>

      {/* 하단: 날짜 + 장소 */}
      <div className="relative z-10 w-full">
        <div className="text-[12px] leading-tight text-gray-900">{dateOnly}</div>
        <div className="text-[12px] leading-tight text-gray-900 truncate">{venue}</div>
      </div>
    </button>
  );
}
