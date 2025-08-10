import { FiSettings } from "react-icons/fi";
import { useMyArtistVM } from "../viewmodels/useMyArtistVM";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ArtistProfileEditModal from "../components/ArtistProfileEditModal";

export default function MyArtistPage() {
  const { artist, loading } = useMyArtistVM();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div className="p-6">로딩중...</div>;


  if (!artist) {
    

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
        <div className="flex items-center gap-4 p-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {artist.photo_url ? (
              <img
                src={artist.photo_url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>No Photo</span>
            )}
          </div>
          <h2 className="text-xl font-semibold">{artist.name}</h2>
          <FiSettings
            className="w-6 h-6 text-gray-500 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        
        {/* 모달 */}
        {isModalOpen && (
          <ArtistProfileEditModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            artist={artist}
          />
        )}
      </>
    );

}
