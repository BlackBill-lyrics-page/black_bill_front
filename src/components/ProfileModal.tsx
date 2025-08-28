import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useProfileModalVM } from "../viewmodels/useProfileModalVM";
import { useImageCropper } from "../hooks/useImageCropper";
import { FiPlusCircle } from "react-icons/fi";
import Cropper from "react-easy-crop";

export default function ProfileModal({
  open,
  onClose,
  userId,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  provider: string;
}) {
  // 모달 전용: 포털 마운트 여부만 UI에 남김
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    open: cropOpen,
    src,
    crop,
    setCrop,
    zoom,
    setZoom,
    setCroppedAreaPixels,
    startFromFile,
    apply,
    cancel,
  } = useImageCropper();

  const {
    nickname,
    setNickname,
    password,
    setPassword,
    photoPreview,
    checkingNick,
    loading,
    errors,
    handleSubmit,
    applyCroppedPhoto,
  } = useProfileModalVM({ open, userId });

  if (!mounted || !open) return null;

  const profileModal = createPortal(
  <>
    {/* === 프로필 수정 모달 === */}
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 bg-white p-6 rounded-xl w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">프로필 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 사진 */}
        <label className="text-sm font-medium block mb-2">
          프로필 사진
        </label>
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={photoPreview || "/default-profile.svg"}
              alt="프로필 미리보기"
              className="w-24 h-24 rounded-full object-cover border"
            />
            
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 cursor-pointer"
              title="프로필 사진 업로드"
            >
              <FiPlusCircle className="w-7 h-7 text-gray-400 bg-white rounded-full border-gray-100" />
            </label>
            
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = ""; // 같은 파일 재선택 허용
                if (file) startFromFile(file);
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* 닉네임 */}
        <label className="text-sm font-medium">닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={`w-full border rounded px-3 py-2 mb-1 ${
            errors.nickname ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.nickname && (
          <p className="text-sm text-red-500 mb-3">{errors.nickname}</p>
        )}

        {/* 비밀번호 */}
        {provider !== "google" && (
          <>
            <label className="text-sm font-medium">비밀번호 변경</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded px-3 py-2 mb-1 ${
                errors.password ? "border-red-400" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500">
              8~20자, 영문/숫자/특수문자 중 2가지 이상 포함
            </p>
            {errors.password && (
              <p className="text-sm text-red-500 mb-3">{errors.password}</p>
            )}
          </>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={async () => {
              const ok = await handleSubmit();
              if (ok) onClose();
            }}
            disabled={loading || checkingNick}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  </>,
  document.body
);

// 크롭 모달
const cropModal =
  cropOpen && src
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={cancel} />
          <div
            className="relative bg-white p-4 rounded-lg w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="relative w-full h-[320px] sm:h-[420px] rounded-lg overflow-hidden">
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
              onCropComplete={(_, areaPixels) =>
                setCroppedAreaPixels(areaPixels)
              }
            />
          </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={cancel}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-500 text-white"
                onClick={async () => {
                  const result = await apply();
                  if (result)
                    applyCroppedPhoto(result.file, result.previewUrl);
                }}
              >
                적용
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

return (
  <>
    {profileModal}
    {cropModal}
  </>
);
}