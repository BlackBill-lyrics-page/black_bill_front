import { useEffect } from "react";

type PhotoItem = {
  id: number;
  url: string;
  username?: string | null;
};

type Group = {
  stageId: number;
  title?: string | null;
  date?: string | null; // ISO string
  items: PhotoItem[];
};

export default function StagePhotosModal({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: Group[];
}) {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-[5vh] w-[92vw] max-w-[1000px] h-[90vh] rounded-2xl bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">공연 이미지</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            X
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 space-y-8">
          {groups.map((g) => (
            <section key={g.stageId} className="space-y-3">
              {/* 섹션 헤더 (좌: 제목, 우: 날짜) */}
              {(g.title || g.date) && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{g.title ?? ""}</span>
                  <span>
                    {g.date ? new Date(g.date).toLocaleDateString("ko-KR") : ""}
                  </span>
                </div>
              )}

              {/* Masonry (CSS Columns) */}
              {/* columns-* 로 컬럼 수 지정, break-inside-avoid 로 카드 쪼개짐 방지 */}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]">
                {g.items.map((p) => (
                    <figure className="relative mb-4 break-inside-avoid rounded-xl overflow-hidden">
                      <img
                        src={p.url}
                        alt=""
                        className="block w-full h-auto"   // block으로 공백 제거
                        loading="lazy"
                      />
                    
                      {/* 오버레이를 이미지 위에 절대 배치 */}
                      <div className="absolute inset-x-0 bottom-0">
                        <div className="h-12 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 px-2 pb-2 text-[11px] text-white truncate pointer-events-none">
                          {p.username ?? "닉네임"}
                        </div>
                      </div>
                    </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}