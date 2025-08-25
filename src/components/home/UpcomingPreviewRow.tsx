// ✅ NEW: Home 상단 "다가오는 공연" 섹션 프리뷰 전용
import { useNavigate } from "react-router-dom";
import UpcomingStageCard from "./UpcomingStageCard";
import { useUpcomingStagesVM } from "../../viewmodels/useUpcomingStages";

export default function UpcomingPreviewRow() {
  const nav = useNavigate();
  const { rows, loading, error } = useUpcomingStagesVM({ limit: 10 });

  if (error) return <div className="text-red-500 text-sm">에러: {error}</div>;
  if (loading) return <div className="h-36">불러오는 중…</div>;
  if (!rows?.length) return <div className="text-sm text-gray-500">다가오는 공연이 없어요.</div>;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {rows.map((s) => (
        <UpcomingStageCard
          key={s.id}
          stage={s}
          onClick={() => nav(`/stages/${s.id}`)}
        />
      ))}
    </div>
  );
}
