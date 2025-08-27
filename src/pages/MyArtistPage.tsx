// MyArtistPage.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { buildArtistAlbumPublicUrl } from "../utility/buildArtistAlbumPublicUrl";

type AlbumLite = { id: number; albumname?: string | null; created_at?: string | null };

export default function MyArtistPage() {
  const { artist: vmArtist, loading } = useMyArtistVM();
  const sArtist = useArtistStore((s) => s.artist);
  const finalArtist = sArtist?.id ? sArtist : vmArtist;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"songs" | "books" | "stages">("songs");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==== Songs Modal ====
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<VmSong | null>(null);

  // ==== Albums Modal ====
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);

  // ==== Stage Modal ====
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageInitial, setStageInitial] = useState<Partial<StageFormValues> | null>(null);

  // “갱신 트리거”용 bump들
  const [calendarBump, setCalendarBump] = useState(0);
  const [profileBump, setProfileBump] = useState(0); // 곡/프로필/가사집 리스트 강제 리렌더

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
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
    })();
  }, []);

  const isOwner = !!(finalArtist && userId && (finalArtist as any).userId === userId);

  // ==== Albums for Stages tab selector ====
  const [albums, setAlbums] = useState<AlbumLite[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | "">("");

  // ✅ 앨범 목록 재조회 함수
  const reloadAlbums = useCallback(async () => {
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
    const list = (data ?? []) as AlbumLite[];
    setAlbums(list);
    setSelectedAlbumId((prev) => {
      if (list.length === 0) return "";
      const stillExists = prev && list.some((d) => Number(d.id) === Number(prev));
      return stillExists ? prev : Number(list[0].id);
    });
  }, [finalArtist?.id]);

  // ✅ 초기 1회 로드
  useEffect(() => {
    reloadAlbums();
  }, [reloadAlbums]);

  // ✅ 곡/프로필 섹션 강제 리렌더(내부 fetch 트리거)용
  const reloadSongs = useCallback(() => {
    setProfileBump((x) => x + 1);
  }, []);

  // 공개 링크 (기존 로직 유지)
  const openedAlbumIdFromURL = searchParams.get("album");
  const qrPublicUrl = useMemo(() => {
    if (!finalArtist?.id || !openedAlbumIdFromURL) return "";
    return buildArtistAlbumPublicUrl({
      artistId: finalArtist.id,
      albumId: openedAlbumIdFromURL,
      utm: { src: "qr", medium: "offline" },
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
        key={profileBump}   // ✅ bump로 강제 리렌더
        artist={finalArtist}
        isOwner={true}
        authReady={authReady}
        followerCount={finalArtist.followerCount ?? 0}
        onEditProfile={() => setIsModalOpen(true)}
        rightExtra={<RoleSwitcher align="right" label="아티스트" />}

        // === 상단 액션 ===
        onAddSong={() => {
          if (!isOwner) return;
          setEditingSong(null);
          setIsSongModalOpen(true);
        }}
        onAddBook={() => {
          if (!isOwner) return;
          if (!userId) return alert("로그인 후 이용해주세요.");
          setEditingAlbumId(null);
          setIsAlbumModalOpen(true);
        }}

        // === 리스트 아이템 편집 진입 ===
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
          if (!userId) return alert("로그인 후 이용해주세요.");
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
      />

      {/* === Stages 탭 콘텐츠 === */}
      {activeTab === "stages" && (
        <div className="p-4 flex flex-col gap-4 w-full max-w-[700px] mx-auto [@media(max-width:375px)]:p-3">
          <div className="flex flex-wrap items-center gap-2 [@media(max-width:375px)]:gap-1">
            <label className="text-sm text-gray-600 [@media(max-width:375px)]:text-xs">무대 연결 가사집</label>

            <select
              className="border rounded-lg px-2 py-1 min-w-[160px] [@media(max-width:375px)]:text-sm [@media(max-width:375px)]:flex-1"
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value ? Number(e.target.value) : "")}
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
                className="ml-auto px-3 py-2 rounded-xl border [@media(max-width:375px)]:ml-0 [@media(max-width:375px)]:w-full"
                onClick={() => {
                  if (!selectedAlbumId) return alert("무대를 연결할 가사집을 먼저 선택해주세요.");
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
              if (!selectedAlbumId) return alert("무대를 연결할 가사집을 먼저 선택해주세요.");
              openCreateStage(dateStr);
            }}
          />
        </div>
      )}

      {/* === 모달들 === */}
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
          // ✅ 곡 생성/수정/삭제 → 즉시 갱신
          onChanged={() => {
            // 내부 fetch형 컴포넌트(ArtistProfileView)라면 bump만으로 충분
            reloadSongs();
          }}
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
          // ✅ 앨범 생성/수정/삭제 → 목록/프로필/캘린더 갱신
          onChanged={async (kind) => {
            await reloadAlbums();         // 스테이지 탭의 앨범 셀렉터 갱신
            reloadSongs();                // 프로필/가사집 섹션 리렌더 (곡/가사집 카드가 최신)
            if (kind !== "updated") {
              setCalendarBump((k) => k + 1); // 생성/삭제 시 캘린더 영향 가능 → bump
            }
          }}
        />
      )}

      {isStageModalOpen && selectedAlbumId && (
        <UploadAndEditStageModal
          open={isStageModalOpen}
          onClose={() => { setIsStageModalOpen(false); setStageInitial(null); }}
          mode="create"
          artistId={finalArtist.id}
          albumId={Number(selectedAlbumId)}
          initialStage={null}
          initialForm={stageInitial ?? undefined}
          // ✅ 무대 생성/수정/삭제 → 캘린더 즉시 갱신
          onChanged={() => setCalendarBump((k) => k + 1)}
        />
      )}
    </>
  );
}
