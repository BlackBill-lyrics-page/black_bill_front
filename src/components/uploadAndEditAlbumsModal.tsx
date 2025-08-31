// uploadAndEditAlbumsModal.tsx — 둥근 모달 + 빈 이미지 프리뷰 시안 적용
import React, { useEffect, useMemo, useRef } from "react";
import { useUploadAlbumsVM } from "../viewmodels/useUploadAlbumsVM";
import { FiSearch, FiX } from "react-icons/fi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  artistId?: number;
  albumId?: number;
  userId: string;
  onChanged?: (kind: "created" | "updated" | "deleted", payload?: any) => void;
};

export default function UploadAndEditAlbumsModal({
  isOpen,
  onClose,
  artistId,
  albumId,
  userId,
  onChanged,
}: Props) {
  const vm = useUploadAlbumsVM({
    onChanged, // 부모(MyArtistPage)로 릴레이
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (albumId && artistId != null) vm.initEdit(artistId, albumId);
    else if (artistId != null) vm.initCreate(artistId);
  }, [isOpen, artistId, albumId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (vm.mode === "edit") await vm.submitUpdate(userId);
      else await vm.submitCreate(userId);
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  const selectedSet = useMemo(
    () => new Set(vm.form.selectedSongIds),
    [vm.form.selectedSongIds]
  );
  const orderNo: Record<number, number> = useMemo(() => {
    const m: Record<number, number> = {};
    vm.form.selectedSongIds.forEach((id, i) => (m[id] = i + 1));
    return m;
  }, [vm.form.selectedSongIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-center">
      {/* === 모달 컨테이너: 둥근 카드 느낌 (rounded-[28px]) === */}
      <div
        className="
          mx-3 my-3 sm:my-6
          w-full sm:max-w-md
          h-[100svh] sm:h-[90vh]
          /* CHANGE: 컨테이너가 스크롤을 담당 */
          overflow-y-auto
          /* CHANGE: 세로 방향 레이아웃 및 자식 스크롤 여유 */
          flex flex-col min-h-0
          rounded-[28px] border border-gray-200
          bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        "
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              {vm.mode === "edit" ? "가사집 수정하기" : "가사집 추가하기"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-50"
              aria-label="닫기"
              title="닫기"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        {/* CHANGE: 폼 자체의 overflow 제거 + 아래 여백 추가로 푸터 겹침 방지 */}
        <form
          id="albumForm"
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-7 pb-28"
        >
          {/* 가사집 이미지 */}
          <section>
            <p className="text-sm font-medium mb-2">가사집 이미지</p>

            {vm.form.coverPreviewUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={vm.form.coverPreviewUrl}
                  alt="cover preview"
                  className="h-28 w-28 rounded-2xl object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => vm.clearCover?.()}
                  className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-50 text-red-600"
                >
                  이미지 제거
                </button>
              </div>
            ) : (
              // === 빈 이미지 UI (시안 스타일)
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  h-28 w-28 rounded-2xl
                  bg-gray-100/80 border border-gray-200
                  shadow-inner flex items-center justify-center
                "
                aria-label="이미지 선택"
                title="이미지 선택"
              >
                {/* 심플한 조리개 아이콘 */}
                <svg viewBox="0 0 24 24" className="w-9 h-9 text-gray-400">
                  <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 5l3 5-6 0 3-5Zm4.5 2.2l1.8 5.5-5.2-1.7 3.4-3.8Zm-9 0 3.4 3.8-5.2 1.7 1.8-5.5Zm-1.5 7.3l5.6-.1-2.6 4.8-3-4.7Zm12 0-3 4.7-2.6-4.8 5.6.1Z" fill="currentColor" opacity=".35" />
                </svg>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                vm.pickCover(file);
                e.currentTarget.value = "";
              }}
            />
            {vm.form.coverFile?.name && (
              <div className="mt-2 text-xs text-gray-500 truncate max-w-[240px]">
                {vm.form.coverFile.name}
              </div>
            )}
          </section>

          {/* 가사집 제목 */}
          <section>
            <p className="text-sm font-medium mb-2">가사집 제목</p>
            <input
              type="text"
              value={vm.form.albumname}
              onChange={(e) => vm.setField("albumname", e.target.value)}
              placeholder="가사집 제목 입력"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            {vm.errors?.albumname && (
              <p className="mt-1 text-xs text-red-600">{vm.errors.albumname}</p>
            )}
          </section>

          {/* 가사집 설명 */}
          <section>
            <p className="text-sm font-medium mb-2">가사집 설명</p>
            <textarea
              value={vm.form.bio ?? ""}
              onChange={(e) => vm.setField("bio", e.target.value)}
              placeholder="안녕하세요, 저는 안재홍입니다. 끊임없이 흘러나오는 삶의 이야기들을 기록하고 노래합니다."
              className="w-full h-28 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            {vm.errors?.bio && <p className="mt-1 text-xs text-red-600">{vm.errors.bio}</p>}
          </section>

          {/* 곡 구성 */}
          <section>
            <p className="text-sm font-medium mb-1">곡 구성</p>
            <p className="text-xs text-gray-500 mb-2">가사집을 구성할 곡을 순서대로 선택해주세요.</p>

            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={vm.query}
                onChange={(e) => vm.setQuery(e.target.value)}
                placeholder="곡 검색"
                className="w-full pl-9 pr-10 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              {vm.query && (
                <button
                  type="button"
                  onClick={() => vm.setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100"
                  aria-label="검색어 지우기"
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-2 text-xs font-medium text-gray-600">
                곡 목록
              </div>
              {vm.loadingSongs ? (
                <div className="p-4 text-sm text-gray-500">불러오는 중…</div>
              ) : vm.songs.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">곡이 없습니다.</div>
              ) : (
                <ul className="max-h-80 overflow-auto divide-y">
                  {vm.songs.map((s) => {
                    const isChecked = selectedSet.has(s.id);
                    const badge = orderNo[s.id];
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => vm.toggleSong(s.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                            isChecked ? "bg-white" : ""
                          }`}
                        >
                          <div
                            className={`w-7 shrink-0 text-center text-xs font-semibold ${
                              isChecked ? "text-gray-900" : "text-gray-300"
                            }`}
                          >
                            {isChecked ? badge : ""}
                          </div>
                          <span className={`text-sm ${isChecked ? "text-gray-900" : "text-gray-600"}`}>
                            {s.title ?? "(무제)"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-2 space-y-1">
              {vm.errors?.selectedSongIds && (
                <p className="text-xs text-red-600">{vm.errors.selectedSongIds}</p>
              )}
              {vm.errors?.maxSongError && (
                <p className="text-xs text-red-600">{vm.errors.maxSongError}</p>
              )}
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t px-6 py-4">
          <div className="flex gap-2 w-full">
            {/* 삭제 버튼 */}
            {vm.mode === "edit" ? (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("가사집을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
                  try {
                    await vm.removeAlbum();
                    onClose();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 basis-1/2 px-4 py-3 sm:py-2 text-sm rounded-xl border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                disabled={vm.submitting}
              >
                가사집 삭제
              </button>
            ) : (
              // 편집 모드가 아닐 때 균형 유지를 위한 placeholder
              <div className="flex-1 basis-1/2" />
            )}
        
            {/* 저장/다음 버튼 */}
            <button
              type="submit"
              form="albumForm"
              className="flex-1 basis-1/2 px-4 py-3 sm:py-2 text-sm rounded-xl bg-gray-900 text-white hover:opacity-90 disabled:opacity-50"
              disabled={vm.submitting || vm.loadingDetail}
            >
              {vm.mode === "edit" ? "변경사항 저장" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
