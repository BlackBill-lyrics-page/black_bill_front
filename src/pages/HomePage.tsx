import { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useHomeVM } from "../viewmodels/useHomeVM";
import { useNavigate } from "react-router-dom";
import { useUpcomingStagesVM } from "../viewmodels/useUpcomingStages";
import UpcomingStageCard from "../components/home/UpcomingStageCard";

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
    const { albums, loading } = useHomeVM();
    const navigate = useNavigate();
    // 공연 부분
    const [stagePage, setStagePage] = useState(0);
    // ✅ 추가: 현재 시각 이후 ~ 이번 달 말일까지, 가까운 순 정렬 (전체보기 섹션)    
    const {
        grouped: stageByDate,
        loading: stageLoading,
        error: stageError,
        hasMore,
    } = useUpcomingStagesVM({
        page: stagePage,
        pageSize: 40,
    });
    // ✅ 추가: 프리뷰(가로 스크롤)용 데이터 (최대 10개만)
    const {
        rows: previewStages,
        loading: previewLoading,
        error: previewError,
    } = useUpcomingStagesVM({
        limit: 10,
    });

    return (
        <div className="max-w-[700px] mx-auto">
            {view === "album" && (
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView("home")}
                        >
                            <IoIosArrowBack />
                        </button>
                        <div>{month}월 {weekNumber}번째 주 가사집</div>
                    </div>
                    <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 가장 좋아한 가사집이에요</div>

                    <div className="grid grid-cols-5 gap-4 mt-4">

                        {albums.map((a) => (
                            <div
                                key={a.album_id}
                                onClick={() => navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)}
                                className="relative bg-gray-200 rounded-lg w-32 h-40 overflow-hidden cursor-pointer"
                            >
                                {/* 앨범 이미지 */}
                                <img
                                    src={a.album_photo ?? undefined}
                                    alt={""}
                                    className="w-full h-full object-cover"
                                />

                                {/* 텍스트 영역 */}
                                <div className="absolute inset-0 flex flex-col justify-between p-2 text-xs">
                                    <div className="font-medium text-gray-900 truncate bg-white/70 px-1 rounded">
                                        {a.albumname}
                                    </div>
                                    <div className="text-gray-700 truncate bg-white/70 px-1 rounded">
                                        {a.artist_name}
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            )}

            {view === "stage" && (
                <div className="mx-auto w-full max-w-[1200px] px-4">
                    {/* ...헤더/설명 그대로... */}

                    {stageByDate.map(({ date, items }) => (
                        <section key={date} className="px-1 mt-6">
                            <h3 className="text-sm text-gray-600 mb-2">{date}</h3>

                            {/* ✅ 3열(기본) / 6열(large) — 각 트랙 폭을 121px로 고정 */}
                            <div className="
          grid gap-3
          grid-cols-[repeat(3,_121px)]
          lg:grid-cols-[repeat(6,_121px)]
          justify-center                 /* ✅ 가운데 정렬 */
        ">
                                {items.map((s) => (
                                    <UpcomingStageCard
                                        key={s.id}
                                        stage={s}
                                        onClick={() => navigate(`/artist/${s.artist?.id}?tab=stages&stageId=${s.id}`)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    {!stageLoading && !stageByDate.length && (
                        <div className="px-1 mt-6 text-sm text-gray-500">표시할 공연이 없어요.</div>
                    )}

                    {hasMore && !stageLoading && (
                        <div className="flex justify-center py-6">
                            <button onClick={() => setStagePage((p) => p + 1)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                                더보기
                            </button>
                        </div>
                    )}
                </div>
            )}


            {view === "home" && (
                <>
                    <div className="items-center flex">
                        <div className="w-60 h-60 bg-gray-200 flex items-center justify-center mt-10">
                        </div>
                        <div>ddddd</div>
                    </div>

                    <div className="justify-between flex mt-50 mb-4">
                        <div>{month}월 {weekNumber}번째 주 가사집</div>
                        <button
                            className="cursor-pointer"
                            onClick={() => setView("album")}
                        >
                            전체보기
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-4 mt-4">

                        {albums.map((a) => (
                            <div
                                key={a.album_id}
                                onClick={() => navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)}
                                className="relative bg-gray-200 rounded-lg w-32 h-40 overflow-hidden cursor-pointer"
                            >
                                {/* 앨범 이미지 */}
                                <img
                                    src={a.album_photo ?? undefined}
                                    alt={""}
                                    className="w-full h-full object-cover"
                                />

                                {/* 텍스트 영역 */}
                                <div className="absolute inset-0 flex flex-col justify-between p-2 text-xs">
                                    <div className="font-medium text-gray-900 truncate bg-white/70 px-1 rounded">
                                        {a.albumname}
                                    </div>
                                    <div className="text-gray-700 truncate bg-white/70 px-1 rounded">
                                        {a.artist_name}
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>

                    <div className="justify-between flex mt-10 mb-4">
                        <div>다가오는 공연</div>
                        <button className="cursor-pointer" onClick={() => setView("stage")}>
                            전체보기
                        </button>
                    </div>

                    {/* 프리뷰: 스크롤 제거 + 5개 고정 + 가운데 정렬 */}
                    <div className="pb-2">
                        {previewError && <div className="text-red-500">에러: {previewError}</div>}
                        {previewLoading && <div className="h-36">불러오는 중…</div>}
                        {!previewLoading && !previewError && (!previewStages || previewStages.length === 0) && (
                            <div className="text-sm text-gray-500">다가오는 공연이 없어요.</div>
                        )}

                        {!!previewStages?.length && (
                            <div
                                className="
        grid gap-3
        grid-cols-[repeat(5,_121px)]   /* ✅ 고정 폭 121px × 5열 */
        justify-center                 /* ✅ 전체 그리드를 가운데 정렬 */
      "
                            >
                                {previewStages.slice(0, 5).map((s) => (
                                    <UpcomingStageCard
                                        key={s.id}
                                        stage={s}
                                        onClick={() => navigate(`/artist/${s.artist?.id}?tab=stages`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>


                </>
            )}



        </div>
    )
}