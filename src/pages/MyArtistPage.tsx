// MyArtistPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // [NEW]
import { supabase } from "../lib/supabaseClient";
import { useMyArtistVM } from "../viewmodels/useMyArtistVM";
import { useArtistStore } from "../store/useArtistStore";
import ArtistProfileView from "../components/ArtistProfileView";
import ArtistProfileEditModal from "../components/ArtistProfileEditModal";
import UploadSongsModal from "../components/uploadAndEditSongsModal";
import UploadAndEditAlbumsModal from "../components/uploadAndEditAlbumsModal";
import type { Songs as VmSong } from "../viewmodels/useUploadSongsVM";
import RoleSwitcher from "../components/RoleSwitcher";
import UploadAndEditStageModal from "../components/stage/UploadAndEditStageModal";
import type { StageFormValues } from "../components/stage/StageForm";
import ArtistStagesCalendar from "../components/stage/ArtistStagesCalendar";

// [NEW] QR 버튼 & 공개 URL 유틸
import QRDownloadButton from "../components/QRDownloadButton";
import { buildArtistAlbumPublicUrl } from "../utility/buildArtistAlbumPublicUrl";

// title -> albumname 으로 교체
type AlbumLite = { id: number; albumname?: string | null; created_at?: string | null };

export default function MyArtistPage() {
  const { artist: vmArtist, loading } = useMyArtistVM();
  const sArtist = useArtistStore((s) => s.artist);
  const finalArtist = sArtist?.id ? sArtist : vmArtist;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // [NEW]

  const [activeTab, setActiveTab] = useState<"songs" | "books" | "stages">("songs");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<VmSong | null>(null);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);

  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageInitial, setStageInitial] = useState<Partial<StageFormValues> | null>(null);

  const [calendarBump, setCalendarBump] = useState(0);

  function openCreateStage(selectedDate?: string) {
    setActiveTab("stages");
    setStageInitial({
      date: selectedDate ?? new Date().toISOString().slice(0, 10),
      time: "19:30",
      duration_hours: 2,
      title: "",
      venue: null,
      promotion_url: "",
      address_detail: "",
    });
    setIsStageModalOpen(true);
  }

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  const isOwner = !!(finalArtist && userId && (finalArtist as any).userId === userId);

  //  가사집(앨범) 목록 & 선택 상태 (Stages 탭용 셀렉터)
  const [albums, setAlbums] = useState<AlbumLite[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      if (!finalArtist?.id) return;
      const { data, error } = await supabase
        .from("albums")
        .select("id, albumname, created_at")
        .eq("artist_id", finalArtist.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("albums load error", error);
        return;
      }
      if (data) {
        setAlbums(data as AlbumLite[]);
        if (data.length > 0) {
          setSelectedAlbumId((prev) => (prev === "" ? Number(data[0].id) : prev));
        } else {
          setSelectedAlbumId("");
        }
      }
    })();
  }, [finalArtist?.id]);

  // [NEW] 현재 ArtistProfileView(가사집 탭)에서 선택된 가사집 id는 URL 쿼리로 옴(?album=)
  const openedAlbumIdFromURL = searchParams.get("album");

  // [NEW] 관객용 ArtistPage에서 해당 가사집이 자동 오픈되는 공개 링크 생성
  const qrPublicUrl = useMemo(() => {
    if (!finalArtist?.id || !openedAlbumIdFromURL) return "";
    return buildArtistAlbumPublicUrl({
      artistId: finalArtist.id,
      albumId: openedAlbumIdFromURL,
      utm: { src: "qr", medium: "offline" }, // (옵션)
    });
  }, [finalArtist?.id, openedAlbumIdFromURL]);

  if (loading) return <div className="p-6">로딩중...</div>;

  if (!finalArtist) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <img src="/default-profile.svg" alt="기본 프로필" className="w-10 h-10 object-cover" />
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

  return (
    <>
      <ArtistProfileView
        artist={finalArtist}
        isOwner={isOwner}
        followerCount={finalArtist.followerCount ?? 0}
        onEditProfile={() => setIsModalOpen(true)}
        onAddSong={() => {
          if (!isOwner) return;
          setEditingSong(null);
          setIsSongModalOpen(true);
        }}
        onAddBook={() => {
          if (!isOwner) return;
          if (!userId) {
            alert("로그인 후 이용해주세요.");
            return;
          }
          setEditingAlbumId(null);
          setIsAlbumModalOpen(true);
        }}
        onEditSong={(ui) => {
          if (!isOwner) return;
          setEditingSong({
            id: Number(ui.id),
            artist_id: finalArtist.id,
            title: ui.title ?? "",
            lyrics: "",
            bio: "",
            song_photo: ui.photoUrl ?? "",
            created_at: ui.createdAt ?? null,
            song_link: "",
            links: [],
          });
          setIsSongModalOpen(true);
        }}
        onEditBook={(album) => {
          if (!isOwner) return;
          if (!userId) {
            alert("로그인 후 이용해주세요.");
            return;
          }
          setEditingAlbumId(Number(album.id));
          setIsAlbumModalOpen(true);
        }}
        onAddStage={() => {
          if (!isOwner) return;
          if (!selectedAlbumId) {
            alert("무대를 연결할 가사집을 먼저 선택해주세요.");
            setActiveTab("stages");
            return;
          }
          openCreateStage();
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        // // [NEW] 우측 상단에 QR 다운로드 버튼 추가 (가사집 탭에서, 특정 가사집이 열려 있을 때만)
        // rightExtra={
        //   <div className="pl-2 flex items-center gap-2">
        //     <RoleSwitcher align="right" label="아티스트" />
        //     {activeTab === "books" && isOwner && (
        //       openedAlbumIdFromURL ? (
        //         <QRDownloadButton
        //           url={qrPublicUrl}
        //           filename={`artist_${finalArtist.id}_album_${openedAlbumIdFromURL}_qr.png`}
        //           label="QR 다운로드"
        //         />
        //       ) : (
        //         <button
        //           type="button"
        //           className="px-3 py-2 rounded-xl border text-sm text-gray-500"
        //           title="가사집을 선택하면 QR을 받을 수 있어요"
        //           disabled
        //         >
        //           QR 다운로드
        //         </button>
        //       )
        //     )}
        //   </div>
        // }
      />

      {/* === Stages 탭 콘텐츠 === */}
      {activeTab === "stages" && (
        <div
          className="
            p-4 flex flex-col gap-4
            w-full max-w-[700px] mx-auto
            [@media(max-width:375px)]:p-3
          "
        >
          <div
            className="
              flex flex-wrap items-center gap-2
              [@media(max-width:375px)]:gap-1
            "
          >
            <label className="text-sm text-gray-600 [@media(max-width:375px)]:text-xs">
              무대 연결 가사집
            </label>

            <select
              className="
                border rounded-lg px-2 py-1
                min-w-[160px]
                [@media(max-width:375px)]:text-sm
                [@media(max-width:375px)]:flex-1
              "
              value={selectedAlbumId}
              onChange={(e) =>
                setSelectedAlbumId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">선택하세요</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.albumname ?? `가사집 #${a.id}`}
                </option>
              ))}
            </select>

            {isOwner && (
              <button
                className="
                  ml-auto px-3 py-2 rounded-xl border
                  [@media(max-width:375px)]:ml-0
                  [@media(max-width:375px)]:w-full
                "
                onClick={() => {
                  if (!selectedAlbumId) {
                    alert("무대를 연결할 가사집을 먼저 선택해주세요.");
                    return;
                  }
                  openCreateStage();
                }}
              >
                무대 추가 +
              </button>
            )}
          </div>

          <ArtistStagesCalendar
            key={calendarBump}
            artistId={finalArtist.id}
            mode={isOwner ? "owner" : "viewer"}
            canEdit={isOwner}
            onRequestCreate={(dateStr: string) => {
              if (!isOwner) return;
              if (!selectedAlbumId) {
                alert("무대를 연결할 가사집을 먼저 선택해주세요.");
                return;
              }
              openCreateStage(dateStr);
            }}
          />
        </div>
      )}

      {/* === 기존 모달들 === */}
      {isModalOpen && (
        <ArtistProfileEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          artist={finalArtist}
        />
      )}
      {isSongModalOpen && (
        <UploadSongsModal
          isOpen={isSongModalOpen}
          onClose={() => setIsSongModalOpen(false)}
          initialSong={editingSong}
        />
      )}
      {isAlbumModalOpen && userId && (
        <UploadAndEditAlbumsModal
          isOpen={isAlbumModalOpen}
          onClose={() => {
            setIsAlbumModalOpen(false);
            setEditingAlbumId(null);
          }}
          artistId={finalArtist.id}
          albumId={editingAlbumId ?? undefined}
          userId={userId}
        />
      )}
      {isStageModalOpen && selectedAlbumId && (
        <UploadAndEditStageModal
          open={isStageModalOpen}
          onClose={() => { setIsStageModalOpen(false); setStageInitial(null); setCalendarBump((k) => k + 1); }}
          mode="create"
          artistId={finalArtist.id}
          albumId={Number(selectedAlbumId)}
          initialStage={null}
          initialForm={stageInitial ?? undefined}
        />
      )}
    </>
  );
}
