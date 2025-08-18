import { useState, useEffect, useRef } from "react";
import { FiSettings, FiPlus } from "react-icons/fi";
import ProfileModal from "../components/ProfileModal";
import { useMyAudienceVM } from "../viewmodels/useMyAudienceVM";
import { useUserStore } from "../store/useUserStore";
import { useNavigate } from "react-router-dom";
import RoleSwitcher from "../components/RoleSwitcher";

export default function MyAudiencePage() {
  const { userId, provider, nickname, photoUrl, loading, signOut, deleteAccount } =
    useMyAudienceVM();

  const sName = useUserStore((s) => s.username);
  const sPhoto = useUserStore((s) => s.photoUrl);

  const displayName = sName || nickname;
  const displayPhoto = sPhoto || photoUrl || "/default-profile.svg";

  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<  //tab state
    "songs" | "books" | "artists" | "stages"
  >("songs");

  useEffect(() => {
    if (!loading && !userId) {
      navigate("/sign-in");
    }
  }, [userId, navigate, loading]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
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
    <>
      {/* 프로필 영역 */}
      <div className="flex items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <img
            src={displayPhoto}
            alt="프로필"
            className="w-full h-full object-cover"
          />
        </div>

        <span className="text-xl font-semibold">{displayName}님의 서랍장</span>

        {/* 설정 아이콘 + 드롭다운 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <FiSettings className="w-6 h-6 text-gray-500" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-44 rounded-xl border bg-white shadow-lg p-1"
            >
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  setMenuOpen(false);
                  setIsModalOpen(true);
                }}
              >
                프로필 편집
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
              >
                로그아웃
              </button>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-red-600"
                onClick={async () => {
                  setMenuOpen(false);
                  await deleteAccount();
                }}
              >
                탈퇴하기
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto">
            <RoleSwitcher align="right" label="관객"/> {/* 관객/아티스트 드롭다운 */}
        </div>
      </div>

      {/* 탭 */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <TabButton
              active={activeTab === "songs"}
              onClick={() => setActiveTab("songs")}
              label="좋아하는 곡"
            />
            <TabButton
              active={activeTab === "books"}
              onClick={() => setActiveTab("books")}
              label="좋아하는 가사집"
            />
            <TabButton
              active={activeTab === "artists"}
              onClick={() => setActiveTab("artists")}
              label="내 아티스트"
            />
            <TabButton
              active={activeTab === "stages"}
              onClick={() => setActiveTab("stages")}
              label="다녀온 무대"
            />
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="py-8 text-sm text-gray-400">
          {activeTab === "songs" && <div>(좋아하는 곡 리스트 예정)</div>}
          {activeTab === "books" && <div>(좋아하는 가사집 리스트 예정)</div>}
          {activeTab === "artists" && <div>(내 아티스트 리스트 예정)</div>}
          {activeTab === "stages" && <div>(다녀온 무대 리스트 예정)</div>}
        </div>
      </div>

      {/* 모달 */}
      <ProfileModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        provider={provider}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 transition ${
        active
          ? "text-black border-b-2 border-black"
          : "text-gray-500 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}
