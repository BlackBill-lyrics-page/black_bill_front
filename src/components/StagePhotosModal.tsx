import { useEffect, useMemo, useRef, useState } from "react";
import { Masonry, Image } from "gestalt";
import { downloadFromStorage, parseSupabasePublicUrl } from "../utility/download";
import { IoMdDownload, IoMdClose } from "react-icons/io";

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

type LightboxItem = {  // single photo modal
  id: number;
  url: string;
  username?: string | null;
};


async function handleDownloadFromUrl(url: string, fallbackName = "image") {
  const parsed = parseSupabasePublicUrl(url);
  if (!parsed) {
    // 만약 Supabase URL이 아니면 다른 방식으로 처리
    throw new Error("Not a Supabase public URL");
  }
  const ext = parsed.path.split(".").pop() || "jpg";
  await downloadFromStorage(parsed.bucket, parsed.path, `${fallbackName}.${ext}`);
}

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
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const [colW, setColW] = useState(150);
  const [gutter, setGutter] = useState(16);
  const [minCols, setMinCols] = useState(2);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // ref가 준비되면에만 scrollContainer/virtualize 넘김
  const scrollerProps =
    scrollRef.current
      ? {
          scrollContainer: () => scrollRef.current as unknown as HTMLElement,
          virtualize: true, // Gestalt library props -> Optimize items : only drawing seen items by users
          virtualBufferFactor: 1.2, // 1.2 times more rendering : avoid delay from scrolling down
        }
      : {};

  return (
    <div className="fixed inset-0 z-[100] bg-black/60" onClick={onClose}>
      <div
        className="mx-auto mt-[5vh] w-[92vw] max-w-[1000px] h-[90vh] rounded-2xl bg-white shadow-xl overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
        ref={scrollRef} // -> scrollerProps
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

        {/* section header + Masonry */}
        <div className="px-2 py-4 space-y-8">
          {groups.map((g) => (
            <section key={g.stageId} className="space-y-3">
              {(g.title || g.date) && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                  <span>{g.title ?? ""}</span>
                  <span>{g.date ? new Date(g.date).toLocaleDateString("ko-KR") : ""}</span>
                </div>
              )}

              {/*  Masonry는 항상 렌더 (ref 조건 X) */}
              <Masonry
                items={g.items.map((p) => ({ // renderItem={({ data })
                  id: p.id,
                  url: p.url,
                  username: p.username ?? "닉네임",
                  naturalWidth: p.naturalWidth ?? 1,
                  naturalHeight: p.naturalHeight ?? 1,
                }))}

                renderItem={({ data }) => (
                  <button
                    type="button"
                    onClick={() => setLightbox({ id: data.id, url: data.url, username: data.username })}
                    className="block w-full text-left"
                  >
                    <figure className="relative rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        alt=""
                        src={data.url}
                        naturalWidth={data.naturalWidth}
                        naturalHeight={data.naturalHeight}
                      />
                      <div className="absolute inset-x-0 bottom-0">
                        <div className="h-12 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 px-2 pb-2 text-[11px] text-white truncate pointer-events-none">
                          {data.username}
                        </div>
                      </div>
                    </figure>
                  </button>
                )}

                columnWidth={colW}
                gutterWidth={gutter}
                minCols={minCols}
                layout="basicCentered"
                align="center"
                {...scrollerProps}
              />
            </section>
          ))}
        </div>
      </div>
      {lightbox && (
          <div
            className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 상단 바 */}
              <div className="absolute top-2 right-2 flex gap-2">
                {/* 다운로드 아이콘 버튼 */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFromUrl(lightbox.url, `photo-${lightbox.id}`)
                  }
                  aria-label="다운로드"
                  title="다운로드"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow outline-none focus:ring-2 focus:ring-black/20"
                >
                  <IoMdDownload className="w-5 h-5" />
                </button>
                 <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  aria-label="닫기"
                  title="닫기"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow outline-none focus:ring-2 focus:ring-black/20"
                >
                  <IoMdClose className="w-5 h-5" />
                  {/* <span className="sr-only">닫기</span> */}
                </button>
              </div>

              {/* 이미지 */}
              <img
                src={lightbox.url}
                alt={lightbox.username ?? ""}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />

              {/* 하단 캡션 */}
              {lightbox.username && (
                <div className="mt-2 text-center text-white/90 text-sm">
                  {lightbox.username}
                </div>
              )}
            </div>
          </div>
        )}

    </div>
  );
}
