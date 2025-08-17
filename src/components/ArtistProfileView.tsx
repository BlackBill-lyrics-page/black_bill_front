import { FiSettings, FiPlus } from "react-icons/fi";
import AlbumsList from "./AlbumList";
import SongList from "./SongList";
import type { UISong } from "./SongList";
import type { UIAlbum } from "./AlbumList";
import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiChevronRight } from "react-icons/fi"; 
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiApplemusic} from "react-icons/si";
import { useSongLikeVM } from "../viewmodels/useSongLikeVM";
import { FaHeart, FaRegHeart } from "react-icons/fa"; 
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";

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
  onEditSong?: (song: UISong) => void; 
  onEditBook?: (album: UIAlbum) => void;
  activeTab : "songs" | "books" | "stages";
  setActiveTab : React.Dispatch<React.SetStateAction<"songs"|"books"|"stages">>;
};

type SongDetail = {
  id: number;
  title: string;
  lyrics: string | null;
  bio: string | null;
  song_photo: string | null;
  song_link: string | null;
  created_at: string | null;
  links?: {platform : string; url:string}[];
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
  onEditBook,
  onEditSong,
}: Props) {

    const [openSong, setOpenSong] = useState<SongDetail | null>(null);
    const [openLoading, setOpenLoading] = useState(false);
    const detailRef = useRef<HTMLDivElement | null>(null);
    const {likeCount, liked, loading, toggleLike} = useSongLikeVM(openSong?.id);
    const { count } = useSongCommentVM(openSong?.id??null)

    const platformMeta = (p: string) => {
      const key = p.toLowerCase();
      if (key.includes("youtube"))  return { label: "YouTube",   Icon: FaYoutube,    className: "bg-red-50 hover:bg-red-100 text-red-600" };
      if (key.includes("spotify"))  return { label: "Spotify",   Icon: FaSpotify,    className: "bg-green-50 hover:bg-green-100 text-green-700" };
      if (key.includes("apple"))    return { label: "Apple Music", Icon: SiApplemusic, className: "bg-gray-50 hover:bg-gray-100 text-gray-800" };
      if (key.includes("sound"))    return { label: "SoundCloud", Icon: FaSoundcloud, className: "bg-orange-50 hover:bg-orange-100 text-orange-700" };
      return { label: p || "Link",  Icon: FaLink,                className: "bg-blue-50 hover:bg-blue-100 text-blue-700" };
    };


    const handleOpenSong = async (ui: UISong) => {
    
    if (openSong?.id === Number(ui.id)) { // if reselected -> closed
      setOpenSong(null);
      return;
    }

    try {
      setOpenLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select(`
            id,title,lyrics,bio,song_photo,song_link,created_at,
            song_links (platform, url)
        `)
        .eq("id", ui.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (!data) {
        setOpenSong(null);            
        return;
      }

      const detail: SongDetail = {
        id: data.id,
        title: data.title ?? "",
        lyrics: data.lyrics ?? null,
        bio: data.bio ?? null,
        song_photo: data.song_photo ?? null,
        song_link: data.song_link ?? null,
        created_at: data.created_at ?? null,
        links: (data.song_links || [] as {platform:string; url:string}[])
      };
    
      setOpenSong(detail);
      // 패널로 스크롤
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } finally {
      setOpenLoading(false);
    }
  };
  
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
                  <SongList 
                    artistId={artist.id} 
                    readOnly={!isOwner}
                    onEdit={onEditSong}
                    onOpen={handleOpenSong}
                  />

                  {(openLoading || openSong) && (
                    <div ref={detailRef} className="mt-6 rounded-xl bg-white">
                      {/* 헤더 */}
                      <div className="flex items-center gap-3 p-4">
                        
                        <div className="min-w-0 flex-1">
                          {!!openSong?.bio && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {openSong.bio}
                            </div>
                          )}
                        </div>

                    {/* 접기 버튼 */}
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-black"
                      onClick={() => setOpenSong(null)}
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 본문 */}
                  <div className="px-4 pb-4">
                    {openLoading ? (
                      <div className="text-sm text-gray-500 py-8">
                        불러오는 중…
                      </div>
                    ) : (
                      <>
                        {openSong?.links && openSong.links.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {openSong.links.map((L, i) => {
                              if (!L.url) return null;
                              const { label, Icon, className } = platformMeta(L.platform);
                              return (
                                <a
                                  key={i}
                                  href={L.url}
                                  target="_blank" //click ->new tab
                                  rel="noopener noreferrer" //security 1)tabnabbing 2)Referer header
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${className}`}
                                  title={label}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span>{label}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div className="max-h-96 overflow-y-auto whitespace-pre-line text-sm leading-6 text-gray-800"> 
                          {openSong?.lyrics || "가사가 비어 있습니다."}
                        </div>
                        <div className="w-full h-px bg-gray-300 mt-4"></div> 
                        <div className="mb-3 flex items-center gap-2 mt-4">
                            <button
                                type="button"
                                onClick={toggleLike}
                                disabled={loading||!openSong}
                                className="flex item-center gap-1 text-sm focus:outline-none"
                                aria-pressed={liked}
                            >
                                {liked?(
                                    <FaHeart className="w-5 h-5 text-black"/>
                                ):(
                                    <FaRegHeart className="w-5 h-5 text-black"/>
                                )}
                                <div className="mb-3 flex items-center gap-4">
                                    <span>좋아요 ({likeCount})</span>
                                    <span>댓글 ({count})</span>
                                </div>
                            </button>
                        </div>
                        {openSong&&(<SongCommentsInline songId={openSong.id}/>)}
                      </>
                    )}
                  </div>
                </div>
              )}
                    </div>
                  )}
                  {activeTab === "books" && (
                    <div className="text-gray-900">
                      <AlbumsList 
                        artistId={artist.id} 
                        readOnly={!isOwner}
                        onEdit={onEditBook}
                      />
                    </div>
                  )}
                  {activeTab === "stages" && (
                    <div className="text-gray-400">(무대 콘텐츠 예정)</div> //추후 구현
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

function SongCommentsInline({ songId }: { songId: number }) {
  const { comments, loading, addComment, editComment, deleteComment, count } = useSongCommentVM(songId);
  const [newComment, setNewComment] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  const startEdit = (id: number, current: string) => {
    setEditingId(id);
    setEditingText(current);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    const text = editingText.trim();
    if (!text) return;
    await editComment(editingId, text);
    cancelEdit();
  };

  return (
    <div className="mt-4 w-full">
      {/* 입력창 */}
      <div className="flex gap-2 mb-3">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button onClick={handleAdd} className="px-3 py-1 bg-black text-white rounded text-sm">
          등록
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500">불러오는 중…</p>}

      {/* 리스트 */}
      <ul className="space-y-2">
        {comments.map((c) => {
          const isEditing = editingId === c.id; //editing
          return (
            <li key={c.id} className="flex gap-2 items-start">
              <img
                src={c.users?.photo_url || "/default-avatar.png"}
                alt={c.users?.username}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{c.users?.username}</span>

                  {/* 우측 액션 */}
                  <div className="flex gap-2 text-xs text-gray-500">
                    {!isEditing ? (
                      <>
                        <button onClick={() => startEdit(c.id, c.comment)}>수정</button>
                        <button onClick={() => deleteComment(c.id)}>삭제</button>
                      </>
                    ) : (
                      <>
                        <button onClick={saveEdit} className="text-black">저장</button>
                        <button onClick={cancelEdit}>취소</button>
                      </>
                    )}
                  </div>
                </div>

                {/* 본문: 보기 vs 편집 */}
                {!isEditing ? (
                  <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
                ) : (
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    autoFocus
                  />
                )}

                <span className="text-xs text-gray-400">
                  {new Date(c.updated_at).toLocaleString()} 
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}