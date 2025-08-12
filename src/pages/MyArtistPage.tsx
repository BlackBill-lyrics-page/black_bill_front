import { FiSettings } from "react-icons/fi";
import { useMyArtistVM } from "../viewmodels/useMyArtistVM";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ArtistProfileEditModal from "../components/ArtistProfileEditModal";
import { useArtistStore } from "../store/useArtistStore";
import { FiPlus } from "react-icons/fi";

export default function MyArtistPage() {
  const { artist : vmArtist, loading } = useMyArtistVM();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sArtist = useArtistStore((s) => s.artist);
  const finalArtist = sArtist?.id ? sArtist : vmArtist;  //기기 변경 시 로컬 데이터가 db덮어씀 : 추후 구현

  const [activeTab, setActiveTab] =
  useState<"songs" | "books" | "stages">("songs");

  if (loading) return <div className="p-6">로딩중...</div>;


  if (!finalArtist) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <img
            src="/default-profile.svg" 
            alt="기본 프로필"
            className="w-10 h-10 object-cover"
          />
        </div>
        <h2 className="mt-4 text-lg font-semibold">미등록 아티스트</h2>
            <button
              className="mt-4 px-4 py-2 bg-black text-white rounded-full"
              onClick={() => navigate("/set-profile-artist")}
            >
              아티스트 프로필 생성하기 +
            </button>
      </div>
    );
  }

  const selectedLink = finalArtist.links?.[selectedIndex] || null;

  return (
      <>
        <div className="flex items-center gap-4 p-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {finalArtist.photoUrl ? (
              <img
                src={finalArtist.photoUrl}
                alt={finalArtist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>No Photo</span>
            )}
          </div>
          <h2 className="text-xl font-semibold">{finalArtist.name}</h2>
          <FiSettings
            className="w-6 h-6 text-gray-500 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* 아티스트 상세 정보 */}
        <div className="px-6 space-y-1 text-gray-600 text-sm">
          <div>
            <span className="font-semibold">장르:</span>{" "}
            {finalArtist.genres.length > 0
              ? finalArtist.genres.map((g: any) => g.name).join(", ")
              : "-"}
          </div>
          <div>
            <span className="font-semibold">소속사:</span>{" "}
            {finalArtist.label || "-"}
          </div>
          <div>
            <span className="font-semibold">구성:</span>{" "}
            {finalArtist.instruments || "-"}
          </div>
        </div>
            
        {/* SNS 링크 */}
        <div className="px-6 mt-4 space-y-2">
          {finalArtist.links?.length > 0 ? (
            (() => {    
              return (
                <div className="flex items-center gap-2 text-sm">
                  {/* 플랫폼 선택 */}
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    {finalArtist.links.map((link: any, idx: number) => (
                      <option key={idx} value={idx}>
                        {link.platform}
                      </option>
                    ))}
                  </select>
                  
                  {/* URL */}
                  <a
                    href={selectedLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate max-w-[200px]"
                  >
                    {selectedLink.url}
                  </a>
                  
                  {/* 복사 버튼 */}
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedLink.url)}
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    복사
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="text-sm text-gray-500">등록된 SNS 링크 없음</div>
          )}
        </div>
        
        <div className="px-6 mt-6">
          {/* 탭 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <TabButton
                active={activeTab === "songs"}
                onClick={() => setActiveTab("songs")}
                label="곡"
              />
              <TabButton
                active={activeTab === "books"}
                onClick={() => setActiveTab("books")}
                label="가사집"
              />
              <TabButton
                active={activeTab === "stages"}
                onClick={() => setActiveTab("stages")}
                label="무대"
              />
            </div>

            {/* 탭별 추가하기 버튼 (원하는 경로로 바꾸세요) */}
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-black text-white hover:opacity-90"
              onClick={() => {
                if (activeTab === "songs") navigate("/add-song");      // 곡 추가 페이지
                else if (activeTab === "books") navigate("/add-lyric"); // 가사집 추가 페이지
                else navigate("/add-stage");                            // 무대/공연 추가 페이지
              }}
            >
              <FiPlus />
              {activeTab === "songs"
                ? "곡 추가하기"
                : activeTab === "books"
                ? "가사집 추가하기"
                : "무대 추가하기"}
            </button>
          </div>

  {/* 콘텐츠는 아직 미구현이므로 빈 공간만 */}
  <div className="py-8 text-sm text-gray-400">
    (콘텐츠 예정)
  </div>
</div>

        {/* 모달 */}
        {isModalOpen && (
          <ArtistProfileEditModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            artist={finalArtist}
          />
        )}
      </>
    );

}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 transition ${
        active ? "text-black border-b-2 border-black"
               : "text-gray-500 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

