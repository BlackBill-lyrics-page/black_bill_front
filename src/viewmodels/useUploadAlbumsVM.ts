// useUploadAlbumsVM.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadAlbumCoverPhoto } from "../utility/uploadAlbumCoverPhoto";
import { useAlbumStore } from "../store/useAlbumStore";

const MAX_SONGS = 10;
type ChangeKind = "created" | "updated" | "deleted";
type UseUploadAlbumsVMOptions = { onChanged?: (kind: ChangeKind, payload?: any) => void };

export type SongLite = {
    id: number;
    title: string | null;
    artist_id: number | null;
};

export type AlbumDetail = {
    id: number;
    artist_id: number | null;
    albumname: string | null;
    bio: string | null;
    color: string | null;
    is_public: boolean;
    url: string | null;
    photo_url: string | null;
    created_at: string | null;
};

export type AlbumForm = {
    albumname: string;
    bio: string;
    color: string | null;
    is_public: boolean;
    url: string | null;
    coverFile?: File;          // 새 커버 업로드용
    coverPreviewUrl?: string;  // 미리보기(또는 기존 커버 URL)
    selectedSongIds: number[]; // 선택 순서 = 배열 인덱스
};

type VMMode = "create" | "edit";

type ValidationErrors = Partial<{
    albumname: string;
    bio: string;
    selectedSongIds: string;
    maxSongError: string;
}>;

const emptyForm: AlbumForm = {
    albumname: "",
    bio: "",
    color: null,
    is_public: true,
    url: null,
    coverFile: undefined,
    coverPreviewUrl: undefined,
    selectedSongIds: [],
};

export function useUploadAlbumsVM(opts?: UseUploadAlbumsVMOptions) {
    const onChanged = opts?.onChanged;
    const albumStore = useAlbumStore(); // 선택: 목록 리프레시용
    const [mode, setMode] = useState<VMMode>("create");
    const [artistId, setArtistId] = useState<number | null>(null);
    const [albumId, setAlbumId] = useState<number | null>(null);

    const [form, setForm] = useState<AlbumForm>({ ...emptyForm });
    const [errors, setErrors] = useState<ValidationErrors | null>(null);

    const [songs, setSongs] = useState<SongLite[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    const [loadingDetail, setLoadingDetail] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    /** ------ 초기화 (생성 모드) ------ */
    const initCreate = useCallback(async (pArtistId: number) => {
        setMode("create");
        setArtistId(pArtistId);
        setAlbumId(null);
        setForm({ ...emptyForm });
        setErrors(null);
        // 곡 목록 로드
        setLoadingSongs(true);
        const { data, error } = await supabase
            .from("songs")
            .select("id,title,artist_id")
            .eq("artist_id", pArtistId)
            .order("created_at", { ascending: false });
        setLoadingSongs(false);
        if (!error) setSongs((data ?? []) as SongLite[]);
    }, []);

    /** ------ 초기화 (수정 모드) ------ */
    const initEdit = useCallback(async (pArtistId: number, pAlbumId: number) => {
        setMode("edit");
        setArtistId(pArtistId);
        setAlbumId(pAlbumId);
        setErrors(null);

        // 1) 앨범 본문
        setLoadingDetail(true);
        const { data: album, error: e1 } = await supabase
            .from("albums")
            .select("*")
            .eq("id", pAlbumId)
            .single();

        // 2) 곡 목록 (선택 UI)
        const { data: allSongs, error: e2 } = await supabase
            .from("songs")
            .select("id,title,artist_id")
            .eq("artist_id", pArtistId)
            .order("created_at", { ascending: false });

        // 3) album_songs (순서 로드)
        const { data: mappings, error: e3 } = await supabase
            .from("album_songs")
            .select("song_id, position")
            .eq("album_id", pAlbumId)
            .order("position", { ascending: true });

        setLoadingDetail(false);

        if (e1) {
            console.error("[initEdit] album", e1);
            return;
        }
        if (!album) return;

        setSongs((allSongs ?? []) as SongLite[]);

        const selectedIds =
            (mappings ?? [])
                .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                .map((m: any) => m.song_id) ?? [];

        setForm({
            albumname: album.albumname ?? "",
            bio: album.bio ?? "",
            color: album.color ?? null,
            is_public: album.is_public ?? true,
            url: album.url ?? null,
            coverFile: undefined,
            coverPreviewUrl: album.photo_url ?? undefined,
            selectedSongIds: selectedIds,
        });
    }, []);

    /** ------ 필드 제어 ------ */
    function setField<K extends keyof AlbumForm>(key: K, value: AlbumForm[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function pickCover(file?: File) {
        setForm((f) => ({
            ...f,
            coverFile: file,
            coverPreviewUrl: file ? URL.createObjectURL(file) : f.coverPreviewUrl,
        }));
    }

    function toggleSong(songId: number) {
        setForm((f) => {
            const exists = f.selectedSongIds.includes(songId);
            let next = exists
                ? f.selectedSongIds.filter((id) => id !== songId)
                : [...f.selectedSongIds, songId];

            const nextErrors = { ...(errors ?? {}) };
            if (!exists && next.length > MAX_SONGS) {
                nextErrors.maxSongError = `최대 ${MAX_SONGS}곡까지 선택할 수 있습니다.`;
                // 초과 선택은 무시
                return { ...f, selectedSongIds: f.selectedSongIds };
            } else {
                delete nextErrors.maxSongError;
            }
            setErrors(Object.keys(nextErrors).length ? nextErrors : null);
            return { ...f, selectedSongIds: next };
        });
    }

    function setSongOrder(orderedSongIds: number[]) {
        if (orderedSongIds.length > MAX_SONGS) {
            orderedSongIds = orderedSongIds.slice(0, MAX_SONGS);
        }
        setForm((f) => ({ ...f, selectedSongIds: orderedSongIds }));
    }

    function resetForm() {
        setForm({ ...emptyForm });
        setErrors(null);
    }

    /** ------ 검증 ------ */
    function validate(): boolean {
        const errs: ValidationErrors = {};
        if (!form.albumname.trim()) errs.albumname = "가사집 제목을 입력해주세요";
        if (!form.bio.trim()) errs.bio = "가사집 설명을 입력해주세요";
        if (!form.selectedSongIds.length) errs.selectedSongIds = "최소 한 곡을 선택해주세요";
        if (form.selectedSongIds.length > MAX_SONGS) {
            errs.maxSongError = `최대 ${MAX_SONGS}곡까지 선택할 수 있습니다.`;
        }
        setErrors(Object.keys(errs).length ? errs : null);
        return !Object.keys(errs).length;
    }

    /** ------ album_songs 교체 ------ */
    async function replaceAlbumSongs(targetAlbumId: number, songIds: number[]) {
        const slice = songIds.slice(0, MAX_SONGS);
        // RPC 우선
        const { error: rpcErr } = await supabase.rpc("replace_album_songs", {
            p_album_id: targetAlbumId,
            p_song_ids: slice,
        });
        if (rpcErr) throw rpcErr;
    }

    /** ------ 생성 ------ */
    async function submitCreate(userId: string) {
        if (!artistId) throw new Error("artistId is not set");
        if (!validate()) return;
        setSubmitting(true);
        try {
            // 1) 커버 업로드(선택) — album-images 버킷 사용
            let photo_url: string | null = null;
            if (form.coverFile) {
                photo_url = await uploadAlbumCoverPhoto(form.coverFile, userId, form.albumname);
            }

            // 2) 앨범 INSERT
            const { data: album, error: insErr } = await supabase
                .from("albums")
                .insert([
                    {
                        artist_id: artistId,
                        albumname: form.albumname,
                        bio: form.bio,
                        color: form.color,
                        is_public: form.is_public,
                        url: form.url,
                        photo_url,
                    },
                ])
                .select("*")
                .single();
            if (insErr || !album) throw insErr;

            // 3) album_songs 교체(순서/최대 10)
            await replaceAlbumSongs(album.id, form.selectedSongIds);

            // 4) 목록 리프레시(있으면)
            if (albumStore?.loadAlbums) await albumStore.loadAlbums(artistId);
            onChanged?.("created", album);


            // 5) 폼 초기화
            resetForm();
            setMode("edit");      // 생성 후 수정 모드로 전환할지 선택
            setAlbumId(album.id);
            return album as AlbumDetail;
        } finally {
            setSubmitting(false);
        }
    }

    /** ------ 수정 ------ */
    async function submitUpdate(userId: string) {
        if (!artistId || !albumId) throw new Error("artistId/albumId is not set");
        if (!validate()) return;
        setSubmitting(true);
        try {
            // 1) 커버 업로드(선택)
            let photo_url = form.coverPreviewUrl ?? null; // 기존 URL 유지
            if (form.coverFile) {
                const uploaded = await uploadAlbumCoverPhoto(form.coverFile, userId, form.albumname);
                if (uploaded) photo_url = uploaded;
            }

            // 2) 앨범 UPDATE
            const { data: updated, error: upErr } = await supabase
                .from("albums")
                .update({
                    albumname: form.albumname,
                    bio: form.bio,
                    color: form.color,
                    is_public: form.is_public,
                    url: form.url,
                    photo_url,
                })
                .eq("id", albumId)
                .select("*")
                .single();
            if (upErr || !updated) throw upErr;

            // 3) album_songs 교체
            await replaceAlbumSongs(albumId, form.selectedSongIds);

            // 4) 목록 리프레시(있으면)
            if (albumStore?.loadAlbums) await albumStore.loadAlbums(artistId);
            onChanged?.("updated", updated);

            return updated as AlbumDetail;
        } finally {
            setSubmitting(false);
        }
    }

    /** ------ 삭제 ------ */
    // useUploadAlbumsVM.ts 내에 넣을 removeAlbum() 전체 구현
    async function removeAlbum() {
        if (!artistId || !albumId) throw new Error("artistId/albumId is not set");

        const ok = confirm(
            "정말 가사집을 삭제하시겠어요?\n삭제하시면, 연동되어 있던 무대 정보들도 전부 사라집니다.\n이 작업은 되돌릴 수 없습니다."
        );
        if (!ok) return;

        setSubmitting(true);
        try {
            // 1) 이 앨범에 연결된 공연(stage_info) id들 조회
            const { data: stageRows, error: stageIdsErr } = await supabase
                .from("stage_info")
                .select("id")
                .eq("album_id", albumId);

            if (stageIdsErr) throw stageIdsErr;
            const stageIds = (stageRows ?? []).map((r: { id: number }) => r.id);

            // 2) 공연 댓글(stage_comments) 먼저 삭제 (참조 FK 때문에 선삭제 필요)
            if (stageIds.length > 0) {
                const { error: delCommentsErr } = await supabase
                    .from("stage_comments")
                    .delete()
                    .in("stage_id", stageIds);
                if (delCommentsErr) throw delCommentsErr;
            }

            // 3) 공연(stage_info) 삭제
            if (stageIds.length > 0) {
                const { error: delStagesErr } = await supabase
                    .from("stage_info")
                    .delete()
                    .in("id", stageIds);
                if (delStagesErr) throw delStagesErr;
            }

            // 4) 앨범-곡 매핑(album_songs) 삭제
            {
                const { error: delMappingsErr } = await supabase
                    .from("album_songs")
                    .delete()
                    .eq("album_id", albumId);
                if (delMappingsErr) throw delMappingsErr;
            }

            // 5) 최종 앨범(albums) 삭제
            {
                const { error: delAlbumErr } = await supabase
                    .from("albums")
                    .delete()
                    .eq("id", albumId);
                if (delAlbumErr) throw delAlbumErr;
            }

            // 6) 목록 새로고침 및 폼 리셋
            if (albumStore?.loadAlbums) await albumStore.loadAlbums(artistId);
            onChanged?.("deleted", { id: albumId });
            setAlbumId(null);
            setMode("create");
            resetForm();
            return true;
        } catch (e: any) {
            // 친화적인 에러 처리
            if (e?.code === "42501") {
                alert("삭제 권한이 없어요. (RLS/정책을 확인해 주세요)");
            } else if (e?.code === "23503" || e?.code === "23502") {
                alert("연동된 데이터 제약으로 삭제가 막혔습니다. 무대/댓글/매핑 삭제 권한을 확인하세요.");
            } else {
                console.error(e);
                alert(`삭제 중 오류가 발생했습니다.${e?.message ? "\n" + e.message : ""}`);
            }
            return false;
        } finally {
            setSubmitting(false);
        }
    }



    /** ------ 곡 검색/필터 (옵션) ------ */
    const [query, setQuery] = useState("");
    const filteredSongs = useMemo(() => {
        if (!query.trim()) return songs;
        const q = query.toLowerCase();
        return songs.filter((s) => (s.title ?? "").toLowerCase().includes(q));
    }, [songs, query]);
    // 1) 이미지 제거 액션
    function clearCover() {
        setForm((f) => ({ ...f, coverFile: undefined, coverPreviewUrl: undefined }));
    }

    // 2) ObjectURL 정리 (선택 권장)
    useEffect(() => {
        return () => {
            if (form.coverPreviewUrl?.startsWith("blob:")) {
                try { URL.revokeObjectURL(form.coverPreviewUrl); } catch { }
            }
        };
    }, [form.coverPreviewUrl]);
    return {
        // 모드/식별자
        mode,
        artistId,
        albumId,

        // 폼/에러/상태
        form,
        errors,
        songs: filteredSongs,
        rawSongs: songs,
        query,
        setQuery,
        loadingSongs,
        loadingDetail,
        submitting,

        // 초기화
        initCreate,
        initEdit,

        // 폼 제어
        setField,
        pickCover,
        toggleSong,
        setSongOrder,
        resetForm,
        clearCover,

        // 액션
        submitCreate,
        submitUpdate,
        removeAlbum,
    };
}
