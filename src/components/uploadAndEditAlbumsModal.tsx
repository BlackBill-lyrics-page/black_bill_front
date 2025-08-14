// uploadAndEditAlbumsModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useUploadAlbumsVM } from "../viewmodels/useUploadAlbumsVM";


type Props = {
    isOpen: boolean;
    onClose: () => void;

    /** 생성 모드일 때 필요 */
    artistId?: number;

    /** 수정 모드일 때 필요 */
    albumId?: number;

    /** 업로더 식별자 (auth.user().id 등) */
    userId: string;
};

export default function UploadAndEditAlbumsModal({
    isOpen,
    onClose,
    artistId,
    albumId,
    userId,
}: Props) {
    const vm = useUploadAlbumsVM();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 모달 열릴 때 초기화
    useEffect(() => {
        if (!isOpen) return;
        if (albumId && artistId != null) {
            vm.initEdit(artistId, albumId);
        } else if (artistId != null) {
            vm.initCreate(artistId);
        }
    }, [isOpen, artistId, albumId]);

    // 제출 핸들러
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (vm.mode === "edit") {
                await vm.submitUpdate(userId);
            } else {
                await vm.submitCreate(userId);
            }
            onClose();
        } catch (err) {
            console.error(err);
            // 필요 시 토스트 처리
        }
    }

    // 삭제
    async function handleDelete() {
        if (!confirm("가사집을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
        try {
            await vm.removeAlbum();
            onClose();
        } catch (err) {
            console.error(err);
        }
    }

    // 순서 변경(간단: 위/아래 버튼)
    function moveSelectedSong(songId: number, dir: "up" | "down") {
        const arr = [...vm.form.selectedSongIds];
        const idx = arr.indexOf(songId);
        if (idx < 0) return;
        const swapWith = dir === "up" ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= arr.length) return;
        [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
        vm.setSongOrder(arr);
    }

    // 선택된 곡 빠른 조회용 Set
    const selectedSet = useMemo(
        () => new Set(vm.form.selectedSongIds),
        [vm.form.selectedSongIds]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-lg">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {vm.mode === "edit" ? "가사집 수정" : "가사집 추가"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                        닫기
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* 왼쪽: 기본 정보 */}
                    <div className="space-y-4">
                        {/* 커버 업로드 & 미리보기 (버튼 방식) */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">가사집 커버 이미지 (선택)</label>

                            {vm.form.coverPreviewUrl && (
                                <div className="mb-2 flex items-center gap-2">
                                    <img
                                        src={vm.form.coverPreviewUrl}
                                        alt="cover preview"
                                        className="h-40 w-40 rounded-md object-cover border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => vm.clearCover?.()}
                                        className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                    >
                                        이미지 제거
                                    </button>
                                </div>
                            )}

                            {/* 숨겨진 실제 파일 입력 */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.currentTarget.files?.[0];
                                    vm.pickCover(file);
                                    // 같은 파일을 연속 선택해도 onChange가 다시 뜨도록 초기화
                                    e.currentTarget.value = "";
                                }}
                            />

                            {/* 보이는 버튼들 */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                                    disabled={vm.submitting}
                                >
                                    이미지 선택
                                </button>

                                {/* 선택된 파일명 표시 (새 파일 선택 시) */}
                                {vm.form.coverFile?.name && (
                                    <span className="text-xs text-gray-600 truncate max-w-[200px]">
                                        {vm.form.coverFile.name}
                                    </span>
                                )}
                            </div>
                        </div>



                        {/* 제목 */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">가사집 제목</label>
                            <input
                                type="text"
                                value={vm.form.albumname}
                                onChange={(e) => vm.setField("albumname", e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
                                placeholder="예: 여름 라이브 셋리스트"
                            />
                            {vm.errors?.albumname && (
                                <p className="mt-1 text-xs text-red-600">{vm.errors.albumname}</p>
                            )}
                        </div>

                        {/* 설명 */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">가사집 설명</label>
                            <textarea
                                value={vm.form.bio}
                                onChange={(e) => vm.setField("bio", e.target.value)}
                                className="h-24 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
                                placeholder="가사집에 대한 설명을 입력하세요"
                            />
                            {vm.errors?.bio && (
                                <p className="mt-1 text-xs text-red-600">{vm.errors.bio}</p>
                            )}
                        </div>

                        {/* 색상 / 공개여부 / URL */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium">가사집 색상</label>
                                <input
                                    type="color"
                                    value={vm.form.color ?? "#000000"}
                                    onChange={(e) => vm.setField("color", e.target.value)}
                                    className="h-10 w-full cursor-pointer rounded border"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="mr-2 text-sm">공개</label>
                                <input
                                    type="checkbox"
                                    checked={vm.form.is_public}
                                    onChange={(e) => vm.setField("is_public", e.target.checked)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">외부 URL (선택)</label>
                            <input
                                type="url"
                                value={vm.form.url ?? ""}
                                onChange={(e) => vm.setField("url", e.target.value || null)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    {/* 오른쪽: 곡 선택 & 순서 */}
                    <div className="space-y-4">
                        {/* 검색 */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">곡 검색</label>
                            <input
                                type="text"
                                value={vm.query}
                                onChange={(e) => vm.setQuery(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
                                placeholder="제목으로 검색"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 전체 곡 목록 */}
                            <div className="max-h-64 overflow-auto rounded-md border">
                                <div className="sticky top-0 border-b bg-gray-50 px-2 py-1 text-xs font-medium">
                                    곡 목록
                                </div>
                                {vm.loadingSongs ? (
                                    <div className="p-3 text-sm text-gray-500">불러오는 중…</div>
                                ) : vm.songs.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500">곡이 없습니다.</div>
                                ) : (
                                    <ul className="divide-y">
                                        {vm.songs.map((s) => {
                                            const checked = selectedSet.has(s.id);
                                            return (
                                                <li
                                                    key={s.id}
                                                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => vm.toggleSong(s.id)}
                                                    />
                                                    <span className="text-sm">
                                                        {s.title ?? "(무제)"}{" "}
                                                        {checked && (
                                                            <em className="ml-1 text-xs text-gray-500">
                                                                #{vm.form.selectedSongIds.indexOf(s.id) + 1}
                                                            </em>
                                                        )}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* 선택된 곡(순서) */}
                            <div className="max-h-64 overflow-auto rounded-md border">
                                <div className="sticky top-0 border-b bg-gray-50 px-2 py-1 text-xs font-medium">
                                    선택된 곡 (순서)
                                </div>
                                {vm.form.selectedSongIds.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500">선택된 곡이 없습니다.</div>
                                ) : (
                                    <ul className="divide-y">
                                        {vm.form.selectedSongIds.map((id, idx) => {
                                            const s = vm.rawSongs.find((x) => x.id === id);
                                            return (
                                                <li
                                                    key={id}
                                                    className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 text-center text-xs font-semibold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm">{s?.title ?? "(무제)"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSelectedSong(id, "up")}
                                                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                                            disabled={idx === 0}
                                                            title="위로"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSelectedSong(id, "down")}
                                                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                                            disabled={idx === vm.form.selectedSongIds.length - 1}
                                                            title="아래로"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => vm.toggleSong(id)}
                                                            className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                            title="선택 해제"
                                                        >
                                                            제거
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* 오류 메시지 */}
                        <div>
                            {vm.errors?.selectedSongIds && (
                                <p className="text-xs text-red-600">{vm.errors.selectedSongIds}</p>
                            )}
                            {vm.errors?.maxSongError && (
                                <p className="text-xs text-red-600">{vm.errors.maxSongError}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between border-t pt-4">
                        {vm.mode === "edit" ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                disabled={vm.submitting}
                            >
                                가사집 삭제
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                                disabled={vm.submitting}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                                disabled={vm.submitting || vm.loadingDetail}
                            >
                                {vm.mode === "edit" ? "변경사항 저장" : "가사집 생성"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
