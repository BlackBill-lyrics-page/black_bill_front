// MyArtistPage.tsx (발췌 + 수정)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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


// title -> albumname 으로 교체
type AlbumLite = { id: number; albumname?: string | null; created_at?: string | null };

export default function MyArtistPage() {
  const { artist: vmArtist, loading } = useMyArtistVM();
  const sArtist = useArtistStore((s) => s.artist);
  const finalArtist = sArtist?.id ? sArtist : vmArtist;
  const navigate = useNavigate();

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

  //  가사집(앨범) 목록 & 선택 상태
  const [albums, setAlbums] = useState<AlbumLite[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      if (!finalArtist?.id) return;
      // 🔧 SELECT 수정: id, albumname, created_at
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
          if (!selectedAlbumId) {                    //  가사집 미선택 보호
            alert("무대를 연결할 가사집을 먼저 선택해주세요.");
            setActiveTab("stages");
            return;
          }
          openCreateStage();           //  탭 전환 + 모달 오픈
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}

        rightExtra={
          <div className="pl-2">
            <RoleSwitcher align="right" label="아티스트" />
          </div>
        }
      />

      {/* === Stages 탭 콘텐츠 === */}
      {activeTab === "stages" && (
        <div className="p-4 flex flex-col gap-4">
          {/*  가사집 선택 셀렉터 추가 (무대 생성 시 albumId로 사용) */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">무대 연결 가사집</label>
            <select
              className="border rounded-lg px-2 py-1"
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
                className="ml-auto px-3 py-2 rounded-xl border"
                onClick={() => {
                  if (!selectedAlbumId) {
                    alert("무대를 연결할 가사집을 먼저 선택해주세요.");
                    return;
                  }
                  openCreateStage();                 //  셀렉터 옆의 '무대 추가' 빠르게
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
              openCreateStage(dateStr);               //  선택 날짜로 초기화
            }}
          // onItemClick={(s) => {                   // (옵션) 오너가 아닐 때 클릭 동작
          //   if (!isOwner && s.promotion_url) window.open(s.promotion_url, "_blank");
          // }}
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
          onClose={() => { setIsStageModalOpen(false); setStageInitial(null); setCalendarBump((k) => k + 1);}}
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
