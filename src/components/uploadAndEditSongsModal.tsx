// components/uploadAndEditSongsModal.tsx
import type { FormEvent } from "react";
import { useUploadSongsVM } from "../viewmodels/useUploadSongsVM";
import type { Songs as VmSong } from "../viewmodels/useUploadSongsVM";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: VmSong | null; // 수정 모드일 때만 넘겨줌
};

export default function UploadSongsModal({ isOpen, onClose, initialSong = null }: Props) {
  const {
    title, setTitle,
    lyrics, setLyrics,
    bio, setBio,

    songLink, setSongLink,

    songPhoto,
    setSongPhoto,
    songPhotoFile,
    setSongPhotoFile,

    links,
    addLink,
    updateLink,
    removeLink,

    loading,
    handleSubmit,
    // deleteCurrentSong, // 필요 시 노출
    // 🔧 Changed: VM 호출 시 watchKey로 isOpen 전달 → 열릴 때마다 동기화 보장
  } = useUploadSongsVM(initialSong ?? null, { watchKey: isOpen }); // ✅ Added

  if (!isOpen) return null;
  const isEdit = !!initialSong?.id;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmit();
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[min(640px,95vw)] rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isEdit ? "곡 정보 수정" : "새 곡 업로드"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            닫기
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 곡 제목 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">곡 제목</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex) 새벽 두 시"
              required
            />
          </div>

          {/* 가사 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">가사</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="가사를 입력하세요"
              required
            />
          </div>

          {/* 곡 설명 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">곡 설명</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="곡 소개/에피소드"
              required
            />
          </div>

          {/* 곡 사진 업로드 + 미리보기 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">곡 사진 (커버/썸네일)</label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                {songPhoto ? (
                  <img
                    src={songPhoto}
                    alt="song preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    미리보기
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setSongPhotoFile(f);
                    // 🔧 Changed: 파일이 해제되면 기존 initialSong 사진 유지하도록 보정
                    if (!f) setSongPhoto(initialSong?.song_photo ?? "");
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-black"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPG/PNG 등 이미지 파일. 선택 시 즉시 미리보기가 표시됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 음원 링크 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">음원 링크</label>
              <button
                type="button"
                onClick={addLink}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
                disabled={loading}
              >
                + 링크 추가
              </button>
            </div>

            <div className="space-y-2">
              {links.map((l, i) => (
                <div
                  key={i}
                  className="flex gap-2 rounded-md border border-gray-200 p-2"
                >
                  <select
                    className="w-36 rounded-md border border-gray-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                    value={l.platform}
                    onChange={(e) => updateLink(i, { platform: e.target.value })}
                    disabled={loading}
                  >
                    <option>YouTube</option>
                    <option>YouTube Music</option>
                    <option>Spotify</option>
                    <option>SoundCloud</option>
                    <option>Apple Music</option>
                    <option>Melon</option>
                    <option>Bugs</option>
                    <option>Genie</option>
                    <option>Link</option>
                  </select>

                  <input
                    className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                    type="url"
                    placeholder="https://..."
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="rounded-md border border-gray-200 px-2.5 py-2 text-xs hover:bg-gray-50"
                    disabled={loading}
                    aria-label="링크 삭제"
                    title="링크 삭제"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm text-white ${loading ? "bg-gray-700" : "bg-gray-900 hover:bg-black"
                } disabled:opacity-60`}
              disabled={loading}
            >
              {loading ? "저장 중..." : isEdit ? "수정하기" : "업로드"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
