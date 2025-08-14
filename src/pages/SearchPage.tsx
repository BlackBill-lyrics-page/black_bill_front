import { useSearchVM } from "../viewmodels/useSearchVM";
import { UserIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export default function SearchPage() {
  const navigate = useNavigate();
  const {
    allGenres,
    selectedGenres,
    toggleGenre,
    genreLoading,
    query,
    mode,
    setQuery,
    loading,
    noResult,
    result,
    resetSearch,
    selectedNames,
    handleRecentClick,
    recentSearches,
    saveRecentSearch,
    deleteRecentSearch,
  } = useSearchVM();


  const showNameResults = mode === "name" && query.trim().length >= 2;
  const showGenreResults = mode === "genre" && selectedGenres.length > 0; 

  const handleArtistClick = useCallback( //검색 결과 나온 아티스트 프로필 클릭시 -> naviage, 최근검색어 저장
    (a: { artist_id: number; name: string }) => {
      void saveRecentSearch(a.name);
      navigate(`/artist/${a.artist_id}`);
    },
    [navigate, saveRecentSearch]
  );

  if (genreLoading) return null;

  return (
    <>
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4">
        <span className="text-xl font-bold">LOGO</span>
        <button className="cursor-pointer" onClick={() => navigate("/my_audience")}>
          <UserIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* 검색창 */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3">
          <button onClick={resetSearch} className="mr-2">
            <span className="text-xl font-bold cursor-pointer">{'<'}</span>
          </button>

          <input
            type="text"
            placeholder="아티스트 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-gray-100 px-5 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>


      <div className="max-w-5xl mx-auto px-6 mt-8">
        {showNameResults && (
          <>
            <div className="text-sm text-gray-500 mb-3">아티스트</div>

            {loading && <div className="text-sm text-gray-500">검색중…</div>}

            {!loading && noResult && (
              <div className="text-sm text-gray-500">검색 결과가 없습니다.</div>
            )}

            {!loading && result.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                {result.map((a) => (
                  <li
                    key={a.artist_id}
                    className="group cursor-pointer"
                    onClick={() => handleArtistClick(a)} 
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-200 overflow-hidden mx-auto">
                      {a.photo_url ? (
                        <img
                          src={a.photo_url}
                          alt={a.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm sm:text-base font-medium truncate group-hover:underline">
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {a.genres?.length ? a.genres.map((g) => g.name).join(", ") : "장르"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* 2) name 모드인데 키워드 없음 → 최근 검색어 + 장르칩 (자리 유지) */}
        {!showNameResults && !showGenreResults && (
          <>
            <div className="text-sm text-gray-500 mb-2">최근 검색어</div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(q)}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <span>{q}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation(); // 검색 실행 막기
                      deleteRecentSearch(q); // 삭제 실행
                    }}
                    className="text-gray-500 hover:text-red-700"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-6 mb-2">장르 검색</div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g) => {
                const active = selectedGenres.includes(g.id);
                const disabled = !active && selectedGenres.length >= 3;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    disabled={disabled}
                    aria-pressed={active}
                    className={[
                      "px-3 py-1 rounded-full border text-sm transition",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
                      disabled && "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {showGenreResults && (
          <>
            {!loading && !noResult && result.length > 0 &&(
              <>
              <div className="text-sm text-gray-500 mb-3">장르</div>
              <div className="w-27 h-15 mb-6 bg-gray-100 rounded-lg flex items-center justify-center">{selectedNames}</div>
              <div className="w-full h-px bg-gray-300 mb-4"></div>
              </>     
              )}

            {!loading && !noResult &&(<div className="text-sm text-gray-500 mb-3">아티스트</div>)}

            {loading && <div className="text-sm text-gray-500">검색중…</div>}

            {!loading && noResult && (
              <div className="text-sm text-gray-500">검색 결과가 없습니다.</div>
            )}

            {!loading && result.length > 0 && (
            <>

              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                {result.map((a) => (
                  <li
                    key={a.artist_id}
                    className="group cursor-pointer"
                    onClick={() => handleArtistClick(a)}
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-200 overflow-hidden mx-auto">
                      {a.photo_url ? (
                        <img
                          src={a.photo_url}
                          alt={a.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm sm:text-base font-medium truncate group-hover:underline">
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {a.genres?.length ? a.genres.map((g) => g.name).join(", ") : "장르"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </> 
            )}
          </>
        )}
      </div>
    </>
  );
}
