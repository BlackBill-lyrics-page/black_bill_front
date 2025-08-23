import AlbumsList from "./AlbumList";
import SongList from "./SongList";
import type { UISong } from "./SongList";
import type { UIAlbum } from "./AlbumList";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import AlbumTracksPanel from "./AlbumTracksPanel";
import SongDetailPanel from "./SongDetailPanel";
import AlbumLikeButton from "./AlbumLikeButton";

import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";

import { useSongLikeVM } from "../viewmodels/useSongLikeVM";
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";
import { useStageCommentVM } from "../viewmodels/useStageCommentVM";
import { useAlbumLikeVM } from "../viewmodels/useAlbumLikeVM";

import { FiChevronRight, FiChevronDown, FiCopy, FiSettings, FiPlus, FiChevronLeft, FiArrowDown, FiArrowUpRight } from "react-icons/fi"; 
import { FaYoutube, FaSpotify, FaSoundcloud, FaLink, FaHeart, FaRegHeart } from "react-icons/fa";
import { SiApplemusic} from "react-icons/si";

import TextareaAutosize from "react-textarea-autosize";

import StagePhotoStrip from "./StagePhotoStrip";
import StagePhotosModal from "./StagePhotosModal";


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
  bio : string | null;
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
  followerCount?: number;
  following?: boolean;
  followLoading?: boolean;
  onToggleFollow?: ()=>void;
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
  links?: {platform : string; url:string}[];
};

type IconLike = React.ComponentType<{ className?: string }>; // melon, youtubemusic
const makeImgIcon = (src: string, alt: string): IconLike => {
  const ImgIcon: IconLike = ({ className }) => (
    <img src={src} alt={alt} className={className} />
  );
  return ImgIcon;
};

const YoutubeMusicIcon = makeImgIcon(ytMusicPng, "YouTube Music");
const MelonIcon = makeImgIcon(melonPng, "Melon");


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
  followerCount = 0,
  following = false,
  followLoading = false,
  onToggleFollow,
  rightExtra,
}: Props) {

    const [openSong, setOpenSong] = useState<SongDetail | null>(null);
    const [openLoading, setOpenLoading] = useState(false);
    const detailRef = useRef<HTMLDivElement | null>(null);
    const {likeCount, liked, loading, toggleLike} = useSongLikeVM(openSong?.id);
    const { count } = useSongCommentVM(openSong?.id??null)

    const [selectedAlbum, setSelectedAlbum] = useState<UIAlbum | null>(null);

    const [stages, setStages] = useState<Array<{ id:number; title:string|null; start_at:string|null }>>([]);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

    //stage comment VM
    const {
      comments,
      count : stageCommentCount,
      addComment,
      deleteComment,
      loading: stageCmtLoading,
    } = useStageCommentVM(selectedStageId);

  // 전체보기 모달 on/off
  const [openPhotos, setOpenPhotos] = useState(false);

  // 포토북용 데이터 묶기 (무대별 그룹)
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
          naturalWidth:  c.photo_w ?? undefined,   // ← DB 컬럼 사용
          naturalHeight: c.photo_h ?? undefined,
        });
      });

    return Array.from(buckets.values()).sort((a, b) => {
      const ad = a.date ? +new Date(a.date) : 0;
      const bd = b.date ? +new Date(b.date) : 0;
      return bd - ad;
    });
  }, [comments, stages]);



    const [cmtText, setCmtText] = useState("");
    const [cmtFile, setCmtFile] = useState<File | undefined>(undefined);
    const [cmtPreview, setCmtPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    

    const handleSubmitStageComment = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (!cmtText.trim() && !cmtFile) return; 
        await addComment(cmtText, cmtFile);
        setCmtText("");
        setCmtFile(undefined);
      } catch (err:any) {
        alert(err.message ?? "업로드에 실패했습니다.");
      }
    };


    const [snsOpen, setSnsOpen] = useState(false);
    const [selectedSNS, setSelectedSNS] = useState<Link | null>(
      artist.links?.length ? artist.links[0] : null
    );

    const albumLike = useAlbumLikeVM(selectedAlbum ? Number(selectedAlbum.id) : undefined);

    const [albums, setAlbums] = useState<UIAlbum[]>([]);

     useEffect(() => {
      (async () => {
        // 1) 앨범 기본 정보
        const { data: albumsRows, error: albumsErr } = await supabase
          .from("albums")
          .select("id, name:albumname, photo_url, created_at")
          .eq("artist_id", artist.id)
          .order("created_at", { ascending: false });
      
        if (albumsErr) {
          console.error("[albums select error]", albumsErr);
          setAlbums([]);
          return;
        }
      
        // 미리 기본 배열 세팅(댓글수 0)
        const base: UIAlbum[] = (albumsRows ?? []).map((a: any) => ({
          id: String(a.id),
          name: a.name ?? "(제목 없음)",
          photoUrl: a.photo_url ?? null,
          createdAt: a.created_at ?? null,
          commentCount: 0,
        }));
        setAlbums(base);
      
        // 앨범이 없으면 끝
        const albumIds = (albumsRows ?? []).map((a: any) => a.id);
        if (!albumIds.length) return;
      
        // 2) 해당 앨범들의 stage 목록 가져오기 (id, album_id)
        const { data: stages, error: stagesErr } = await supabase
          .from("stage_info")
          .select("id, album_id")
          .in("album_id", albumIds);
      
        if (stagesErr || !stages?.length) {
          if (stagesErr) console.error("[stage_info select error]", stagesErr);
          return; // 무대가 없으면 댓글수는 0 유지
        }
      
        const stageIds = stages.map(s => s.id);
      
        // 3) 그 무대들의 댓글만 가볍게 가져오기 (stage_id만)
        const { data: comments, error: cErr } = await supabase
          .from("stage_comments")
          .select("id, stage_id")
          .in("stage_id", stageIds);
      
        if (cErr) {
          console.error("[stage_comments select error]", cErr);
          return;
        }
      
        // 4) album_id별 댓글 수 집계
        const stageToAlbum = new Map<number, number>();
        stages.forEach(s => stageToAlbum.set(s.id, s.album_id));
      
        const byAlbum: Record<number, number> = {};
        (comments ?? []).forEach(c => {
          const albumId = stageToAlbum.get(c.stage_id as number);
          if (albumId != null) {
            byAlbum[albumId] = (byAlbum[albumId] ?? 0) + 1;
          }
        });
      
        // 5) setAlbums에 댓글 수 반영
        setAlbums(prev =>
          prev.map(a => ({
            ...a,
            commentCount: byAlbum[Number(a.id)] ?? 0,
          })),
        );
      })();
    }, [artist.id]);


    useEffect(() => {
      setSelectedSNS(artist.links?.length ? artist.links[0] : null);
      setSnsOpen(false);
    }, [artist]);

    useEffect(() => {
      (async () => {
        if (!selectedAlbum) {
          setStages([]); setSelectedStageId(null);
          return;
        }
        const { data, error } = await supabase
          .from("stage_info")
          .select("id, title, start_at")
          .eq("album_id", Number(selectedAlbum.id))
          .order("start_at", { ascending: false })    // 최신 무대 우선
          .order("id", { ascending: false });         // start_at 없을 때 대비
        if (error) { console.error(error); setStages([]); setSelectedStageId(null); return; }
      
        setStages(data || []);
        setSelectedStageId(data?.[0]?.id ?? null);    // 기본 선택: 첫 번째 무대
      })();
    }, [selectedAlbum]);

    useEffect(() => { //stage photo upload preview
      if (!cmtFile) { setCmtPreview(null); return; }
      const url = URL.createObjectURL(cmtFile);
      setCmtPreview(url);
      return () => URL.revokeObjectURL(url); // 메모리 해제
    }, [cmtFile]);



    const platformMeta = (p: string) => {
      const key = (p ?? "").toLowerCase();

      // URL(host)도 잡아주기
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

  const songDetailJSX = ( //song dropdown 
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
      <div className="flex items-center gap-4 p-6">

        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {artist.photoUrl ? (
            <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <span>No Photo</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{artist.name}</h2>
          {isOwner && (
            <FiSettings
              className="w-6 h-6 text-gray-500 cursor-pointer mt-2 mx-5"
              onClick={onEditProfile}
            />
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {followerCount} <span className="text-gray-400">팔로워</span>
          </span>
        </div>
        
        {rightExtra}

        {!isOwner &&(
          <button
            type="button"
            onClick={onToggleFollow}
            disabled={followLoading}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              following ? "bg-gray-100 text-gray-800 border-gray-200" : "bg-black text-white border-black"
            }`}
          >
            {following ? "팔로잉" : "팔로우"}
          </button>
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
        <div><span className="font-semibold">소개:</span> {artist.bio || "-"}</div>
      </div>

      {/* SNS 링크 (공통) */}
      {/* SNS 링크 (드롭다운 + 오른쪽 링크/복사) */}
      <div className="px-6 mt-4">
        {artist.links?.length ? (
          <div className="flex items-center gap-3">
            {/* 왼쪽: 드롭다운 버튼 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSnsOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
              >
                {selectedSNS?.platform ?? "SNS"}
                <FiChevronDown
                  className={`transition-transform ${snsOpen ? "rotate-180" : ""}`}
                />
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
            
            {/* 오른쪽: 선택된 링크 표시 + 복사 */}
            {selectedSNS && (
              <div className="flex items-center gap-2">

                <a
                  href={selectedSNS.url}
                  target="_blank" //new tab open
                  rel="noopener noreferrer"
                  className="text-sm text-gray-800 hover:underline"
                  title={selectedSNS.url}
                >
                  {selectedSNS.url}
                </a>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selectedSNS.url).then(()=>{alert("복사되었습니다")})}
                  className="p-1 rounded hover:bg-gray-200 flex items-center justify-center"
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
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <TabButton active={activeTab === "books"} onClick={() => setActiveTab("books")} label="가사집" />
            <TabButton active={activeTab === "songs"} onClick={() => setActiveTab("songs")} label="곡" />
            <TabButton active={activeTab === "stages"} onClick={() => setActiveTab("stages")} label="아티스트 공연" />
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

                  {(openLoading || openSong) && songDetailJSX}
                    </div>
                  )}
                  {activeTab === "books" && (
                    <div className="text-gray-900">
                      {!selectedAlbum ? (
                        // 목록 뷰
                        <AlbumsList
                          albums={albums}
                          readOnly={!isOwner}
                          onEdit={onEditBook}
                          onOpen={(a) => setSelectedAlbum(a)} // 클릭 → 상세로 전환
                        />
                      ) : (
                        // 상세(선택한 가사집 + 곡 리스트) 뷰
                        <div className="mt-4">
                          {/* 헤더(뒤로가기 + 커버/제목/아티스트) */}
                          <div className="flex items-center gap-3 p-3">
                            
                            <button
                              type="button"
                              onClick={() => setSelectedAlbum(null)}               // ← 뒤로: 목록으로 복귀
                              className="p-1 rounded hover:bg-gray-100"
                              aria-label="목록으로"
                            >
                              <FiChevronLeft className="w-5 h-5" />
                            </button>
                      
                            <div className="flex items-start gap-3 p-3">
                              {selectedAlbum?.photoUrl && (
                                <img src={selectedAlbum.photoUrl} alt={selectedAlbum.name} className="w-20 h-20 rounded object-cover" />
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold leading-tight truncate">{selectedAlbum.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{artist.name}</div>
                              </div>
                            </div>
                          </div>
                            
                          <div className="w-full h-px bg-gray-200" />
                            
                          {/* 곡 리스트 섹션 */}
                          <div className="mt-2">
                            <span className="text-sm font-semibold block mb-2">곡 리스트</span>
                            <div className="bg-white rounded-xl p-4">
                              <AlbumTracksPanel
                                albumId={Number(selectedAlbum.id)}                 // string → number
                                onOpen={(s) => handleOpenSong({ id: String(s.id), title: s.title } as any)}
                              />

                              {/* songdropdown */}

                            </div>
                          </div>

                          
                          {(openLoading||openSong)?(
                            songDetailJSX
                          ):(
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
                            <div className="mb-3 text-sm text-gray-500 px-1">
                              이 가사집에 연결된 무대가 없습니다.
                            </div>
                          )}


                          {/* 좋아요 댓글 카운트 */}
                          <div className="flex items-center gap-4 text-sm text-gray-700 px-1 mb-2">
                          
                            <AlbumLikeButton
                              mode="controlled"
                              liked={albumLike.liked}
                              likeCount={albumLike.likeCount}
                              likeLoading={albumLike.loading}
                              onToggleLike={albumLike.toggleLike}
                              showCount={false}              //  카운트는 옆에서 따로 출력
                            />
                            <span>좋아요({albumLike.likeCount ?? 0})</span>
                          

                          <span>댓글({stageCommentCount ?? 0})</span>
                        </div>

                          <StagePhotoStrip
                            comments={comments}
                            onOpenAll={() => setOpenPhotos(true)}
                          />
                                                  
                          <StagePhotosModal
                            open={openPhotos}
                            onClose={() => setOpenPhotos(false)}
                            groups={photoGroups}
                          />

                          {/* 이미지 업로드 + 썸네일 리스트 */}
                            {selectedStageId &&(
                              <form 
                                onSubmit={handleSubmitStageComment} 
                                onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
                                onDragLeave={()=>setDragOver(false)}
                                onDrop={(e)=>{
                                  e.preventDefault(); setDragOver(false);
                                  const f = Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith("image/"));
                                  if (f) setCmtFile(f);
                                }}
                                className={`flex items-center gap-2 bg-white border rounded-3xl px-1 ${dragOver ? "ring-2 ring-gray-300" : ""}`}

                              >
                              {/* + 버튼 */}
                              <label className="mx-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer">
                                <FiPlus className="w-5 h-5"/>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => setCmtFile(e.target.files?.[0])}
                                />
                              </label>

                              {/* ✅ 미리보기 썸네일 */}
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
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] leading-none"
                                    aria-label="미리보기 제거"
                                    title="미리보기 제거"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}


                              {/* 입력창 */}
                              <TextareaAutosize //UI 추후 개선 
                                value={cmtText}
                                onChange={(e) => setCmtText(e.target.value)}
                                placeholder="이미지를 드래그, 또는 댓글을 작성해주세요."
                                className="flex-1 rounded px-3 py-2 text-sm"
                                minRows={1}
                                onKeyDown={(e)=>{
                                  if (e.key === "Enter" && !e.shiftKey){
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                  }
                                }}
                              />
                              {/* 전송 버튼 */}
                              <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1 ">
                                <FiArrowUpRight className="w-5 h-5"/>
                              </button>
                            </form>
                            )}

                          <div className="mt-6 space-y-4 mt-10">
                            {/* 댓글 리스트 */}
                            <ul className="space-y-3">
                              {comments.map((c) => (
                                <li key={c.id} className="border-b pb-4">
                                  {/* 헤더: 좌측 닉네임, 우측 날짜 */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={c.users?.photo_url || ""}
                                        alt={c.users?.username || "user"}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                      <span className="text-sm font-medium text-gray-800">
                                        {c.users?.username??""}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString():""}
                                    </span>

                                  </div>

                                  {c.photo_url && (
                                    <div className="mt-2">
                                      <img
                                        src={c.photo_url}
                                        alt="첨부 이미지"
                                        className="max-h-64 rounded-lg border object-contain"
                                      />
                                    </div>
                                  )}

                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {c.content}
                                  </div>

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



//functions

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
          const isEditing = editingId === c.id; //editing
          const mine = meId != null && String(c.user_id) === String(meId)

          return (
            <li key={c.id} className="flex gap-2 items-start">
              <img
                src={c.users?.photo_url || "/default-avatar.png"}
                alt={c.users?.username || "user"}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{c.users?.username?? "익명"}</span>

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
                          <button onClick={saveEdit} className="text-black">저장</button>
                          <button onClick={cancelEdit}>취소</button>
                        </>
                      )}
                    </div>
                  )}
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
                  {new Date(c.updated_at).toLocaleDateString()} 
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}