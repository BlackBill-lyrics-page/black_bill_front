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

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  const isOwner = !!(finalArtist && userId && finalArtist.userId === userId);

  console.log("finalArtist", finalArtist);
  console.log("finalArtist.userId", finalArtist?.userId);
  console.log("userId", userId);
  console.log("isOwner", isOwner);

  if (loading) return <div className="p-6">로딩중...</div>;

  if (!finalArtist) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <img
            src="/default-profile.svg"
            alt="기본 프로필"
            className="w-10 h-10 object-cover"
          />
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
      {/* UI usage from ArtistProfileView */}
      <ArtistProfileView
        artist={finalArtist}
        isOwner={isOwner}
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

        onAddStage={() => navigate("/add-stage")} // isowner 추가해야함 나중에 구현후
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* modal management */}
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
    </>
  );
}
