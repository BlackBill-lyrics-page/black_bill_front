import { useLayoutEffect, useRef, useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { useHomeVM } from "../viewmodels/useHomeVM";
import { useNavigate } from "react-router-dom";
import { useUpcomingStagesVM } from "../viewmodels/useUpcomingStages";
import UpcomingStageCard from "../components/home/UpcomingStageCard";
import logo from "../assets/HomeLogo.png"
import { pickHeroCopy } from "../contents/heroCopy";
import dayjs from "dayjs";

function NoWrapFit({
  text,
  max = 16,  // px: 기본 글자 크기(상한)
  min = 12,  // px: 최소 허용 크기(가독성 보장)
  className = "",
}: {
  text: string;
  max?: number;
  min?: number;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const parent = el.parentElement as HTMLElement;
    if (!parent) return;

    const compute = () => {
      // 먼저 최댓값으로 설정해 실제 너비를 측정
      el.style.fontSize = `${max}px`;
      // 줄바꿈 금지 상태에서 콘텐츠 실제 너비
      const contentW = el.scrollWidth;
      const boxW = parent.clientWidth || 1;
      // 선형 근사로 축소 비율 계산 (너비 ~ 폰트크기 근사 비례)
      const ratio = Math.min(1, boxW / contentW);
      const next = Math.max(min, Math.floor(max * ratio));
      setSize(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(parent);
    // iOS 등 시스템 폰트 조정에도 대응
    ro.observe(el);

    return () => ro.disconnect();
  }, [text, max, min]);

  return (
    <span
      ref={spanRef}
      style={{ fontSize: `${size}px` }}
      className={`block whitespace-nowrap ${className}`}
    >
      {text}
    </span>
  );
}

function getWeekInfo(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeek = firstDay.getDay();
  const weekNumber = Math.ceil((day + firstDayWeek) / 7);
  return { month, weekNumber };
}

export default function HomePage() {
  const [view, setView] = useState<"home" | "album" | "stage">("home");
  const { month, weekNumber } = getWeekInfo();
  const { albums } = useHomeVM();
  const navigate = useNavigate();

  // [ADDED] 뷰포트 폭에 맞춰 안전한 히어로 카피 선택
  const [vw, setVw] = useState<number>(() =>
    typeof window === "undefined" ? 360 : window.innerWidth
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const heroLines = pickHeroCopy(vw, { seed: performance.now() });

  // 공연 부분
  const [stagePage, setStagePage] = useState(0);

  // 전체보기: 날짜별 그룹핑
  const {
    grouped: stageByDate,
    loading: stageLoading,
    error: stageError,
    hasMore,
  } = useUpcomingStagesVM({
    page: stagePage,
    pageSize: 40,
  });

  // 프리뷰(홈 상단)
  const {
    rows: previewStages,
    loading: previewLoading,
    error: previewError,
  } = useUpcomingStagesVM({
    limit: 10,
  });

  return (
    <div className="max-w-[700px] mx-auto px-4 sm:px-6">
      {view === "album" && (
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("home")}>
              <IoIosArrowBack />
            </button>
            <div>{month}월 {weekNumber}번째 주 가사집</div>
          </div>
          <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 좋아한 가사집이에요</div>

          <div
            className="mt-4 grid gap-3 sm:gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
            {albums.map((a) => (
              <button
                key={a.album_id}
                onClick={() =>
                  navigate(`/artist/${a.artist_id}?tab=books&album=${a.album_id}`)
                }
                className=" overflow-hidden text-left"
              >
                {/* 앨범 커버 (정사각형) */}
                <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                  {a.album_photo ? (
                    <img
                      src={a.album_photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      이미지 없음
                    </div>
                  )}
                </div>

                {/* 텍스트 영역 */}
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {a.albumname}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {a.artist_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "stage" && (
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setView("home")}>
              <IoIosArrowBack />
            </button>
            <div>다가오는 공연</div>
          </div>
          <div className="text-gray-400 px-5 mt-2">가장 가까운 날짜의 공연이에요</div>

          {stageError && <div className="text-red-500 px-5 mt-3">에러: {stageError}</div>}
          {stageLoading && <div className="px-5 mt-3">불러오는 중…</div>}

          {/* [CHANGED] 그리드 규격을 가사집과 동일하게 */}
          {stageByDate.map(({ date, items }) => (
            <section key={date} className="px-1 mt-6">
              <h3 className="text-sm text-gray-600 mb-2">{date}</h3>
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-3 sm:gap-4">
                {items.map((s) => (
                  <UpcomingStageCard
                    key={s.id}
                    stage={s}
                    // [CHANGED] 공연 카드 클릭 → 가사집 탭(+해당 가사집이 있으면 바로 열기)
                    onClick={() => {
                      const albumId = s.album?.id;
                      if (albumId) navigate(`/artist/${s.artist?.id}?tab=books&album=${albumId}`);
                      else navigate(`/artist/${s.artist?.id}?tab=books`);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}

          {!stageLoading && !stageByDate.length && (
            <div className="px-5 mt-6 text-sm text-gray-500">표시할 공연이 없어요.</div>
          )}

          {hasMore && !stageLoading && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => setStagePage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                더보기
              </button>
            </div>
          )}
        </div>
      )}

      {view === "home" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,36%)] gap-4 items-start">
            {/* 로고: 모바일에서 살짝 톤 다운 → 텍스트가 주인공 */}
            <img
              src={logo}
              alt="Black Bill — 전봇대 위 갈매기"
              className="

                  block w-[300px] h-auto
                  max-h-[32dvh]
                  object-contain select-none
                  opacity-90 md:opacity-100
                "
              loading="eager"
              fetchPriority="high"
            />

            {/* 텍스트 컨테이너: 에디토리얼 프레이밍 */}
            <div className="mt-3 md:mt-0 text-left md:max-w-[38ch] max-w-[32ch]">
              {/* Eyebrow(큐레이션 라벨) */}
              {/* <div className="inline-flex items-center gap-2 mb-2 rounded-full border px-2 py-1 text-[11px] text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                오늘의 큐레이션
              </div> */}

              {/* 본문(시) */}
              <p className="leading-snug tracking-tight text-gray-800">
                {heroLines.map((line, i) =>
                  line === "" ? (
                    <span key={i} className="block h-2" aria-hidden="true" />
                  ) : (
                    <NoWrapFit
                      key={i}
                      text={line}
                      max={16}  // 상황에 맞게 15~18 조절
                      min={12}  // 너무 작아지지 않게 하한
                    />
                  )
                )}
              </p>

              {/* 바이라인 */}
              <div className="mt-2 text-xs text-gray-500">- BlackBill</div>
            </div>
          </div>

          {/* 스크롤 힌트(모바일) */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center md:hidden">
            <IoIosArrowDown className="text-gray-400 animate-bounce" />
          </div>




          <header className="mt-12 sm:mt-16 md:mt-20 mb-3 border-b border-gray-200">
            <div className="flex justify-between">
              <h2
                className="
         relative pb-2
         text-[16px] tracking-tight text-gray-900
         after:absolute after:left-0 after:bottom-[-1px]
         after:h-[2px] after:w-full after:bg-gray-900
       "
              >
                {month}월 {weekNumber}번째 주 가사집
              </h2>
              <button
                className="cursor-pointer inline-flex items-center gap-1
                  text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setView("album")}
              >
                전체보기
              </button>
            </div>
          </header>


          <div
            className="
              mt-4 grid gap-3 sm:gap-4
              grid-cols-3 sm:grid-cols-4 md:grid-cols-5

              [&>*]:block
              [&>*:nth-child(4)]:hidden
              [&>*:nth-child(5)]:hidden

              sm:[&>*:nth-child(4)]:block
              sm:[&>*:nth-child(5)]:hidden

              md:[&>*:nth-child(5)]:block
            "
          >
            {albums.slice(0, 5).map((a) => (
              <button
                key={a.album_id}
                onClick={() =>
                  navigate(`/artist/${a.artist_id}?tab=books&album=${a.album_id}`)
                }
                className=" overflow-hidden text-left"
              >
                {/* 앨범 커버 (정사각형) */}
                <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                  {a.album_photo ? (
                    <img
                      src={a.album_photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      이미지 없음
                    </div>
                  )}
                </div>

                {/* 텍스트 영역 */}
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {a.albumname}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {a.artist_name}
                  </div>
                </div>
              </button>
            ))}
          </div>


          <header className="mt-12 sm:mt-16 md:mt-20 mb-3 border-b border-gray-200">
            <div className="flex justify-between">
              <h2
                className="
         relative pb-2
         text-[16px] tracking-tight text-gray-900
         after:absolute after:left-0 after:bottom-[-1px]
         after:h-[2px] after:w-full after:bg-gray-900
       "
              >
                다가오는 공연
              </h2>
              <button
                className="cursor-pointer inline-flex items-center gap-1
                  text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setView("stage")}
              >
                전체보기
              </button>
            </div>
          </header>


          {/* [CHANGED] 공연 프리뷰: 동일한 그리드 + 6개로 통일 */}
          <div className="pb-2">
            {previewError && <div className="text-red-500">에러: {previewError}</div>}
            {previewLoading && <div className="h-36">불러오는 중…</div>}
            {!previewLoading && !previewError && (!previewStages || previewStages.length === 0) && (
              <div className="text-sm text-gray-500">다가오는 공연이 없어요.</div>
            )}

            {!!previewStages?.length && (
              <div className="
                mt-4 grid gap-3 sm:gap-4
                grid-cols-3 sm:grid-cols-4 md:grid-cols-5
                        
                [&>*]:block                               
                [&>*:nth-child(4)]:hidden                 
                [&>*:nth-child(5)]:hidden
                        
                sm:[&>*:nth-child(4)]:block               
                sm:[&>*:nth-child(5)]:hidden             
                        
                md:[&>*:nth-child(5)]:block              
              ">
                {previewStages.slice(0, 5).map((s) => (
                  <UpcomingStageCard
                    key={s.id}
                    stage={s}
                    onClick={() => {
                      const artistId = s.artist?.id;
                      const focusDate = dayjs(s.start_at).format("YYYY-MM-DD");
                      const params = new URLSearchParams({
                        tab: "stages",
                        focusDate,                 // 달력이 이 날짜의 "월"을 보이도록
                        stageId: String(s.id),     // (선택) 해당 스테이지 강조
                      });
                      navigate(`/artist/${artistId}?${params.toString()}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
