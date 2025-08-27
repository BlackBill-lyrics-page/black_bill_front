// components/uploadAndEditSongsModal.tsx
import type { FormEvent } from "react";
import { FiTrash } from "react-icons/fi";
import { useUploadSongsVM } from "../viewmodels/useUploadSongsVM";
import type { Songs as VmSong } from "../viewmodels/useUploadSongsVM";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: VmSong | null;
  onChanged?: (kind: "created" | "updated" | "deleted", payload?: any) => void;
};

const MAX_DESC = 500;
const MAX_LYRICS = 1000;

export default function UploadAndEditSongsModal({
  isOpen,
  onClose,
  initialSong = null,
  onChanged,
}: Props) {
  const {
    title, setTitle,
    lyrics, setLyrics,
    bio, setBio,

    songPhoto,
    setSongPhoto,
    setSongPhotoFile,

    links,
    addLink,
    updateLink,
    removeLink,

    loading,
    handleSubmit,
  } = useUploadSongsVM(initialSong ?? null, {
  watchKey: isOpen,              // 기존 동기화 유지
  onChanged, // 부모로 릴레이
});

  if (!isOpen) return null;
  const isEdit = !!initialSong?.id;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmit();
    if (ok) onClose();
  };

  const onPickImage = (file: File | null) => {
    setSongPhotoFile(file);
    if (!file) {
      setSongPhoto(initialSong?.song_photo ?? "");
      return;
    }
    const url = URL.createObjectURL(file);
    setSongPhoto(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[min(600px,96vw)] max-h-[94vh] overflow-y-auto rounded-2xl bg-white shadow-2xl px-4 pb-5 sm:px-6 sm:pb-6">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur px-1 py-4 sm:px-0">
          <h3 className="text-lg font-semibold sm:text-xl">
            {isEdit ? "곡 수정하기" : "곡 추가하기"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100"
            disabled={loading}
            aria-label="닫기"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6">
          {/* 가사집 이미지 */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-800 sm:text-sm">가사집 이미지</p>
            <label className="flex h-28 w-28 cursor-pointer items-center justify-center rounded-xl bg-gray-100 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 sm:h-32 sm:w-32">
              {songPhoto || initialSong?.song_photo ? (
                <img
                  src={songPhoto || (initialSong?.song_photo as string)}
                  alt="cover preview"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
            </label>
          </div>

          {/* 곡 제목 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">곡 제목</label>
            <input
              className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900 sm:text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="가사집 제목 입력"
              required
            />
          </div>

          {/* 곡 설명 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-800">곡 설명</label>
              <span className="text-xs text-gray-400">{`${bio?.length ?? 0}/${MAX_DESC}`}</span>
            </div>
            <textarea
              className="w-full min-h-[92px] rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900 sm:min-h-[110px] sm:text-base"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_DESC))}
              placeholder="곡 설명 입력"
              maxLength={MAX_DESC}
              required
            />
          </div>

          {/* 곡 가사 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-800">곡 가사</label>
              <span className="text-xs text-gray-400">{`${lyrics?.length ?? 0}/${MAX_LYRICS}`}</span>
            </div>
            <textarea
              className="w-full min-h-[180px] rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900 sm:min-h-[220px] sm:text-base"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value.slice(0, MAX_LYRICS))}
              placeholder="가사 입력"
              maxLength={MAX_LYRICS}
              required
            />
          </div>

          {/* 음원 링크 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-800">음원 링크</label>
              <button
                type="button"
                onClick={addLink}
                className="rounded-2xl border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
                disabled={loading}
              >
                + 링크 추가
              </button>
            </div>

            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* 플랫폼 선택 */}
                <select
                  value={l.platform}
                  onChange={(e) => updateLink(i, { platform: e.target.value })}
                  disabled={loading}
                  className="bg-gray-100 px-3 py-2 rounded-2xl text-sm ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="youtubemusic">YT Music</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="bandcamp">Bandcamp</option>
                  <option value="tiktok">TikTok</option>
                  <option value="x">X</option>
                  <option value="spotify">Spotify</option>
                  <option value="melon">Melon</option>
                </select>

                {/* URL 입력 */}
                <input
                  type="url"
                  placeholder="링크 입력"
                  value={l.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-2xl bg-gray-100 text-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900"
                />

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  disabled={loading}
                  title="삭제"
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash className="w-7 h-7 p-1 bg-white rounded-full border border-gray-200" />
                </button>
              </div>
            ))}
          </div>

          {/* 하단 버튼 */}
          <div className="pt-1 sm:pt-2">
            <button
              type="submit"
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold ${
                loading ? "bg-gray-200 text-gray-400" : "bg-gray-900 text-white hover:bg-black"
              } disabled:opacity-60 sm:text-base sm:py-3.5`}
              disabled={loading}
            >
              {loading ? "저장 중..." : isEdit ? "수정하기" : "추가하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
