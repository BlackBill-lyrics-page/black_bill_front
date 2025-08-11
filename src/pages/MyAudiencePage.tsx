import { FiSettings } from "react-icons/fi";
import ProfileModal from "../components/ProfileModal";
import { useMyAudienceVM } from "../viewmodels/useMyAudienceVM";
import { useUserStore } from "../store/useUserStore";

export default function MyAudiencePage() {
  const {
    nickname,
    photoUrl,
    isModalOpen,
    openModal,
    closeModal,
    userId,
    provider,
  } = useMyAudienceVM();

  const sName = useUserStore((s) => s.username);
  const sPhoto = useUserStore((s) => s.photoUrl);

  const displayName = sName || nickname;
  const displayPhoto = sPhoto || photoUrl || "/default-profile.svg";

  return (
    <>
      <div className="flex items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <img
            src={displayPhoto}
            alt="프로필"
            className="w-full h-full object-cover"
          />
        </div>

        <span className="text-xl font-semibold">{displayName}님의 서랍장</span>

        <FiSettings
          className="w-6 h-6 text-gray-500 cursor-pointer"
          onClick={openModal}
        />
      </div>

      <ProfileModal
        open={isModalOpen}
        onClose={closeModal}
        userId={userId}
        provider={provider}
      />
    </>
  );
}
