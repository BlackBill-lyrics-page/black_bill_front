// // import { useState } from "react";
// // import { IoIosArrowBack } from "react-icons/io";
// // import { useHomeVM } from "../viewmodels/useHomeVM";
// // import { useNavigate } from "react-router-dom";
// // import { useUpcomingStagesVM } from "../viewmodels/useUpcomingStages";
// // import UpcomingStageCard from "../components/home/UpcomingStageCard";

// // function getWeekInfo(date = new Date()) {
// //     const month = date.getMonth() + 1;
// //     const day = date.getDate();

// //     const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
// //     const firstDayWeek = firstDay.getDay();

// //     const weekNumber = Math.ceil((day + firstDayWeek) / 7);

// //     return { month, weekNumber };
// // }

// // export default function HomePage() {
// //     const [view, setView] = useState<"home" | "album" | "stage">("home");
// //     const { month, weekNumber } = getWeekInfo();
// //     const { albums, loading } = useHomeVM();
// //     const navigate = useNavigate();
// //     // 공연 부분
// //     const [stagePage, setStagePage] = useState(0);
// //     // ✅ 추가: 현재 시각 이후 ~ 이번 달 말일까지, 가까운 순 정렬 (전체보기 섹션)    
// //     const {
// //         grouped: stageByDate,
// //         loading: stageLoading,
// //         error: stageError,
// //         hasMore,
// //     } = useUpcomingStagesVM({
// //         page: stagePage,
// //         pageSize: 40,
// //     });
// //     // ✅ 추가: 프리뷰(가로 스크롤)용 데이터 (최대 10개만)
// //     const {
// //         rows: previewStages,
// //         loading: previewLoading,
// //         error: previewError,
// //     } = useUpcomingStagesVM({
// //         limit: 10,
// //     });

// //     return (
// //         <div className="max-w-[700px] mx-auto px-4 sm:px-6">
// //             {view === "album" && (
// //                 <div>
// //                     <div className="flex items-center gap-2">
// //                         <button
// //                             onClick={() => setView("home")}
// //                         >
// //                             <IoIosArrowBack />
// //                         </button>
// //                         <div>{month}월 {weekNumber}번째 주 가사집</div>
// //                     </div>
// //                     <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 가장 좋아한 가사집이에요</div>

// //                   <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
// //                       {albums.map((a) => (
// //                         <button
// //                           key={a.album_id}
// //                           onClick={() =>
// //                             navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)
// //                           }
// //                           className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
// //                         >
// //                           <div className="aspect-[4/3] bg-gray-100">
// //                             <img
// //                               src={a.album_photo ?? undefined}
// //                               alt=""
// //                               className="w-full h-full object-cover"
// //                             />
// //                           </div>
// //                           <div className="p-2">
// //                             <div className="text-xs text-gray-500 truncate">{a.artist_name}</div>
// //                             <div className="text-[12px] font-medium truncate">{a.albumname}</div>
// //                           </div>
// //                         </button>
// //                       ))}
// //                     </div>
// //                 </div>
// //             )}

// //             {view === "stage" && (
// //                 <div className="mx-auto w-full max-w-[1200px] px-4">
// //                     {/* ...헤더/설명 그대로... */}

// //                     {stageByDate.map(({ date, items }) => (
// //                         <section key={date} className="px-1 mt-6">
// //                             <h3 className="text-sm text-gray-600 mb-2">{date}</h3>

// //                             {/* ✅ 3열(기본) / 6열(large) — 각 트랙 폭을 121px로 고정 */}
// //                             <div className="
// //           grid gap-3
// //           grid-cols-[repeat(3,_121px)]
// //           lg:grid-cols-[repeat(6,_121px)]
// //           justify-center                 /* ✅ 가운데 정렬 */
// //         ">
// //                                 {items.map((s) => (
// //                                     <UpcomingStageCard
// //                                         key={s.id}
// //                                         stage={s}
// //                                         onClick={() => navigate(`/artist/${s.artist?.id}?tab=stages&stageId=${s.id}`)}
// //                                     />
// //                                 ))}
// //                             </div>
// //                         </section>
// //                     ))}

// //                     {!stageLoading && !stageByDate.length && (
// //                         <div className="px-1 mt-6 text-sm text-gray-500">표시할 공연이 없어요.</div>
// //                     )}

// //                     {hasMore && !stageLoading && (
// //                         <div className="flex justify-center py-6">
// //                             <button onClick={() => setStagePage((p) => p + 1)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
// //                                 더보기
// //                             </button>
// //                         </div>
// //                     )}
// //                 </div>
// //             )}


// //             {view === "home" && (
// //                 <>
// //                     <div className="items-center flex">
// //                         <div className="w-60 h-60 bg-gray-200 flex items-center justify-center mt-10">
// //                         </div>
// //                         <div>ddddd</div>
// //                     </div>

// //                     <div className="justify-between flex mt-50 mb-4">
// //                         <div>{month}월 {weekNumber}번째 주 가사집</div>
// //                         <button
// //                             className="cursor-pointer"
// //                             onClick={() => setView("album")}
// //                         >
// //                             전체보기
// //                         </button>
// //                     </div>
// //                     <div className="mt-4 grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-3 sm:gap-4">
// //                       {albums.slice(0,6).map((a) => (
// //                         <button
// //                           key={a.album_id}
// //                           onClick={() =>
// //                             navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)
// //                           }
// //                           className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
// //                         >
// //                           <div className="aspect-[4/3] bg-gray-100">
// //                             <img
// //                               src={a.album_photo ?? undefined}
// //                               alt=""
// //                               className="w-full h-full object-cover"
// //                             />
// //                           </div>
// //                           <div className="p-2">
// //                             <div className="text-xs text-gray-500 truncate">{a.artist_name}</div>
// //                             <div className="text-[12px] font-medium truncate">{a.albumname}</div>
// //                           </div>
// //                         </button>
// //                       ))}
// //                     </div>

// //                     <div className="justify-between flex mt-10 mb-4">
// //                         <div>다가오는 공연</div>
// //                         <button className="cursor-pointer" onClick={() => setView("stage")}>
// //                             전체보기
// //                         </button>
// //                     </div>

// //                     {/* 프리뷰: 스크롤 제거 + 5개 고정 + 가운데 정렬 */}
// //                     <div className="pb-2">
// //                         {previewError && <div className="text-red-500">에러: {previewError}</div>}
// //                         {previewLoading && <div className="h-36">불러오는 중…</div>}
// //                         {!previewLoading && !previewError && (!previewStages || previewStages.length === 0) && (
// //                             <div className="text-sm text-gray-500">다가오는 공연이 없어요.</div>
// //                         )}

// //                         {!!previewStages?.length && (
// //                             <div
// //                                 className="
// //         grid gap-3
// //         grid-cols-[repeat(5,_121px)]   /* ✅ 고정 폭 121px × 5열 */
// //         justify-center                 /* ✅ 전체 그리드를 가운데 정렬 */
// //       "
// //                             >
// //                                 {previewStages.slice(0, 5).map((s) => (
// //                                     <UpcomingStageCard
// //                                         key={s.id}
// //                                         stage={s}
// //                                         onClick={() => navigate(`/artist/${s.artist?.id}?tab=stages`)}
// //                                     />
// //                                 ))}
// //                             </div>
// //                         )}
// //                     </div>


// //                 </>
// //             )}



// //         </div>
// //     )
// // }

// import { useState } from "react";
// import { IoIosArrowBack } from "react-icons/io";
// import { useHomeVM } from "../viewmodels/useHomeVM";
// import { useNavigate } from "react-router-dom";
// import { useUpcomingStagesVM } from "../viewmodels/useUpcomingStages";
// import UpcomingStageCard from "../components/home/UpcomingStageCard";

// function getWeekInfo(date = new Date()) {
//     const month = date.getMonth() + 1;
//     const day = date.getDate();

//     const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
//     const firstDayWeek = firstDay.getDay();

//     const weekNumber = Math.ceil((day + firstDayWeek) / 7);

//     return { month, weekNumber };
// }

// export default function HomePage() {
//     const [view, setView] = useState<"home" | "album" | "stage">("home");
//     const { month, weekNumber } = getWeekInfo();
//     const { albums, loading } = useHomeVM();
//     const navigate = useNavigate();

//     // 공연 부분
//     const [stagePage, setStagePage] = useState(0);

//     // 전체보기 섹션: 날짜별 그룹핑
//     const {
//         grouped: stageByDate,
//         loading: stageLoading,
//         error: stageError,
//         hasMore,
//     } = useUpcomingStagesVM({
//         page: stagePage,
//         pageSize: 40,
//     });

//     // 프리뷰(가로 스크롤)
//     const {
//         rows: previewStages,
//         loading: previewLoading,
//         error: previewError,
//     } = useUpcomingStagesVM({
//         limit: 10,
//     });

//     return (
//         <div className="max-w-[700px] mx-auto px-4 sm:px-6">
//             {view === "album" && (
//                 <div>
//                     <div className="flex items-center gap-2">
//                         <button
//                             onClick={() => setView("home")}
//                         >
//                             <IoIosArrowBack />
//                         </button>
//                         <div>{month}월 {weekNumber}번째 주 가사집</div>
//                     </div>
//                     <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 가장 좋아한 가사집이에요</div>

//                     <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
//                         {albums.map((a) => (
//                             <button
//                                 key={a.album_id}
//                                 onClick={() =>
//                                     navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)
//                                 }
//                                 className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
//                             >
//                                 <div className="aspect-[4/3] bg-gray-100">
//                                     <img
//                                         src={a.album_photo ?? undefined}
//                                         alt=""
//                                         className="w-full h-full object-cover"
//                                     />
//                                 </div>
//                                 <div className="p-2">
//                                     <div className="text-xs text-gray-500 truncate">{a.artist_name}</div>
//                                     <div className="text-[12px] font-medium truncate">{a.albumname}</div>
//                                 </div>
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//             )}


//             {view === "stage" && (
//                 <div>
//                     <div className="flex items-center gap-2">
//                         <button onClick={() => setView("home")}>
//                             <IoIosArrowBack />
//                         </button>
//                         <div>다가오는 공연</div>
//                     </div>
//                     <div className="text-gray-400 px-5 mt-2">가장 가까운 날짜의 공연이에요</div>

//                     {stageError && <div className="text-red-500 px-5 mt-3">에러: {stageError}</div>}
//                     {stageLoading && <div className="px-5 mt-3">불러오는 중…</div>}

//                     {/* ✅ 날짜별 구분 + 카드 그리드 (가사집 카드와 동일 규격의 그리드) */}
//                     {stageByDate.map(({ date, items }) => (
//                         <section key={date} className="px-1 mt-6">
//                             <h3 className="text-sm text-gray-600 mb-2">{date}</h3>
//                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
//                                 {items.map((s) => (
//                                     <UpcomingStageCard
//                                         key={s.id}
//                                         stage={s}
//                                         onClick={() =>
//                                             navigate(`/artist/${s.artist?.id}`, {
//                                                 state: { tab: "albums", albumId: s.album?.id }
//                                             })
//                                         }
//                                     />
//                                 ))}
//                             </div>
//                         </section>
//                     ))}

//                     {!stageLoading && !stageByDate.length && (
//                         <div className="px-5 mt-6 text-sm text-gray-500">표시할 공연이 없어요.</div>
//                     )}

//                     {hasMore && !stageLoading && (
//                         <div className="flex justify-center py-6">
//                             <button
//                                 onClick={() => setStagePage((p) => p + 1)}
//                                 className="px-4 py-2 rounded-lg border hover:bg-gray-50"
//                             >
//                                 더보기
//                             </button>
//                         </div>
//                     )}
//                 </div>
//             )}

//             {view === "home" && (
//                 <>
//                     <div className="items-center flex">
//                         <div className="w-60 h-60 bg-gray-200 flex items-center justify-center mt-10">
//                         </div>
//                         <div>ddddd</div>
//                     </div>

//                     <div className="justify-between flex mt-50 mb-4">
//                         <div>{month}월 {weekNumber}번째 주 가사집</div>
//                         <button
//                             className="cursor-pointer"
//                             onClick={() => setView("album")}
//                         >
//                             전체보기
//                         </button>
//                     </div>
//                     <div className="mt-4 grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-3 sm:gap-4">
//                         {albums.slice(0, 5).map((a) => (
//                             <button
//                                 key={a.album_id}
//                                 onClick={() =>
//                                     navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)
//                                 }
//                                 className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition text-left"
//                             >
//                                 <div className="aspect-[4/3] bg-gray-100">
//                                     <img
//                                         src={a.album_photo ?? undefined}
//                                         alt=""
//                                         className="w-full h-full object-cover"
//                                     />
//                                 </div>
//                                 <div className="p-2">
//                                     <div className="text-xs text-gray-500 truncate">{a.artist_name}</div>
//                                     <div className="text-[12px] font-medium truncate">{a.albumname}</div>
//                                 </div>
//                             </button>
//                         ))}
//                     </div>

//                     <div className="justify-between flex mt-10 mb-4">
//                         <div>다가오는 공연</div>
//                         <button className="cursor-pointer" onClick={() => setView("stage")}>
//                             전체보기
//                         </button>
//                     </div>

//                     {/* 여기서부터 프리뷰(가로 스크롤) */}
//                     <div className="pb-2">
//                         {previewError && <div className="text-red-500">에러: {previewError}</div>}
//                         {previewLoading && <div className="h-36">불러오는 중…</div>}
//                         {!previewLoading && !previewError && (!previewStages || previewStages.length === 0) && (
//                             <div className="text-sm text-gray-500">다가오는 공연이 없어요.</div>
//                         )}

//                         {!!previewStages?.length && (
//                             <div className="mt-4 grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-3 sm:gap-4">
//                                 {previewStages.slice(0, 5).map((s) => (
//                                     <UpcomingStageCard
//                                         key={s.id}
//                                         stage={s}
//                                         onClick={() =>
//                                             navigate(`/artist/${s.artist?.id}?tab=books&album=${s.album?.id}`)
//                                         }
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }

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
  const { albums } = useHomeVM();
  const navigate = useNavigate();

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
          <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 가장 좋아한 가사집이에요</div>

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
            {albums.slice(0,5).map((a) => (
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
        <div>
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
          <div className="items-center flex">
            <div className="w-60 h-60 bg-gray-200 flex items-center justify-center mt-10" />
            <div>ddddd</div>
          </div>

          <div className="justify-between flex mt-50 mb-4">
            <div>{month}월 {weekNumber}번째 주 가사집</div>
            <button className="cursor-pointer" onClick={() => setView("album")}>
              전체보기
            </button>
          </div>


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
            {albums.slice(0,5).map((a) => (
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


          <div className="justify-between flex mt-10 mb-4">
            <div>다가오는 공연</div>
            <button className="cursor-pointer" onClick={() => setView("stage")}>
              전체보기
            </button>
          </div>

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
                      const albumId = s.album?.id;
                      if (albumId) navigate(`/artist/${s.artist?.id}?tab=books&album=${albumId}`);
                      else navigate(`/artist/${s.artist?.id}?tab=books`);
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
