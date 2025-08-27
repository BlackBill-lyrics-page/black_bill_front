import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import AlbumTracksPanel from "./AlbumTracksPanel";
import AlbumLikeButton from "./AlbumLikeButton";
import TextareaAutosize from "react-textarea-autosize";
import { FiChevronLeft, FiPlus, FiArrowUpRight } from "react-icons/fi";
import { useAlbumLikeVM } from "../viewmodels/useAlbumLikeVM";
import { useStageCommentVM } from "../viewmodels/useStageCommentVM";
import SongDetailPanel from "./SongDetailPanel";
import { useSongDetail } from "../hooks/useSongDetail";
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";

import StagePhotoStrip from "./StagePhotoStrip";
import StagePhotosModal from "./StagePhotosModal";
import SongCommentsInline from "./SongCommentsInline";

import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";

type UIAlbum = { id: string; name: string; photoUrl?: string | null };

type IconLike = React.ComponentType<{ className?: string }>;
const makeImgIcon = (src: string, alt: string): IconLike => {
  const ImgIcon: IconLike = ({ className }) => (
    <img src={src} alt={alt} className={className} />
  );
  return ImgIcon;
};

const YoutubeMusicIcon = makeImgIcon(ytMusicPng, "YouTube Music");
const MelonIcon = makeImgIcon(melonPng, "Melon");

export default function LikedAlbumDetail({
  album,
  onBack,
}: { album: UIAlbum; onBack: () => void }) {
  const [artistName, setArtistName] = useState<string>("");
  const [stages, setStages] = useState<Array<{ id: number; title: string | null; start_at: string | null }>>([]);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  // 좋아요 VM
  const albumLike = useAlbumLikeVM(Number(album.id));

  // 무대 댓글 VM
  const { comments, count: stageCommentCount, addComment, deleteComment } =
    useStageCommentVM(selectedStageId);

  // 입력 상태
  const [cmtText, setCmtText] = useState("");
  const [cmtFile, setCmtFile] = useState<File | undefined>();
  const [cmtPreview, setCmtPreview] = useState<string | null>(null);

  // song detail
  const {
    openSong,
    openLoading,
    panelRef,
    liked,
    likeCount,
    likeLoading,
    toggleLike,
    commentCount,
    open,
    close,
  } = useSongDetail();

  const platformMeta = (p: string) => {
    const key = (p ?? "").toLowerCase();

    const isYtMusic =
      key.includes("youtubemusic") ||
      key.includes("youtube music") ||
      key.includes("music.youtube") ||   // music.youtube.com
      key.includes("youtube.com/music"); // youtube.com/music

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

  //photobook modal 
  const [openPhotos, setOpenPhotos] = useState(false); 

  const photoGroups = useMemo(() => {
    // stageId -> 메타
    const meta = new Map<number, { title?: string|null; date?: string|null }>(); //Map key: value data structure
    stages.forEach((s) =>
      meta.set(s.id, { title: s.title ?? null, date: s.start_at ?? null })
    );

    // stageId -> 사진들
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
      .filter((c: any) => !!c.photo_url)
      .forEach((c: any) => {
        const sid = c.stage_id as number; 
        if (!buckets.has(sid)) {
          const m = meta.get(sid) || {};
          buckets.set(sid, { stageId: sid, title: m.title, date: m.date, items: [] }); //items: [] for photos
        }
        buckets.get(sid)!.items.push({
          id: c.id,
          url: c.photo_url as string,
          username: c.users?.username ?? null,
          naturalWidth: c.photo_w ?? undefined,
          naturalHeight: c.photo_h ?? undefined,
        });
      });

    // 날짜 최신 순으로 섹션 정렬(선택)
    return Array.from(buckets.values()).sort((a, b) => { // [ {stageId:1, title:..., date:..., items:...}, {stageId:2, ...}, ... ] from Map
      const ad = a.date ? +new Date(a.date) : 0;
      const bd = b.date ? +new Date(b.date) : 0;
      return bd - ad;
    });
  }, [comments, stages]);

  type AlbumWithArtist = {
    id: number;
    albumname: string;
    artists: {
      name: string;
    } | null;
  };

  // 아티스트 + 무대 목록 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: row } = await supabase
        .from("albums")
        .select("id, albumname, artists(name)")
        .eq("id", Number(album.id))
        .maybeSingle<AlbumWithArtist>();
      if (mounted) setArtistName(row?.artists?.name ?? "");

      const { data: st } = await supabase
        .from("stage_info")
        .select("id, title, start_at")
        .eq("album_id", Number(album.id))
        .order("start_at", { ascending: false })
        .order("id", { ascending: false });
      if (mounted) {
        setStages(st ?? []);
        setSelectedStageId(st?.[0]?.id ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [album.id]);

  // 이미지 미리보기
  useEffect(() => {
    if (!cmtFile) {
      setCmtPreview(null);
      return;
    }
    const url = URL.createObjectURL(cmtFile);
    setCmtPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cmtFile]);

  // 댓글 전송
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) return;
    if (!cmtText.trim() && !cmtFile) return;
    await addComment(cmtText, cmtFile);
    setCmtText("");
    setCmtFile(undefined);
  };

  return (
    <div className="mt-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="목록으로"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-3 p-3">
          {album.photoUrl && (
            <img
              src={album.photoUrl}
              alt={album.name}
              className="w-20 h-20 rounded object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">
              {album.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {artistName || "아티스트"}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* 곡 리스트 카드 */}
      <div className="mt-4 bg-white rounded-xl p-4">
        <span className="text-sm font-semibold block mb-2">곡 리스트</span>
        <AlbumTracksPanel
          albumId={Number(album.id)}
          onOpen={(s) => open(s.id)} // onOpen?: (song: { id: number; title?: string }) => void;
        />
      </div>

      {(openLoading || openSong) ? (
        <SongDetailPanel
          openSong={openSong}
          openLoading={openLoading}
          onClose={close}
          platformMeta={platformMeta}
          liked={liked}
          likeCount={likeCount}
          likeLoading={likeLoading}
          onToggleLike={toggleLike}
          commentCount={commentCount}
          panelRef={panelRef}
          commentsSlot={openSong ? <SongCommentsInline songId={openSong.id} /> : null}
        />
      ) : (

        <div className="mt-4 bg-white rounded-xl p-4">
          {/* 좋아요/댓글 카운터 */}
          <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
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

          {/* 무대 드롭다운 */}
          {stages.length ? (
            <div className="mb-3 flex items-center gap-2 min-w-0">
              <span className="text-sm text-gray-500 shrink-0 whitespace-nowrap">무대:</span>
              <select
                value={selectedStageId ?? ""}
                onChange={(e) => setSelectedStageId(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.title || `Stage #${s.id}`) +
                      (s.start_at
                        ? ` — ${new Date(s.start_at).toLocaleDateString()}`
                        : "")}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3 text-sm text-gray-500">
              이 가사집에 연결된 무대가 없습니다.
            </div>
          )}

          <StagePhotoStrip
            comments={comments}
            onOpenAll={() => setOpenPhotos(true)}
          />

          <StagePhotosModal
            open={openPhotos}
            onClose={() => setOpenPhotos(false)}
            groups={photoGroups}
          />

          {/* 댓글 입력 */}
          {selectedStageId && (
            <form
              onSubmit={onSubmit}
              className="mt-4 flex items-center gap-2 bg-white border rounded-3xl px-1"
            >
              <label className="mx-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer">
                <FiPlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCmtFile(e.target.files?.[0])}
                />
              </label>

              {cmtPreview && (
                <div className="relative ml-1 shrink-0">
                  <img
                    src={cmtPreview}
                    alt="preview"
                    className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setCmtFile(undefined)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] leading-none"
                    aria-label="미리보기 제거"
                  >
                    ×
                  </button>
                </div>
              )}

              <TextareaAutosize
                value={cmtText}
                onChange={(e) => setCmtText(e.target.value)}
                placeholder="이미지를 드래그, 또는 댓글을 작성해주세요."
                className="flex-1 rounded px-3 py-2 text-sm"
                minRows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement).requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1 "
              >
                <FiArrowUpRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* 댓글 리스트 */}
          <ul className="space-y-3 mt-10">
            {comments.map((c) => (
              <li key={c.id} className="border-b pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={c.users?.photo_url || "/default-avatar.png"}
                      alt={c.users?.username || "user"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {c.users?.username ?? ""}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ""}
                  </span>
                </div>

                {c.photo_url && (
                  <div className="mt-2">
                    <img
                      src={c.photo_url}
                      alt="첨부"
                      className="max-h-64 rounded-lg border object-contain"
                    />
                  </div>
                )}

                <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {c.content}
                </div>

                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-xs text-gray-500 mt-2"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>

        </div>
      )}
    </div>
  );
}
