// src/pages/MyAudiencePage.tsx
import { useState, useEffect, useRef } from "react";
import { FiSettings } from "react-icons/fi";
import ProfileModal from "../components/ProfileModal";
import { useMyAudienceVM } from "../viewmodels/useMyAudienceVM";
import { useUserStore } from "../store/useUserStore";
import { useNavigate } from "react-router-dom";
import RoleSwitcher from "../components/RoleSwitcher";
import AlbumsList from "../components/AlbumList";
import { supabase } from "../lib/supabaseClient";
// ✅ 훅의 UIAlbum 타입을 사용 (latestStage/stages 포함)
import type { UIAlbum as HookAlbum } from "../hooks/stage/useAlbumsWithStages";
import { useAlbumsWithStages } from "../hooks/stage/useAlbumsWithStages";

import LikedAlbumDetail from "../components/LikedAlbumDetail";
import SongCommentsInline from "../components/SongCommentsInline";
import { useFollowedArtists } from "../hooks/useFollowedArtists";
import FollowedArtistsGrid from "../components/FollowedArtistsGrid";

import LikedSongsList from "../components/LikedSongsList";
import SongDetailPanel from "../components/SongDetailPanel";
import { useSongDetail } from "../hooks/useSongDetail";
import type { UISong } from "../components/SongList";
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";

import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";
import ArtistStagesCalendar from "../components/stage/ArtistStagesCalendar";

type IconLike = React.ComponentType<{ className?: string }>;
const makeImgIcon = (src: string, alt: string): IconLike => {
  const ImgIcon: IconLike = ({ className }) => <img src={src} alt={alt} className={className} />;
  return ImgIcon;
};
const YoutubeMusicIcon = makeImgIcon(ytMusicPng, "YouTube Music");
const MelonIcon = makeImgIcon(melonPng, "Melon");

export default function MyAudiencePage() {
  const { userId, provider, nickname, photoUrl, loading, signOut, deleteAccount } = useMyAudienceVM();

  const sName = useUserStore((s) => s.username);
  const sPhoto = useUserStore((s) => s.photoUrl);

  const displayName = sName || nickname;
  const displayPhoto = sPhoto || photoUrl || "/default-profile.svg";

  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"songs" | "books" | "artists" | "stages">("songs");

  // 앨범/선택 앨범은 훅 타입으로
  const [albums, setAlbums] = useState<HookAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<HookAlbum | null>(null);

  const { artists: followedArtists, loading: loadingArtists } = useFollowedArtists(userId);

  const [likedSongs, setLikedSongs] = useState<UISong[]>([]);
  const songDetail = useSongDetail();

  // ─────────────────────────────────────────────
  // 좋아요한 앨범 ID들 → 훅으로 무대 포함 앨범 로드
  const [likedAlbumIds, setLikedAlbumIds] = useState<number[]>([]);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("album_liked")
        .select("album_id")
        .eq("user_id", userId);
      if (error) {
        console.error("[album_liked]", error);
        setLikedAlbumIds([]);
        return;
      }
      setLikedAlbumIds((data ?? []).map((r) => Number(r.album_id)).filter(Boolean));
    })();
  }, [userId]);

  // 빈 배열일 때 훅이 전체를 가져오지 않도록 가드(-1 사용)
  const safeAlbumIds = likedAlbumIds.length ? likedAlbumIds : [-1];
  const { data: albumsVM } = useAlbumsWithStages({ albumIds: safeAlbumIds });

  // 훅 결과 그대로 반영 (latestStage/stages 유지)
  useEffect(() => {
    setAlbums(albumsVM ?? []);
  }, [albumsVM]);

  // (옵션) stage_comments로 댓글 수 합산
  useEffect(() => {
    const ids = (albumsVM ?? []).map((a) => Number(a.id));
    if (!ids.length) return;

    (async () => {
      const { data: stageRows, error: e1 } = await supabase
        .from("stage_info")
        .select("id, album_id")
        .in("album_id", ids);
      if (e1 || !stageRows?.length) return;

      const stageIds = stageRows.map((s) => s.id);
      const { data: cmts, error: e2 } = await supabase
        .from("stage_comments")
        .select("id, stage_id")
        .in("stage_id", stageIds);
      if (e2) return;

      const stageToAlbum = new Map<number, number>();
      stageRows.forEach((s) => stageToAlbum.set(s.id, s.album_id));

      const byAlbum: Record<number, number> = {};
      (cmts ?? []).forEach((c) => {
        const aid = stageToAlbum.get(c.stage_id);
        if (aid != null) byAlbum[aid] = (byAlbum[aid] ?? 0) + 1;
      });

      setAlbums((prev) =>
        prev.map((a) => ({
          ...a,
          commentCount: byAlbum[a.id] ?? a.commentCount ?? 0,
        })),
      );
    })();
  }, [albumsVM]);
  // ─────────────────────────────────────────────

  // 좋아요한 곡
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: liked, error: e1 } = await supabase.from("song_liked").select("song_id").eq("user_id", userId);
      if (e1) {
        console.error(e1);
        setLikedSongs([]);
        return;
      }

      const ids = (liked ?? []).map((x) => x.song_id).filter(Boolean);
      if (!ids.length) {
        setLikedSongs([]);
        return;
      }

      const { data: rows, error: e2 } = await supabase
        .from("songs")
        .select(`id,title,song_photo,created_at, artist_id, 
                artists(name),
                song_comment:song_comment!song_comment_song_id_fkey(count),
                song_liked:song_liked!song_liked_song_id_fkey(count)
               `)
        .in("id", ids);
      if (e2) {
        console.error(e2);
        setLikedSongs([]);
        return;
      }

      const ui = (rows ?? []).map((r) => ({
        id: String(r.id),
        title: r.title ?? "",
        photoUrl: r.song_photo ?? null,
        createdAt: r.created_at ?? null,
        artistName: (r as any).artists?.name ?? null,
        commentCount: r.song_comment?.[0]?.count ?? 0,
        likeCount: r.song_liked?.[0]?.count ?? 0,
      })) as UISong[];

      ui.sort((a, b) => ids.indexOf(Number(a.id)) - ids.indexOf(Number(b.id)));
      setLikedSongs(ui);
    })();
  }, [userId]);

  function platformMeta(p: string | null | undefined) {
    const key = (p ?? "").toLowerCase();
    const isYtMusic =
      key.includes("youtubemusic") ||
      key.includes("youtube music") ||
      key.includes("music.youtube") ||
      key.includes("youtube.com/music");

    if (isYtMusic) {
      return { label: "YouTube Music", Icon: YoutubeMusicIcon, className: "bg-red-50 hover:bg-red-100 text-red-600" };
    }
    if (key.includes("youtube")) {
      return { label: "YouTube", Icon: FaYoutube, className: "bg-red-50 hover:bg-red-100 text-red-600" };
    }
    if (key.includes("spotify") || key.includes("open.spotify")) {
      return { label: "Spotify", Icon: FaSpotify, className: "bg-green-50 hover:bg-green-100 text-green-700" };
    }
    if (key.includes("apple")) {
      return { label: "Apple Music", Icon: SiApplemusic, className: "bg-gray-50 hover:bg-gray-100 text-gray-800" };
    }
    if (key.includes("sound")) {
      return { label: "SoundCloud", Icon: FaSoundcloud, className: "bg-orange-50 hover:bg-orange-100 text-orange-700" };
    }
    if (key.includes("melon") || key.includes("melon.co")) {
      return { label: "Melon", Icon: MelonIcon, className: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700" };
    }
    return { label: p || "Link", Icon: FaLink, className: "bg-gray-50 hover:bg-gray-100 text-blue-600" };
  }

  useEffect(() => {
    if (!loading && !userId) {
      navigate("/sign-in");
    }
  }, [userId, navigate, loading]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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
    <div className="max-w-[700px] mx-auto">
      {/* 프로필 영역 */}
      <div className="flex flex-wrap items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <img src={displayPhoto} alt="프로필" className="w-full h-full object-cover" />
        </div>



        {/* 설정 아이콘 + 드롭다운 */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold">{displayName}님의 서랍장</span>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center p-0 leading-none rounded cursor-pointer"
            >
              <FiSettings className="block w-5 h-5 text-gray-500 translate-y-[2px]" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-5 w-[120px] rounded-xl border border-gray-300 bg-gray-100 shadow-lg p-0 py-2 px-3 space-y-2"
              >
                <button
                  role="menuitem"
                  className="w-full text-left rounded-lg hover:bg-gray-200"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="text-gray-400">프로필 수정</div>
                </button>
                <hr className="border-gray-300 mx-2" />
                <button
                  role="menuitem"
                  className="w-full text-left rounded-lg hover:bg-gray-200"
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                  }}
                >
                  <div className="text-gray-400">로그아웃</div>
                </button>
                <hr className="border-gray-300 mx-2" />
                <button
                  role="menuitem"
                  className="w-full text-left rounded-lg hover:bg-gray-200 text-red-600"
                  onClick={async () => {
                    setMenuOpen(false);
                    const ok = window.confirm(
                      "정말로 계정을 탈퇴하시겠습니까?\n" +
                      "작성하신 댓글, 좋아요 등 일부 기록은 '탈퇴한 사용자'로 남으며,\n" +
                      "계정은 복구할 수 없습니다."
                    );
                    if (!ok) return;

                    await deleteAccount();
                  }}
                >
                  탈퇴하기
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-3 px-2">
        <RoleSwitcher align="right" label="관객" />
      </div>

      {/* 탭 */}
      <div className="px-6 mt-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <div className="flex w-full justify-between text-sm">
            <TabButton active={activeTab === "books"} onClick={() => setActiveTab("books")} label="좋아하는 가사집" />
            <TabButton active={activeTab === "songs"} onClick={() => setActiveTab("songs")} label="좋아하는 곡" />
            <TabButton active={activeTab === "artists"} onClick={() => setActiveTab("artists")} label="내 아티스트" />
            <TabButton active={activeTab === "stages"} onClick={() => setActiveTab("stages")} label="무대" />
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className={`${activeTab === "stages" ? "pt-2 pb-0" : "py-8"} text-sm text-gray-400`}>
          {activeTab === "songs" &&
            (!songDetail.openSong ? (
              <LikedSongsList songs={likedSongs} onOpen={(s) => songDetail.open(Number(s.id))} />
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
                commentsSlot={songDetail.openSong ? <SongCommentsInline songId={songDetail.openSong.id} /> : null}
              />
            ))}

          {activeTab === "books" &&
            (!selectedAlbum ? (
              //   AlbumsList에 pageType="audience"를 넘겨서
              //    최신 무대 프리뷰 & “무대 정보 더보기” 패널을 활성화
              <AlbumsList
                albums={albums}
                pageType="audience"
                readOnly
                onOpen={(a) => setSelectedAlbum(a)}
              />
            ) : (
              // LikedAlbumDetail이 id:string을 기대하면 어댑터로 전달
              <LikedAlbumDetail
                album={{ ...selectedAlbum, id: String(selectedAlbum.id) } as any}
                onBack={() => setSelectedAlbum(null)}
              />
            ))}

          {activeTab === "artists" && (
            <div className="space-y-3">
              {loadingArtists ? <div className="text-gray-500">불러오는 중...</div> : <FollowedArtistsGrid artists={followedArtists} />}
            </div>
          )}

          {activeTab === "stages" && (
            <div className="space-y-3">
              {loadingArtists ? (
                <div className="text-gray-500">불러오는 중...</div>
              ) : followedArtists.length === 0 ? (
                <div className="text-gray-500">팔로우한 아티스트가 없습니다.</div>
              ) : (
                <ArtistStagesCalendar
                  mode="viewer"
                  canEdit={false}
                  artistIds={followedArtists.map((a: any) => Number(a.id))}
                  artistNameMap={Object.fromEntries(followedArtists.map((a: any) => [Number(a.id), String(a.name ?? "")]))}
                  onItemClick={(s) => {
                    if (s.promotion_url) window.open(s.promotion_url, "_blank");
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      <ProfileModal open={isModalOpen} onClose={() => setIsModalOpen(false)} userId={userId} provider={provider} />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 transition break-keep ${active ? "text-black border-b-2 border-black" : "text-gray-500 hover:text-black"}`}
    >
      {label}
    </button>
  );
}
