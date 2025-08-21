import { useState, useEffect, useRef } from "react";
import { FiSettings, FiPlus } from "react-icons/fi";
import ProfileModal from "../components/ProfileModal";
import { useMyAudienceVM } from "../viewmodels/useMyAudienceVM";
import { useUserStore } from "../store/useUserStore";
import { useNavigate } from "react-router-dom";
import RoleSwitcher from "../components/RoleSwitcher";
import AlbumsList from "../components/AlbumList";
import { supabase } from "../lib/supabaseClient";
import type { UIAlbum } from "../components/AlbumList";
import LikedAlbumDetail from "../components/LikedAlbumDetail";
import SongCommentsInline from "../components/SongCommentsInline";

import LikedSongsList from "../components/LikedSongsList";
import SongDetailPanel from "../components/SongDetailPanel";
import { useSongDetail } from "../hooks/useSongDetail";
import type { UISong } from "../components/SongList";
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";

import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";

type IconLike = React.ComponentType<{ className?: string }>;
const makeImgIcon = (src: string, alt: string): IconLike => {
  const ImgIcon: IconLike = ({ className }) => (
    <img src={src} alt={alt} className={className} />
  );
  return ImgIcon;
};

const YoutubeMusicIcon = makeImgIcon(ytMusicPng, "YouTube Music");
const MelonIcon = makeImgIcon(melonPng, "Melon");

export default function MyAudiencePage() {
  const { userId, provider, nickname, photoUrl, loading, signOut, deleteAccount } =
    useMyAudienceVM();

  const sName = useUserStore((s) => s.username);
  const sPhoto = useUserStore((s) => s.photoUrl);

  const displayName = sName || nickname;
  const displayPhoto = sPhoto || photoUrl || "/default-profile.svg";

  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<  //tab state
    "songs" | "books" | "artists" | "stages"
  >("songs");

  const [albums, setAlbums] = useState<UIAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<UIAlbum | null>(null);

  const [likedSongs, setLikedSongs] = useState<UISong[]>([]);
  const songDetail = useSongDetail();

  useEffect(() => {
  if (!userId) return;
  (async () => {
    const { data: liked, error: e1 } = await supabase
      .from("song_liked").select("song_id").eq("user_id", userId);
    if (e1) { console.error(e1); setLikedSongs([]); return; }

    const ids = (liked ?? []).map(x => x.song_id).filter(Boolean);
    if (!ids.length) { setLikedSongs([]); return; }

    const { data: rows, error: e2 } = await supabase
      .from("songs")
      .select("id,title,song_photo,created_at, artist_id, artists(name)")
      .in("id", ids);
    if (e2) { console.error(e2); setLikedSongs([]); return; }
 
    const ui = (rows ?? []).map(r => ({
      id: String(r.id),
      title: r.title ?? "",
      photoUrl: r.song_photo ?? null,
      createdAt: r.created_at ?? null,
      artistName: (r as any).artists?.name??null,
    }))as UISong[];
    ui.sort((a,b)=> ids.indexOf(Number(a.id)) - ids.indexOf(Number(b.id)));
    setLikedSongs(ui);
  })();
}, [userId]);

  function platformMeta(p: string | null | undefined) {
    const key = (p ?? "").toLowerCase();

    // YouTube Music: 키워드 + 호스트까지 대응
    const isYtMusic =
      key.includes("youtubemusic") ||
      key.includes("youtube music")||
      key.includes("music.youtube") ||   // e.g. https://music.youtube.com/...
      key.includes("youtube.com/music"); // e.g. https://youtube.com/music/...

    if (isYtMusic) {
      return {
        label: "YouTube Music",
        Icon: YoutubeMusicIcon, // ← 이미지 아이콘을 컴포넌트로
        className: "bg-red-50 hover:bg-red-100 text-red-600",
      };
    }

    if (key.includes("youtube")) {
      return {
        label: "YouTube",
        Icon: FaYoutube,
        className: "bg-red-50 hover:bg-red-100 text-red-600",
      };
    }

    if (key.includes("spotify") || key.includes("open.spotify")) {
      return {
        label: "Spotify",
        Icon: FaSpotify,
        className: "bg-green-50 hover:bg-green-100 text-green-700",
      };
    }

    if (key.includes("apple")) {
      return {
        label: "Apple Music",
        Icon: SiApplemusic,
        className: "bg-gray-50 hover:bg-gray-100 text-gray-800",
      };
    }

    if (key.includes("sound")) {
      return {
        label: "SoundCloud",
        Icon: FaSoundcloud,
        className: "bg-orange-50 hover:bg-orange-100 text-orange-700",
      };
    }

    // Melon: 키워드 + 호스트 대응
    if (key.includes("melon") || key.includes("melon.co")) {
      return {
        label: "Melon",
        Icon: MelonIcon, // ← 이미지 아이콘을 컴포넌트로
        className: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label: p || "Link",
      Icon: FaLink,
      className: "bg-gray-50 hover:bg-gray-100 text-blue-600",
    };
  }

  type AlbumRow = {
    albums: {
      id: number;
      albumname: string;
      photo_url: string | null;
      created_at: string;
    };
  };

  // album information fetch
  useEffect(() => {
    if (!userId) return;

    (async () => {
      // 1) 내가 좋아요한 앨범 id들
      const { data: liked, error: e1 } = await supabase
        .from("album_liked")
        .select("album_id")
        .eq("user_id", userId);

      if (e1) { console.error("[album_liked]", e1); setAlbums([]); return; }

      const albumIds = (liked ?? []).map(l => l.album_id).filter(Boolean);
      if (albumIds.length === 0) { setAlbums([]); return; }

      // 2) 앨범 정보
      const { data: albumRows, error: e2 } = await supabase
        .from("albums")
        .select("id, name:albumname, photo_url, created_at")
        .in("id", albumIds);

      if (e2) { console.error("[albums]", e2); setAlbums([]); return; }

      // 일단 댓글수 0으로 세팅
      const base = (albumRows ?? []).map((r: any) => ({
        id: String(r.id),
        name: r.name ?? "(제목 없음)",
        photoUrl: r.photo_url ?? null,
        createdAt: r.created_at ?? null,
        commentCount: 0,
      })) as UIAlbum[];
      setAlbums(base);

      // 3) 해당 앨범들의 stage 목록
      const { data: stages, error: e3 } = await supabase
        .from("stage_info")
        .select("id, album_id")
        .in("album_id", albumIds);

      if (e3 || !stages?.length) {
        if (e3) console.error("[stage_info]", e3);
        return; // 무대가 없으면 0 유지
      }

      const stageIds = stages.map(s => s.id);

      // 4) 그 stage들의 댓글들(아이디만 가져와서 개수만 셈)
      const { data: cmts, error: e4 } = await supabase
        .from("stage_comments")
        .select("id, stage_id")
        .in("stage_id", stageIds);

      if (e4) { console.error("[stage_comments]", e4); return; }

      // 5) album_id별로 댓글 수 집계
      const stageToAlbum = new Map<number, number>();
      stages.forEach(s => stageToAlbum.set(s.id, s.album_id));

      const byAlbum: Record<number, number> = {};
      (cmts ?? []).forEach(c => {
        const aid = stageToAlbum.get(c.stage_id);
        if (aid != null) byAlbum[aid] = (byAlbum[aid] ?? 0) + 1;
      });

      // 6) setAlbums에 반영
      setAlbums(prev =>
        prev.map(a => ({
          ...a,
          commentCount: byAlbum[Number(a.id)] ?? 0,
        })),
      );
    })();
  }, [userId]);

  useEffect(() => {
    if (!loading && !userId) {
      navigate("/sign-in");
    }
  }, [userId, navigate, loading]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  if (loading) return null;

  return (
    <>
      {/* 프로필 영역 */}
      <div className="flex items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <img
            src={displayPhoto}
            alt="프로필"
            className="w-full h-full object-cover"
          />
        </div>

        <span className="text-xl font-semibold">{displayName}님의 서랍장</span>

        {/* 설정 아이콘 + 드롭다운 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <FiSettings className="w-6 h-6 text-gray-500" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-44 rounded-xl border bg-white shadow-lg p-1"
            >
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  setMenuOpen(false);
                  setIsModalOpen(true);
                }}
              >
                프로필 편집
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
              >
                로그아웃
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-red-600"
                onClick={async () => {
                  setMenuOpen(false);
                  await deleteAccount();
                }}
              >
                탈퇴하기
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto">
            <RoleSwitcher align="right" label="관객"/> {/* 관객/아티스트 드롭다운 */}
        </div>
      </div>

      {/* 탭 */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <TabButton
              active={activeTab === "songs"}
              onClick={() => setActiveTab("songs")}
              label="좋아하는 곡"
            />
            <TabButton
              active={activeTab === "books"}
              onClick={() => setActiveTab("books")}
              label="좋아하는 가사집"
            />
            <TabButton
              active={activeTab === "artists"}
              onClick={() => setActiveTab("artists")}
              label="내 아티스트"
            />
            <TabButton
              active={activeTab === "stages"}
              onClick={() => setActiveTab("stages")}
              label="다녀온 무대"
            />
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="py-8 text-sm text-gray-400">
          {activeTab === "songs" &&(
              !songDetail.openSong ? (
                <LikedSongsList
                  songs={likedSongs}
                  onOpen={(s)=> songDetail.open(Number(s.id))}
                />
              ) : (
                <SongDetailPanel
                  openSong={songDetail.openSong}
                  openLoading={songDetail.openLoading}
                  onClose={songDetail.close}
                  platformMeta={platformMeta}
                  liked={songDetail.liked}
                  likeCount={songDetail.likeCount}
                  likeLoading={songDetail.likeLoading}
                  onToggleLike={songDetail.toggleLike}
                  commentCount={songDetail.commentCount}
                  panelRef={songDetail.panelRef}
                  commentsSlot={
                    songDetail.openSong ? (
                      <SongCommentsInline songId={songDetail.openSong.id} />
                    ) : null
                  }
                />
              )
          )}

          {activeTab === "books" && (
            !selectedAlbum ? (
              <AlbumsList albums={albums} readOnly onOpen={(a)=>setSelectedAlbum(a)} /> //onOpen : callback function
            ) : (
              <LikedAlbumDetail album={selectedAlbum} onBack={()=>setSelectedAlbum(null)} /> //onBack : callback function
            )
          )}

          {activeTab === "artists" && <div>(내 아티스트 리스트 예정)</div>}
          {activeTab === "stages" && <div>(다녀온 무대 리스트 예정)</div>}
        </div>
      </div>

      {/* 모달 */}
      <ProfileModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        provider={provider}
      />
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
        active
          ? "text-black border-b-2 border-black"
          : "text-gray-500 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}
