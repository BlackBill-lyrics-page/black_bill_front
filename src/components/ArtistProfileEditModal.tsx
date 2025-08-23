import { useEditArtistProfileVM } from "../viewmodels/useEditArtistProfileVM";
import type { Artist } from "../viewmodels/useEditArtistProfileVM";
import { useState } from "react";
import { useImageCropper } from "../hooks/useImageCropper";
import Cropper from "react-easy-crop";
import { FiPlusCircle, FiTrash } from "react-icons/fi";

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
    genres, // [{id, name}]
    handleSubmit,
    applyCroppedPhoto,
  } = useEditArtistProfileVM(artist);

  const [genreError, setGenreError] = useState("");

  const {
    open: cropOpen,
    src,
    crop,
    setCrop,
    zoom,
    setZoom,
    setCroppedAreaPixels,
    startFromFile,
    apply: applyCrop,
    cancel: cancelCrop,
  } = useImageCropper();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center overflow-y-auto">
      {/* 카드 */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold">아티스트 정보 수정</h1>

        {/* 프로필 사진 */}
        <div className="flex items-center justify-between mt-10">
          <div className="font-bold">아티스트 프로필 사진</div>
          <div className="text-blue-700">필수</div>
        </div>
        <div className="relative w-32 h-32 mx-auto mb-4 mt-5">
          <img
            src={photoUrl || "/default-profile.svg"}
            alt="artist profile"
            className="w-full h-full rounded-full bg-gray-100 object-contain"
          />
          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 cursor-pointer"
            title="프로필 사진 업로드"
          >
            <FiPlusCircle className="w-7 h-7 text-gray-400 bg-white rounded-full border-gray-100" />
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) startFromFile(file);
            }}
          />
        </div>

        {/* 활동명 */}
        <div className="flex justify-between mb-2 mt-10">
          <div className="font-bold">활동명</div>
          <div className="text-blue-700">필수</div>
        </div>
        <input
          placeholder="활동명 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-100 p-2 mb-3 rounded-full px-5"
        />

        {/* 소속사 */}
        <div className="flex justify-between mb-2 mt-2">
          <div className="font-bold">소속사</div>
          <div
            className={(label ?? "").length > 30 ? "text-red-500" : "text-gray-500"}
          >
            {(label ?? "").length}/30
          </div>
        </div>
        <input
          placeholder="소속사"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full bg-gray-100 p-2 mb-3 rounded-full px-5"
        />

        {/* 아티스트 설명 */}
        <div className="flex justify-between mb-2 mt-2">
          <div className="font-bold">아티스트 설명</div>
          <div
            className={(bio ?? "").length > 500 ? "text-red-500" : "text-gray-500"}
          >
            {(bio ?? "").length}/500
          </div>
        </div>
        <textarea
          placeholder="아티스트 설명"
          value={bio}
          rows={4}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-gray-100 p-2 mb-3 rounded-2xl px-5"
        />

        {/* 밴드 구성 */}
        <div className="flex justify-between mb-2 mt-2">
          <div className="font-bold">구성</div>
          <div
            className={(instruments ?? "").length > 30 ? "text-red-500" : "text-gray-500"}
          >
            {(instruments ?? "").length}/30
          </div>
        </div>
        <input
          placeholder="밴드 구성"
          value={instruments}
          onChange={(e) => setInstruments(e.target.value)}
          className="w-full bg-gray-100 p-2 mb-3 rounded-full px-5"
        />

        {/* SNS Links */}
        <div className="flex justify-between mt-2">
          <div className="font-bold">sns 링크</div>
          <button
            type="button"
            onClick={() =>
              setSnsLinks([...snsLinks, { platform: "instagram", url: "" }])
            }
            className="text-blue-500"
          >
            링크 추가하기 +
          </button>
        </div>

        {snsLinks.map((link, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <select
              value={link.platform}
              onChange={(e) => {
                const updated = [...snsLinks];
                updated[idx].platform = e.target.value;
                setSnsLinks(updated);
              }}
              className="bg-gray-100 p-1 rounded-2xl w-28"
            >
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="youtubemusic">YT Music</option>
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
              className="flex-1 p-1 pl-4 rounded-2xl bg-gray-100"
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
              <FiTrash className="w-7 h-7 p-1 text-gray-400 bg-white rounded-full border-gray-100" />
            </button>
          </div>
        ))}

        {/* 장르 선택 */}
        <div className="mb-3 mt-8">
          <div className="flex justify-between">
            <label className="block font-bold mb-1">장르 (최대 3개)</label>
            <div className="text-blue-700">필수</div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {genres.map((g) => {
              const isSelected = selectedGenres.includes(g.id);
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => {
                    if (isSelected) {
                      setGenreError("");
                      setSelectedGenres(
                        selectedGenres.filter((id) => id !== g.id)
                      );
                    } else {
                      if (selectedGenres.length >= 3) {
                        setGenreError("장르는 최대 3개까지 선택 가능합니다.");
                        return;
                      }
                      setGenreError("");
                      setSelectedGenres([...selectedGenres, g.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full ${
                    isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-700"
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
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            취소
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={async () => {
              const ok = await handleSubmit();
              if (ok) onClose();
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 크롭 모달 */}
      {cropOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="bg-white w-full max-w-xl rounded-xl overflow-hidden">
            <div className="relative w-full h-[60vh] sm:h-[55vh]">
              {src && (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  minZoom={0.5}
                  maxZoom={3}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-40"
                aria-label="zoom"
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-full bg-gray-100" onClick={cancelCrop}>
                  취소
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-gray-100"
                  onClick={async () => {
                    const result = await applyCrop();
                    if (result) {
                      applyCroppedPhoto(result.file, result.previewUrl);
                    }
                  }}
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
