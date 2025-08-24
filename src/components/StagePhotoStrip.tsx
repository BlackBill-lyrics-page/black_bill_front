import { useMemo, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Comment = {
  id: number;
  photo_url?: string | null;
  users?: { username?: string | null } | null;
  updated_at?: string | null;
};

export default function StagePhotoStrip({
  comments,
  onOpenAll, // "전체보기" 버튼 
}: {
  comments: Comment[];
  onOpenAll: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // 이미지 있는 댓글만 추출
  const photos = useMemo(
    () =>
      (comments || [])
        .filter((c) => !!c.photo_url)
        .map((c) => ({
          id: c.id,
          url: c.photo_url as string,
          username: c.users?.username ?? "닉네임",
        })),
    [comments]
  );

  // 아무 이미지도 없으면 표시하지 않음
  if (!photos.length) return null;

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="mt-4 bg-white rounded-xl ">
      {/* 헤더: 공연 이미지 / 전체보기 */}
      <div className="flex items-center justify-between mb-2 py-4">
        <span className="text-sm font-semibold">공연 이미지</span>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          전체보기 
        </button>
      </div>

      {/* 가로 슬라이더 */}
      <div className="grid grid-cols-[15px_1fr_15px] items-center gap-2 h-40">
        {/* 좌측 화살표 */}
        <button
          type="button"
          aria-label="왼쪽으로"
          onClick={() => scrollByPage(-1)}
          className="h-full flex items-center justify-center"
        >
          <FiChevronLeft className="w-20 h-20" />
        </button>

        {/* 썸네일 트랙 */}
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar"
        >
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative shrink-0 w-28 h-36 rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={p.url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {/* 하단 그라데이션 + 닉네임 */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" /> 
              <div className="absolute inset-x-0 bottom-0 px-2 pb-1 text-[11px] text-white truncate">
                {p.username}
              </div>
            </div>
          ))}
        </div>

        {/* 우측 화살표 */}
        <button
          type="button"
          aria-label="오른쪽으로"
          onClick={() => scrollByPage(1)}
          className="h-full flex items-center justify-center"
        >
          <FiChevronRight className="w-20 h-20" />
        </button>
      </div>
    </div>
  );
}
