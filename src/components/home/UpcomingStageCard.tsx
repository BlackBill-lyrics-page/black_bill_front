// ✅ NEW: 프리뷰/전체보기에서 공용으로 쓰는 카드
import dayjs from "dayjs";
import type { UpcomingStage } from "../../viewmodels/useUpcomingStages";

export default function UpcomingStageCard({
  stage,
  onClick
}: {
  stage: UpcomingStage;
  onClick?: () => void;
}) {
  const artistName = stage.artist?.name ?? "아티스트";
  const when = dayjs(stage.start_at).format("YYYY. MM. DD HH:mm");
  const venue = stage.venue?.name ?? "장소 미정";

  const cover =
    stage.album?.photo_url ||
    "/placeholder.png";

  return (
    <button
      onClick={onClick}
      className="w-32 sm:w-36 rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
      aria-label={`${artistName} ${when} ${venue}`}
    >
      <div className="aspect-[4/3] bg-gray-100">
        <img src={cover} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-2">
        <div className="text-xs text-gray-500 truncate">{artistName}</div>
        <div className="text-[12px]">{when}</div>
        <div className="text-[12px] text-gray-600 truncate">{venue}</div>
      </div>
    </button>
  );
}
