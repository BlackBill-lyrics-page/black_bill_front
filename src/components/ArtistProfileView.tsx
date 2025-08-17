import { FiSettings, FiPlus } from "react-icons/fi";
import AlbumsList from "./AlbumList";
import SongList from "./SongList";

type Link = { platform: string; url: string };
type Genre = { id: number; name: string };
type Artist = {
  id: number;
  name: string;
  photoUrl?: string | null;
  label?: string | null;
  instruments?: string | null;
  genres: Genre[];
  links: Link[];
};

type Props = {
  artist: Artist;
  isOwner?: boolean; // ← 소유자 뷰면 true
  onEditProfile?: () => void;
  onAddSong?: () => void;
  onAddBook?: () => void;
  onAddStage?: () => void;
  activeTab : "songs" | "books" | "stages";
  setActiveTab : React.Dispatch<React.SetStateAction<"songs"|"books"|"stages">>;
};

export default function ArtistProfileView({
  artist,
  isOwner = false,
  onEditProfile,
  onAddSong,
  onAddBook,
  onAddStage,
  activeTab,
  setActiveTab,
}: Props) {
  
  return (
    <>
      {/* 상단 프로필 */}
      <div className="flex items-center gap-4 p-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {artist.photoUrl ? (
            <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <span>No Photo</span>
          )}
        </div>
        <h2 className="text-xl font-semibold">{artist.name}</h2>

        {isOwner && (
          <FiSettings
            className="w-6 h-6 text-gray-500 cursor-pointer"
            onClick={onEditProfile}
          />
        )}
      </div>

      {/* 상세 */}
      <div className="px-6 space-y-1 text-gray-600 text-sm">
        <div>
          <span className="font-semibold">장르:</span>{" "}
          {artist.genres?.length ? artist.genres.map(g => g.name).join(", ") : "-"}
        </div>
        <div><span className="font-semibold">소속사:</span> {artist.label || "-"}</div>
        <div><span className="font-semibold">구성:</span> {artist.instruments || "-"}</div>
      </div>

      {/* SNS 링크 (공통) */}
      <div className="px-6 mt-4 space-y-2">
        {artist.links?.length > 0 ? (
          artist.links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{link.platform}:</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate max-w-[200px]"
              >
                {link.url}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(link.url)}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                복사
              </button>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">등록된 SNS 링크 없음</div>
        )}
      </div>

      {/* 탭 + (오너만) 추가 버튼 */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <TabButton active={activeTab === "songs"} onClick={() => setActiveTab("songs")} label="곡" />
            <TabButton active={activeTab === "books"} onClick={() => setActiveTab("books")} label="가사집" />
            <TabButton active={activeTab === "stages"} onClick={() => setActiveTab("stages")} label="무대" />
          </div>

          {isOwner && (
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-black text-white hover:opacity-90"
              onClick={() => {
                if (activeTab === "songs") onAddSong?.();
                else if (activeTab === "books") onAddBook?.();
                else onAddStage?.();
              }}
            >
              <FiPlus />
              {activeTab === "songs" ? "곡 추가하기" : activeTab === "books" ? "가사집 추가하기" : "무대 추가하기"}
            </button>
          )}
        </div>

        {/* 리스트 영역 */}
        <div className="py-8 text-sm text-gray-400">
          {activeTab === "songs" && (
            <div className="text-gray-900">
              <SongList artistId={artist.id}/>
            </div>
          )}
          {activeTab === "books" && (
            <div className="text-gray-900">
              <AlbumsList artistId={artist.id} onEdit={isOwner ? () => {} : undefined} />
            </div>
          )}
          {activeTab === "stages" && (
            <div className="text-gray-400">(무대 콘텐츠 예정)</div>
          )}
        </div>
      </div>
    </>
  );
}

function TabButton({
  active, onClick, label,
}: { active: boolean; onClick: () => void; label: string; }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 transition ${active ? "text-black border-b-2 border-black" : "text-gray-500 hover:text-black"}`}
    >
      {label}
    </button>
  );
}
