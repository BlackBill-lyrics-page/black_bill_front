import { useState } from "react";
import { IoIosArrowBack } from "react-icons/io"; 
import { useHomeVM } from "../viewmodels/useHomeVM";
import { useNavigate } from "react-router-dom";

function getWeekInfo(date=new Date()){
    const month=date.getMonth()+1;
    const day= date.getDate();

    const firstDay= new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeek= firstDay.getDay();

    const weekNumber = Math.ceil((day+firstDayWeek)/7);

    return {month, weekNumber};
}

export default function HomePage(){
    const [view, setView]= useState<"home"|"album"|"stage">("home");
    const {month, weekNumber}= getWeekInfo();
    const {albums, loading} = useHomeVM();
    const navigate = useNavigate();

    return(
        <div className="max-w-[700px] mx-auto">
            {view==="album" && (
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={()=>setView("home")}
                        >
                            <IoIosArrowBack/>
                        </button>
                        <div>{month}월 {weekNumber}번째 주 가사집</div>
                    </div>
                    <div className="text-gray-400 px-5 mt-2">이번 주, 관객이 가장 좋아한 가사집이에요</div>
                
                    <div className="grid grid-cols-5 gap-4 mt-4">

                        {albums.map((a) => (
                            <div
                              key={a.album_id}
                              onClick={()=>navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)}
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

            {view==="stage" && (
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={()=>setView("home")}
                        >
                            <IoIosArrowBack/>
                        </button>
                        <div>다가오는 공연</div>
                    </div>
                    <div className="text-gray-400 px-5 mt-2">가장 가까운 날짜의 공연이에요</div>

                    <div className="grid grid-cols-5 gap-4 mt-5">
                        <div className="bg-gray-200 h-50">1</div>
                        <div className="bg-gray-200 h-50">2</div>
                        <div className="bg-gray-200 h-50">3</div>
                        <div className="bg-gray-200 h-50">4</div>
                        <div className="bg-gray-200 h-50">5</div>
                        <div className="bg-gray-200 h-50">6</div>
                        <div className="bg-gray-200 h-50">7</div>
                        <div className="bg-gray-200 h-50">8</div>
                        <div className="bg-gray-200 h-50">9</div>
                        <div className="bg-gray-200 h-50">10</div>
                        <div className="bg-gray-200 h-50">11</div>
                    </div>
                </div>
            )}

            {view==="home" &&(
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
                            onClick={()=>setView("album")}
                        >
                        전체보기
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-4 mt-4">

                        {albums.map((a) => (
                            <div
                              key={a.album_id}
                              onClick={()=>navigate(`/artist/${a.artist_id}?tab=lyricsbook&album=${a.album_id}`)}
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
                        <button
                            className="cursor-pointer"
                            onClick={()=>setView("stage")}
                        >
                        전체보기
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                        <div className="bg-gray-200 h-50">1</div>
                        <div className="bg-gray-200 h-50">2</div>
                        <div className="bg-gray-200 h-50">3</div>
                        <div className="bg-gray-200 h-50">4</div>
                        <div className="bg-gray-200 h-50">5</div>
                    </div>
                </>
            )}

           

        </div>
    )
}