// StageSummary.tsx
// 프리뷰로 최신 무대 정보를 "날짜 시간 · 장소" 형태(또는 2줄)로 보여줍니다.
// venue는 문자열 또는 {name} 객체 모두 허용(AlbumStagesPanel과 동일하게 느슨한 타입)

type VenueLike = string | { name?: string | null } | null | undefined;
type StageLike = {
  title?: string | null;
  start_at?: string | null;
  venue?: VenueLike;
};

// 날짜/시간 포맷터: 2025. 07. 07. 19:30
function formatKDateTime(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(+d)) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function StageSummary({ stage }: { stage?: StageLike | null }) {
  if (!stage) return null;

  const when = formatKDateTime(stage.start_at);
  const venueText =
    typeof stage.venue === "string"
      ? stage.venue || "-"
      : stage.venue?.name ?? "-";



  // ▼ 한 줄로 "날짜시간 · 장소"를 원하면 위의 return 대신 아래를 쓰세요.
  return (
    <div className="mt-1 text-xs text-gray-700 truncate">
      {when} <span className="text-gray-400">·</span> {venueText}
    </div>
  );
}
