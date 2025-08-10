import { useEditArtistProfileVM } from "../viewmodels/useEditArtistProfileVM";
import type { Artist } from "../viewmodels/useEditArtistProfileVM";
import { useState } from 'react';

interface ArtistProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
}

export default function ArtistProfileEditModal({
  isOpen,
  onClose,
  artist,
}: ArtistProfileEditModalProps) {
  const {
    photoUrl,
    setPhotoFile,
    name,
    setName,
    bio,
    setBio,
    label,
    setLabel,
    instruments,
    setInstruments,
    snsLinks,
    setSnsLinks,
    selectedGenres,
    setSelectedGenres,
    genres,
    handleSubmit,
  } = useEditArtistProfileVM(artist);

  const [genreError, setGenreError] = useState("");


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">아티스트 정보 수정</h2>

        {/* 프로필 사진 */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <img
            src={photoUrl || "/default-user-icon.png"}
            alt="preview"
            className="w-full h-full rounded-full object-cover border border-gray-300"
          />
          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 cursor-pointer hover:bg-gray-100"
          >
            <span className="text-xl leading-none">＋</span>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhotoFile(file);
            }}
          />
        </div>

        {/* 이름 */}
        <input
          placeholder="활동명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        {/* 설명 */}
        <textarea
          placeholder="아티스트 설명"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        {/* 소속사 */}
        <input
          placeholder="소속사"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        {/* 밴드 구성 */}
        <input
          placeholder="밴드 구성"
          value={instruments}
          onChange={(e) => setInstruments(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        {/* SNS Links */}
        {snsLinks.map((link, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select
              value={link.platform}
              onChange={(e) => {
                const updated = [...snsLinks];
                updated[idx].platform = e.target.value;
                setSnsLinks(updated);
              }}
              className="border p-1 rounded"
            >
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="soundcloud">Soundcloud</option>
              <option value="bandcamp">Bandcamp</option>
              <option value="tiktok">TikTok</option>
              <option value="x">X</option>
              <option value="spotify">Spotify</option>
              <option value="melon">Melon</option>
            </select>

            <input
              placeholder="링크 입력"
              value={link.url}
              onChange={(e) => {
                const updated = [...snsLinks];
                updated[idx].url = e.target.value;
                setSnsLinks(updated);
              }}
              className="flex-1 border p-1 rounded"
            />

            <button
              type="button"
              onClick={() => {
                const updated = snsLinks.filter((_, i) => i !== idx);
                setSnsLinks(updated);
              }}
              className="text-red-500 hover:text-red-700"
              title="삭제"
            >
              🗑️
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setSnsLinks([...snsLinks, { platform: "instagram", url: "" }])
          }
          className="text-blue-500 mb-4"
        >
          + SNS 링크 추가
        </button>

        {/* 장르 선택 */}
        <div className="mb-3">
          <label className="block font-medium mb-1">장르</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const isSelected = selectedGenres.includes(g.id);
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => {
                    if (isSelected) {
                      setGenreError("");
                      setSelectedGenres(selectedGenres.filter((id) => id !== g.id));
                    } else {
                      if (selectedGenres.length >= 3) {
                        setGenreError("장르는 최대 3개까지만 선택 가능합니다.");
                        return;
                      }
                      setGenreError("");
                      setSelectedGenres([...selectedGenres, g.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
          {genreError && (
            <p className="text-red-500 text-sm mt-2">{genreError}</p>
          )}
        </div>


        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={async () => {
              const success = await handleSubmit();
              if (success) onClose();
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
