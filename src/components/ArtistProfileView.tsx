// src/components/ArtistProfileView.tsx
import AlbumsList from "./AlbumList";
import SongList from "./SongList";
import type { UISong } from "./SongList";
import type { UIAlbum as HookAlbum } from "../hooks/stage/useAlbumsWithStages";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import AlbumTracksPanel from "./AlbumTracksPanel";
import SongDetailPanel from "./SongDetailPanel";
import AlbumLikeButton from "./AlbumLikeButton";

import { useAlbumsWithStages } from "../hooks/stage/useAlbumsWithStages";

import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";

import { useSongLikeVM } from "../viewmodels/useSongLikeVM";
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";
import { useStageCommentVM } from "../viewmodels/useStageCommentVM";
import { useAlbumLikeVM } from "../viewmodels/useAlbumLikeVM";

import {
  FiChevronDown,
  FiCopy,
  FiSettings,
  FiPlus,
  FiChevronLeft,
  FiArrowUpRight,
} from "react-icons/fi";
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";

import TextareaAutosize from "react-textarea-autosize";

import StagePhotoStrip from "./StagePhotoStrip";
import StagePhotosModal from "./StagePhotosModal";

import { useSearchParams } from "react-router-dom";
import QRDownloadButtonBB from "./QRDownloadButtonBB";

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
  bio: string | null;
};

type Props = {
  artist: Artist;
  isOwner?: boolean;
  authReady?: boolean; // 프로필 편집 후 스위처 /팔로워 팔로워로 뜨는 오류 해결 위해 추가
  onEditProfile?: () => void;
  onAddSong?: () => void;
  onAddBook?: () => void;
  onAddStage?: () => void;
  onEditSong?: (song: UISong) => void;
  onEditBook?: (album: HookAlbum) => void; // ← 훅 타입 그대로
  activeTab: "songs" | "books" | "stages";
  setActiveTab: React.Dispatch<React.SetStateAction<"songs" | "books" | "stages">>;
  followerCount?: number;
  following?: boolean;
  followLoading?: boolean;
  onToggleFollow?: () => void;
  rightExtra?: React.ReactNode;
};

type SongDetail = {
  id: number;
  title: string;
  lyrics: string | null;
  bio: string | null;
  song_photo: string | null;
  song_link: string | null;
  created_at: string | null;
  links?: { platform: string; url: string }[];
};

type IconLike = React.ComponentType<{ className?: string }>;
const makeImgIcon = (src: string, alt: string): IconLike => {
  const ImgIcon: IconLike = ({ className }) => <img src={src} alt={alt} className={className} />;
  return ImgIcon;
};

const YoutubeMusicIcon = makeImgIcon(ytMusicPng, "YouTube Music");
const MelonIcon = makeImgIcon(melonPng, "Melon");

export default function ArtistProfileView({
  artist,
  isOwner = false,
  authReady = true,
  onEditProfile,
  onAddSong,
  onAddBook,
  onAddStage,
  activeTab,
  setActiveTab,
  onEditBook,
  onEditSong,
  followerCount = 0,
  following = false,
  followLoading = false,
  onToggleFollow,
  rightExtra,
}: Props) {
  const [openSong, setOpenSong] = useState<SongDetail | null>(null);
  const [openLoading, setOpenLoading] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const { likeCount, liked, loading, toggleLike } = useSongLikeVM(openSong?.id);
  const { count } = useSongCommentVM(openSong?.id ?? null);

  // ✅ AlbumsList가 기대하는 타입 그대로 사용 (id:number, latestStage/stages 포함)
  const [albums, setAlbums] = useState<HookAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<HookAlbum | null>(null);

  const [stages, setStages] = useState<Array<{ id: number; title: string | null; start_at: string | null }>>([]);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // 앨범 + 무대 정보 로드 (latestStage/stages 포함)
  const { data: albumsVM } = useAlbumsWithStages({ artistId: artist.id });

  // ✅ 훅 결과를 그대로 반영 (얇은 매핑 금지)
  useEffect(() => {
    setAlbums(albumsVM ?? []);
  }, [albumsVM]);

  // (옵션) stage_comments로 댓글수 합산
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
  // [ADD] 관객용 ArtistPage에서 해당 가사집이 자동 오픈되도록 하는 URL
  const publicAlbumUrl = useMemo(() => {
    if (!selectedAlbum) return "";
    const base =
      (typeof window !== "undefined" ? window.location.origin : "").replace(/\/$/, "");
    const u = new URL(`${base}/artist/${artist.id}`);
    u.searchParams.set("tab", "books");                    // 가사집 탭 열기
    u.searchParams.set("album", String(selectedAlbum.id)); // 해당 가사집 자동 선택
    return u.toString();
  }, [artist.id, selectedAlbum?.id]);

  // URL 파라미터 → 앨범 열기
  useEffect(() => {
    const albumParam = searchParams.get("album");
    if (!albumParam) {
      if (selectedAlbum !== null) setSelectedAlbum(null);
      return;
    }
    const found = albums.find((a) => String(a.id) === String(albumParam));
    if (!found) return;

    if (!selectedAlbum || Number(selectedAlbum.id) !== Number(found.id)) {
      setSelectedAlbum(found);
    }

    const tabParam = searchParams.get("tab");
    if (tabParam === "lyricsbook" || tabParam === "books") {
      setActiveTab("books");
    } else if (tabParam === "songs") {
      setActiveTab("songs");
    } else if (tabParam === "stages") {
      setActiveTab("stages");
    }
  }, [searchParams, albums, selectedAlbum, setActiveTab]);

  // 선택 앨범의 무대 목록
  useEffect(() => {
    (async () => {
      if (!selectedAlbum) {
        setStages([]);
        setSelectedStageId(null);
        return;
      }
      const { data, error } = await supabase
        .from("stage_info")
        .select("id, title, start_at")
        .eq("album_id", Number(selectedAlbum.id))
        .order("start_at", { ascending: false })
        .order("id", { ascending: false });
      if (error) {
        console.error(error);
        setStages([]);
        setSelectedStageId(null);
        return;
      }
      setStages(data || []);
      setSelectedStageId(data?.[0]?.id ?? null);
    })();
  }, [selectedAlbum]);

  // stage comment VM
  const { comments, count: stageCommentCount, addComment, deleteComment } = useStageCommentVM(selectedStageId);

  // 사진 업로드 미리보기
  const [cmtText, setCmtText] = useState("");
  const [cmtFile, setCmtFile] = useState<File | undefined>(undefined);
  const [cmtPreview, setCmtPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!cmtFile) {
      setCmtPreview(null);
      return;
    }
    const url = URL.createObjectURL(cmtFile);
    setCmtPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cmtFile]);

  const handleSubmitStageComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!cmtText.trim() && !cmtFile) return;
      await addComment(cmtText, cmtFile);
      setCmtText("");
      setCmtFile(undefined);
    } catch (err: any) {
      alert(err.message ?? "업로드에 실패했습니다.");
    }
  };

  // SNS
  const [snsOpen, setSnsOpen] = useState(false);
  const [selectedSNS, setSelectedSNS] = useState<Link | null>(artist.links?.length ? artist.links[0] : null);
  useEffect(() => {
    setSelectedSNS(artist.links?.length ? artist.links[0] : null);
    setSnsOpen(false);
  }, [artist]);

  // 앨범 좋아요
  const albumLike = useAlbumLikeVM(selectedAlbum ? Number(selectedAlbum.id) : undefined);

  // 사진 모달
  const [openPhotos, setOpenPhotos] = useState(false);
  const photoGroups = useMemo(() => {
    const meta = new Map<number, { title?: string | null; date?: string | null }>();
    stages.forEach((s) => meta.set(s.id, { title: s.title ?? null, date: s.start_at ?? null }));

    const buckets = new Map<
      number,
      {
        stageId: number;
        title?: string | null;
        date?: string | null;
        items: Array<{
          id: number;
          url: string;
          username?: string | null;
          naturalWidth?: number;
          naturalHeight?: number;
        }>;
      }
    >();

    (comments || [])
      .filter((c) => !!c.photo_url)
      .forEach((c) => {
        const sid = c.stage_id as number;
        if (!buckets.has(sid)) {
          const m = meta.get(sid) || {};
          buckets.set(sid, { stageId: sid, title: m.title, date: m.date, items: [] });
        }
        buckets.get(sid)!.items.push({
          id: c.id,
          url: c.photo_url as string,
          username: c.users?.username ?? null,
          naturalWidth: c.photo_w ?? undefined,
          naturalHeight: c.photo_h ?? undefined,
        });
      });

    return Array.from(buckets.values()).sort((a, b) => {
      const ad = a.date ? +new Date(a.date) : 0;
      const bd = b.date ? +new Date(b.date) : 0;
      return bd - ad;
    });
  }, [comments, stages]);

  const platformMeta = (p: string) => {
    const key = (p ?? "").toLowerCase();

    const isYtMusic =
      key.includes("youtubemusic") ||
      key.includes("youtube music") ||
      key.includes("music.youtube") ||
      key.includes("youtube.com/music");

    if (isYtMusic)
      return {
        label: "YouTube Music",
        Icon: YoutubeMusicIcon,
        className: "bg-red-50 hover:bg-red-100 text-red-600",
      };

    if (key.includes("youtube"))
      return {
        label: "YouTube",
        Icon: FaYoutube,
        className: "bg-red-50 hover:bg-red-100 text-red-600",
      };

    if (key.includes("spotify"))
      return {
        label: "Spotify",
        Icon: FaSpotify,
        className: "bg-green-50 hover:bg-green-100 text-green-700",
      };

    if (key.includes("apple"))
      return {
        label: "Apple Music",
        Icon: SiApplemusic,
        className: "bg-gray-50 hover:bg-gray-100 text-gray-800",
      };

    if (key.includes("sound"))
      return {
        label: "SoundCloud",
        Icon: FaSoundcloud,
        className: "bg-orange-50 hover:bg-orange-100 text-orange-700",
      };

    if (key.includes("melon"))
      return {
        label: "Melon",
        Icon: MelonIcon,
        className: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
      };

    return {
      label: p || "Link",
      Icon: FaLink,
      className: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    };
  };

  const handleOpenSong = async (ui: UISong) => {
    if (openSong?.id === Number(ui.id)) {
      setOpenSong(null);
      return;
    }

    try {
      setOpenLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select(
          `
            id,title,lyrics,bio,song_photo,song_link,created_at,
            song_links (platform, url)
          `,
        )
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
        links: (data.song_links || []) as { platform: string; url: string }[],
      };

      setOpenSong(detail);
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } finally {
      setOpenLoading(false);
    }
  };

  const songDetailJSX = (
    <SongDetailPanel
      openSong={openSong}
      openLoading={openLoading}
      onClose={() => setOpenSong(null)}
      platformMeta={platformMeta}
      liked={liked}
      likeCount={likeCount}
      likeLoading={loading}
      onToggleLike={toggleLike}
      commentCount={count}
      panelRef={detailRef}
      commentsSlot={openSong ? <SongCommentsInline songId={openSong.id} /> : null}
    />
  );

  return (
    <div className="max-w-[700px] mx-auto">
      {/* 상단 프로필 */}
      <div className="flex flex-wrap items-center gap-4 p-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {artist.photoUrl ? (
            <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <span>No Photo</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{artist.name}</h2>
          {isOwner && <FiSettings className="w-6 h-6 text-gray-500 cursor-pointer mt-2 mx-5" onClick={onEditProfile} />}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {followerCount} <span className="text-gray-400">팔로워</span>
          </span>
        </div>
      </div>

      <div className="flex justify-end px-2 mb-2">
        {authReady && (
          isOwner
            ? rightExtra                      // roleswitcher
            : (
              <button
                type="button"
                onClick={onToggleFollow}
                disabled={followLoading}
                className={`px-3 py-1.5 rounded-full text-sm border ${following ? "bg-gray-100 text-gray-800 border-gray-200" : "bg-black text-white border-black"
                  }`}
              >
                {following ? "팔로잉" : "팔로우"}
              </button>
            )
        )}
      </div>

      {/* 상세 */}
      <div className="px-6 space-y-1 text-gray-600 text-sm">
        <div>
          <span className="font-semibold">장르:</span>{" "}
          {artist.genres?.length ? artist.genres.map((g) => g.name).join(", ") : "-"}
        </div>
        <div>
          <span className="font-semibold">소속사:</span> {artist.label || "-"}
        </div>
        <div>
          <span className="font-semibold">구성:</span> {artist.instruments || "-"}
        </div>
        <div>
          <span className="font-semibold">소개:</span> {artist.bio || "-"}
        </div>
      </div>

      {/* SNS 링크 */}
      <div className="px-6 mt-4">
        {artist.links?.length ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSnsOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
              >
                {selectedSNS?.platform ?? "SNS"}
                <FiChevronDown className={`transition-transform ${snsOpen ? "rotate-180" : ""}`} />
              </button>

              {snsOpen && (
                <div className="absolute left-0 mt-1 w-44 bg-white border rounded-md shadow-lg z-20">
                  {artist.links.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedSNS(link);
                        setSnsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {link.platform}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSNS && (
              <div className="flex items-center gap-2">
                <a
                  href={selectedSNS.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-800 hover:underline"
                  title={selectedSNS.url}
                >
                  {selectedSNS.url}
                </a>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selectedSNS.url).then(() => alert("복사되었습니다"))}
                  className="p-1 pr-10 rounded hover:bg-gray-200 flex items-center justify-center"
                  title="링크 복사"
                >
                  <FiCopy className="w-4 h-4 relative -translate-y-[10px]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">등록된 SNS 링크 없음</div>
        )}
      </div>

      {/* 탭 + (오너만) 추가 버튼 */}
      <div className="px-6 mt-6">
        
          <div className="flex justify-between text-sm flex-1 min-w-0 w-full px-6">
            <TabButton active={activeTab === "books"} onClick={() => setActiveTab("books")} label="가사집" />
            <TabButton active={activeTab === "songs"} onClick={() => setActiveTab("songs")} label="곡" />
            <TabButton active={activeTab === "stages"} onClick={() => setActiveTab("stages")} label="아티스트 공연" />
          </div>

          {isOwner && (
            <div className="flex justify-end mt-3">
              <button
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-black text-white hover:opacity-90"
                onClick={() => {
                  if (activeTab === "songs") onAddSong?.();
                  else if (activeTab === "books") onAddBook?.();
                  else onAddStage?.();
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
          )}
        

        {/* 리스트 영역 */}
        <div className="py-8 text-sm text-gray-400">
          {activeTab === "songs" && (
            <div className="text-gray-900">
              <SongList artistId={artist.id} readOnly={!isOwner} onEdit={onEditSong} onOpen={handleOpenSong} />
              {(openLoading || openSong) && songDetailJSX}
            </div>
          )}

          {activeTab === "books" && (
            <div className="text-gray-900">
              {!selectedAlbum ? (
                // 목록 뷰
                <AlbumsList
                  albums={albums}
                  pageType="artist"     // ✅ 프리뷰 노출
                  readOnly={!isOwner}
                  artistNameOverride={artist?.name ?? ""}
                  onEdit={onEditBook}
                  onOpen={(a) => {
                    setSelectedAlbum(a);        // a는 HookAlbum (stages/latestStage 포함)
                    const next = new URLSearchParams(searchParams);
                    next.set("tab", "books");
                    next.set("album", String(a.id));
                    setSearchParams(next);
                  }}
                />
              ) : (
                // 상세(선택한 가사집 + 곡 리스트) 뷰
                <div className="mt-4">
                  {/* [REPLACE] 헤더(뒤로가기 + 커버/제목/아티스트) + 우측 QR 버튼 */}
                  <div className="flex items-center justify-between p-3">
                    {/* 왼쪽: 뒤로가기 + 커버/텍스트 */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlbum(null);
                          const next = new URLSearchParams(searchParams);
                          next.delete("album");
                          setSearchParams(next, { replace: true });
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="목록으로"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="flex items-start gap-3">
                        {selectedAlbum?.photoUrl && (
                          <img
                            src={selectedAlbum.photoUrl}
                            alt={selectedAlbum.name ?? "album cover"}
                            className="w-20 h-20 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight truncate">
                            {selectedAlbum?.name ?? "(제목 없음)"}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{artist.name}</div>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: QR 프리뷰 + 다운로드 (오너 화면에서만 노출) */}
                    {isOwner && selectedAlbum && (
                      <QRDownloadButtonBB
                        url={publicAlbumUrl}
                        filename={`artist_${artist.id}_album_${selectedAlbum.id}_qr`}
                        size={96}
                        mode="in"           // ← 중앙 로고 / "below"로 바꾸면 하단 프레임 로고
                        margin={2}
                        lightColor="#ffffff"
                        darkColor="#000000"
                        className="shrink-0"
                      />
                    )}
                  </div>


                  <div className="w-full h-px bg-gray-200" />

                  {/* 앨범 안에 곡 리스트 섹션 */}
                  <div className="mt-2">
                    <span className="text-sm font-semibold block mb-2">곡 리스트</span>
                    
                    <div className="bg-white rounded-xl p-4">
                      <AlbumTracksPanel
                        albumId={Number(selectedAlbum.id)}
                        onOpen={(s) => handleOpenSong({ id: String(s.id), title: s.title } as any)}
                      />
                    </div>
                  </div>

                  {(openLoading || openSong) ? (
                    songDetailJSX
                  ) : (
                    <>
                      {/* 무대 선택 드롭다운 */}
                      {stages.length > 0 ? (
                        <div className="mb-3 flex items-center gap-2 px-1">
                          <span className="text-sm text-gray-500">무대:</span>
                          <select
                            value={selectedStageId ?? ""}
                            onChange={(e) => setSelectedStageId(Number(e.target.value))}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {(s.title || `Stage #${s.id}`) +
                                  (s.start_at ? ` — ${new Date(s.start_at).toLocaleDateString()}` : "")}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="mb-3 text-sm text-gray-500 px-1">이 가사집에 연결된 무대가 없습니다.</div>
                      )}

                      {/* 좋아요/댓글 카운트 */}
                      <div className="flex items-center gap-4 text-sm text-gray-700 px-1 mb-2">
                        <AlbumLikeButton
                          mode="controlled"
                          liked={albumLike.liked}
                          likeCount={albumLike.likeCount}
                          likeLoading={albumLike.loading}
                          onToggleLike={albumLike.toggleLike}
                          showCount={false}
                        />
                        <span>좋아요({albumLike.likeCount ?? 0})</span>
                        <span>댓글({stageCommentCount ?? 0})</span>
                      </div>

                      <StagePhotoStrip comments={comments} onOpenAll={() => setOpenPhotos(true)} />

                      <StagePhotosModal open={openPhotos} onClose={() => setOpenPhotos(false)} groups={photoGroups} />

                      {/* 이미지 업로드 + 댓글 입력 */}
                      {selectedStageId && (
                        <form
                          onSubmit={handleSubmitStageComment}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const f = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith("image/"));
                            if (f) setCmtFile(f);
                          }}
                          className={`flex mt-4 items-center gap-2 bg-white border rounded-3xl px-1 ${dragOver ? "ring-2 ring-gray-300" : ""
                            }`}
                        >
                          {/* + 버튼 */}
                          <label className="mx-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer">
                            <FiPlus className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setCmtFile(e.target.files?.[0])}
                            />
                          </label>

                          {/* 미리보기 썸네일 */}
                          {cmtPreview && (
                            <div className="relative ml-1 shrink-0">
                              <img src={cmtPreview} alt="preview" className="w-16 h-16 rounded-xl object-cover bg-gray-100 " />
                              <button
                                type="button"
                                onClick={() => setCmtFile(undefined)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] leading-none"
                                aria-label="미리보기 제거"
                                title="미리보기 제거"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* 입력창 */}
                          <TextareaAutosize
                            value={cmtText}
                            onChange={(e) => setCmtText(e.target.value)}
                            placeholder="이미지를 드래그, 또는 댓글을 작성해주세요."
                            className="flex-1 rounded px-3 py-2 text-sm "
                            minRows={1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                              }
                            }}
                          />
                          {/* 전송 버튼 */}
                          <button
                            type="submit"
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1 "
                          >
                            <FiArrowUpRight className="w-5 h-5" />
                          </button>
                        </form>
                      )}

                      {/* 댓글 리스트 */}
                      <div className="mt-10 space-y-4">
                        <ul className="space-y-3">
                          {comments.map((c) => (
                            <li key={c.id} className="border-b pb-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={c.users?.photo_url || ""}
                                    alt={c.users?.username || "user"}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <span className="text-sm font-medium text-gray-800">{c.users?.username ?? ""}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ""}
                                </span>
                              </div>

                              {c.photo_url && (
                                <div className="mt-2">
                                  <img src={c.photo_url} alt="첨부 이미지" className="max-h-64 rounded-lg object-contain" />
                                </div>
                              )}

                              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">{c.content}</div> 

                              <button onClick={() => deleteComment(c.id)} className="text-xs text-gray-500 mt-2">
                                삭제
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "stages" && null}
        </div>
      </div>
    </div>
  );
}

// functions

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
  const { comments, loading, addComment, editComment, deleteComment } = useSongCommentVM(songId);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMeId(data?.user?.id ?? null);
    });
  }, []);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  const startEdit = (id: number, current: string, ownerId?: string) => {
    if (!meId || meId !== ownerId) return;
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

  const handleDelete = async (id: number, ownerId?: string) => {
    if (!meId || meId !== ownerId) return;
    await deleteComment(id);
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
          const isEditing = editingId === c.id;
          const mine = meId != null && String(c.user_id) === String(meId);

          return (
            <li key={c.id} className="flex gap-2 items-start">
              <img
                src={c.users?.photo_url || "/default-avatar.png"}
                alt={c.users?.username || "user"}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{c.users?.username ?? "익명"}</span>

                  {/* 우측 액션 */}
                  {mine && (
                    <div className="flex gap-2 text-xs text-gray-500">
                      {!isEditing ? (
                        <>
                          <button onClick={() => startEdit(c.id, c.comment, c.user_id)}>수정</button>
                          <button onClick={() => handleDelete(c.id, c.user_id)}>삭제</button>
                        </>
                      ) : (
                        <>
                          <button onClick={saveEdit} className="text-black">
                            저장
                          </button>
                          <button onClick={cancelEdit}>취소</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 본문: 보기 vs 편집 */}
                {!isEditing ? (
                  <p className="text-sm break-words whitespace-pre-wrap">{c.comment}</p>
                ) : (
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    autoFocus
                  />
                )}

                <span className="text-xs text-gray-400">{new Date(c.updated_at).toLocaleDateString()}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
