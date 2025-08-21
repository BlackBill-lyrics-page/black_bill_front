// StagePhotosModal.tsx
import { useEffect, useMemo, useRef } from "react";
import { Masonry, Image } from "gestalt";

type PhotoItem = {
  id: number;
  url: string;
  username?: string | null;
  naturalWidth?: number;
  naturalHeight?: number;
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
 
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 전체 아이템 플랫 (디버그용)
  const flatItems = useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.map((p) => ({
          id: p.id,
          url: p.url,
          username: p.username ?? "닉네임",
        }))
      ),
    [groups]
  );

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // ✅ ref가 준비되면에만 scrollContainer/virtualize 넘김
  const scrollerProps =
    scrollRef.current
      ? {
          scrollContainer: () => scrollRef.current as unknown as HTMLElement,
          virtualize: true,
          virtualBufferFactor: 1.2,
        }
      : {};

  return (
    <div className="fixed inset-0 z-[100] bg-black/60" onClick={onClose}>
      <div
        className="mx-auto mt-[5vh] w-[92vw] max-w-[1000px] h-[90vh] rounded-2xl bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        ref={scrollRef}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 py-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-semibold">공연 이미지</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            X
          </button>
        </div>

        {/* 섹션 헤더 + Masonry */}
        <div className="px-4 py-4 space-y-8">
          {groups.map((g) => (
            <section key={g.stageId} className="space-y-3">
              {(g.title || g.date) && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                  <span>{g.title ?? ""}</span>
                  <span>{g.date ? new Date(g.date).toLocaleDateString("ko-KR") : ""}</span>
                </div>
              )}

              {/* ✅ Masonry는 항상 렌더 (ref 조건 X) */}
              <Masonry
                items={g.items.map((p) => ({
                  id: p.id,
                  url: p.url,
                  username: p.username ?? "닉네임",
                  naturalWidth: p.naturalWidth ?? 1,
                  naturalHeight: p.naturalHeight ?? 1,
                }))}
                renderItem={({ data }) => (
                  <figure className="relative rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      alt=""
                      src={data.url}
                      // 최소 1 이상; 실제 원본 크기 알면 값 채우면 레이아웃 점프 줄어듦
                      naturalWidth={data.naturalWidth}
                      naturalHeight={data.naturalHeight}
                    />
                    {/* 이미지 위 오버레이 */}
                    <div className="absolute inset-x-0 bottom-0">
                      <div className="h-12 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 px-2 pb-2 text-[11px] text-white truncate pointer-events-none">
                        {data.username}
                      </div>
                    </div>
                  </figure>
                )}
                columnWidth={220}
                gutterWidth={16}
                minCols={2}
                layout="basicCentered"
                align="center"
                {...scrollerProps}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
