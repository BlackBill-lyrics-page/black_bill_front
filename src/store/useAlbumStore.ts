// useAlbumStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../lib/supabaseClient";

/** ===== 타입 정의 ===== */
export type Album = {
  id: number;
  artist_id: number | null;
  albumname: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string | null;
  is_public: boolean;
  url: string | null;
  color: string | null;            // ✅ DB 컬럼 반영
};

export type Song = {
  id: number;
  title: string | null;
  artist_id: number | null;
};

type AlbumForm = {
  albumname: string;
  bio: string;
  color: string | null;            // ✅ 폼에서도 DB로 저장
  is_public: boolean;
  url?: string | null;

  coverFile?: File;
  coverPreviewUrl?: string;

  selectedSongIds: number[];       // 선택 순서 = 배열 인덱스
};

type ValidationErrors = Partial<{
  albumname: string;
  bio: string;
  selectedSongIds: string;
  maxSongError: string;
}>;

const MAX_SONGS_PER_ALBUM = 10;

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

interface AlbumState {
  albums: Album[];
  currentAlbum: Album | null;
  form: AlbumForm;

  loading: boolean;
  submitting: boolean;
  errors: ValidationErrors | null;

  loadAlbums: (artistId: number) => Promise<void>;
  loadAlbumDetail: (albumId: number) => Promise<void>;

  setField: <K extends keyof AlbumForm>(key: K, value: AlbumForm[K]) => void;
  pickCover: (file?: File) => void;
  toggleSong: (songId: number) => void;
  setSongOrder: (orderedSongIds: number[]) => void;
  clearForm: () => void;

  createAlbum: (artistId: number) => Promise<void>;
  updateAlbum: (albumId: number) => Promise<void>;
  deleteAlbum: (albumId: number) => Promise<void>;

  listSongsByArtist: (artistId: number) => Promise<Song[]>;

  validate: () => boolean;
  uploadCover: (file: File, artistId: number, albumname: string) => Promise<string | null>;
  replaceAlbumSongs: (albumId: number, songIds: number[]) => Promise<void>;
}

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set, get) => ({
      albums: [],
      currentAlbum: null,
      form: { ...emptyForm },
      loading: false,
      submitting: false,
      errors: null,

      /** 목록 */
      loadAlbums: async (artistId) => {
        set({ loading: true });
        const { data, error } = await supabase
          .from("albums")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[loadAlbums]", error);
        } else {
          set({ albums: (data ?? []) as Album[] });
        }
        set({ loading: false });
      },

      /** 디테일(수정 모드) */
      loadAlbumDetail: async (albumId) => {
        set({ loading: true, errors: null, currentAlbum: null, form: { ...emptyForm } });

        // 1) 앨범
        const { data: album, error: e1 } = await supabase
          .from("albums")
          .select("*")
          .eq("id", albumId)
          .single();

        if (e1 || !album) {
          console.error("[loadAlbumDetail] album", e1);
          set({ loading: false });
          return;
        }

        // 2) 곡 매핑 (position 오름차순)
        const { data: mappings, error: e2 } = await supabase
          .from("album_songs")
          .select("song_id, position, songs(id, title, artist_id)")
          .eq("album_id", albumId)
          .order("position", { ascending: true });

        if (e2) {
          console.error("[loadAlbumDetail] album_songs", e2);
        }

        const selectedIds =
          (mappings ?? [])
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
            .map((m: any) => m.song_id) ?? [];

        set({
          currentAlbum: album as Album,
          form: {
            albumname: album.albumname ?? "",
            bio: album.bio ?? "",
            color: album.color ?? null,                 // ✅ DB → 폼
            is_public: album.is_public ?? true,
            url: album.url ?? null,
            coverFile: undefined,
            coverPreviewUrl: album.photo_url ?? undefined,
            selectedSongIds: selectedIds,
          },
          loading: false,
        });
      },

      /** 폼 제어 */
      setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
      pickCover: (file) =>
        set((s) => ({
          form: {
            ...s.form,
            coverFile: file,
            coverPreviewUrl: file ? URL.createObjectURL(file) : s.form.coverPreviewUrl,
          },
        })),
      toggleSong: (songId) =>
        set((s) => {
          const exists = s.form.selectedSongIds.includes(songId);
          let next = exists
            ? s.form.selectedSongIds.filter((id) => id !== songId)
            : [...s.form.selectedSongIds, songId];

          if (!exists && next.length > MAX_SONGS_PER_ALBUM) {
            return {
              errors: { ...s.errors, maxSongError: `최대 ${MAX_SONGS_PER_ALBUM}곡까지 선택할 수 있습니다.` },
            } as Partial<AlbumState>;
          }

          return {
            form: { ...s.form, selectedSongIds: next },
            errors: { ...(s.errors ?? {}), maxSongError: undefined },
          };
        }),
      setSongOrder: (orderedSongIds) =>
        set((s) => {
          if (orderedSongIds.length > MAX_SONGS_PER_ALBUM) {
            orderedSongIds = orderedSongIds.slice(0, MAX_SONGS_PER_ALBUM);
          }
          return { form: { ...s.form, selectedSongIds: orderedSongIds } };
        }),
      clearForm: () => set({ form: { ...emptyForm }, errors: null }),

      /** 검증 */
      validate: () => {
        const { albumname, bio, selectedSongIds } = get().form;
        const errs: ValidationErrors = {};

        if (!albumname?.trim()) errs.albumname = "가사집 제목을 입력해주세요";
        if (!bio?.trim()) errs.bio = "가사집 설명을 입력해주세요";
        if (!selectedSongIds?.length) errs.selectedSongIds = "최소 한 곡을 선택해주세요";
        if (selectedSongIds.length > MAX_SONGS_PER_ALBUM) {
          errs.maxSongError = `최대 ${MAX_SONGS_PER_ALBUM}곡까지 선택할 수 있습니다.`;
        }

        set({ errors: Object.keys(errs).length ? errs : null });
        return !Object.keys(errs).length;
      },

      /** 커버 업로드 */
      uploadCover: async (file, artistId, albumname) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safe = (albumname || "album").replace(/[^\w\-]/g, "_");
        const path = `album-covers/${artistId}/${safe}/${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("album-covers")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;

        const { data: pub } = await supabase.storage.from("album-covers").getPublicUrl(path);
        return pub?.publicUrl ?? null;
      },

      /** album_songs 교체 (RPC 있으면 우선 사용) */
      replaceAlbumSongs: async (albumId, songIds) => {
        try {
          const { error: rpcErr } = await supabase.rpc("replace_album_songs", {
            p_album_id: albumId,
            p_song_ids: songIds,
          });
          if (rpcErr) throw rpcErr;
          return;
        } catch {
          // Fallback: 삭제 후 일괄 삽입
          const { error: delErr } = await supabase
            .from("album_songs")
            .delete()
            .eq("album_id", albumId);
          if (delErr) throw delErr;

          if (!songIds.length) return;

          const rows = songIds.map((songId, idx) => ({
            album_id: albumId,
            song_id: songId,
            position: idx + 1,
          }));
          const { error: insErr } = await supabase.from("album_songs").insert(rows);
          if (insErr) throw insErr;
        }
      },

      /** 생성 */
      createAlbum: async (artistId) => {
        if (!get().validate()) return;
        set({ submitting: true });

        try {
          const { form } = get();

          // 1) 커버(선택)
          let photo_url: string | null = null;
          if (form.coverFile) {
            photo_url = await get().uploadCover(form.coverFile, artistId, form.albumname);
          }

          // 2) 앨범 INSERT (✅ color 포함)
          const { data: album, error: insErr } = await supabase
            .from("albums")
            .insert([
              {
                artist_id: artistId,
                albumname: form.albumname,
                bio: form.bio,
                color: form.color,            // ✅
                photo_url,
                is_public: form.is_public,
                url: form.url ?? null,
              },
            ])
            .select("*")
            .single();

          if (insErr || !album) throw insErr;

          // 3) album_songs 교체
          const slice = form.selectedSongIds.slice(0, MAX_SONGS_PER_ALBUM);
          await get().replaceAlbumSongs(album.id, slice);

          // 4) 목록 갱신 & 폼 초기화
          set((s) => ({ albums: [album as Album, ...s.albums] }));
          set({ currentAlbum: album as Album, form: { ...emptyForm }, errors: null });
        } catch (e) {
          console.error("[createAlbum]", e);
        } finally {
          set({ submitting: false });
        }
      },

      /** 수정 */
      updateAlbum: async (albumId) => {
        if (!get().validate()) return;
        set({ submitting: true });

        try {
          const { form, currentAlbum } = get();
          if (!currentAlbum) throw new Error("currentAlbum is not loaded");

          // 1) 커버(선택 교체)
          let photo_url = currentAlbum.photo_url ?? null;
          if (form.coverFile) {
            photo_url = await get().uploadCover(
              form.coverFile,
              currentAlbum.artist_id ?? 0,
              form.albumname
            );
          }

          // 2) 앨범 UPDATE (✅ color 포함)
          const { data: updated, error: upErr } = await supabase
            .from("albums")
            .update({
              albumname: form.albumname,
              bio: form.bio,
              color: form.color,             // ✅
              is_public: form.is_public,
              url: form.url ?? null,
              photo_url,
            })
            .eq("id", albumId)
            .select("*")
            .single();

          if (upErr || !updated) throw upErr;

          // 3) album_songs 교체
          const slice = form.selectedSongIds.slice(0, MAX_SONGS_PER_ALBUM);
          await get().replaceAlbumSongs(albumId, slice);

          // 4) 로컬 반영
          set((s) => ({
            albums: s.albums.map((a) => (a.id === albumId ? (updated as Album) : a)),
            currentAlbum: updated as Album,
          }));
        } catch (e) {
          console.error("[updateAlbum]", e);
        } finally {
          set({ submitting: false });
        }
      },

      /** 삭제 */
      deleteAlbum: async (albumId) => {
        set({ submitting: true });
        try {
          // album_songs는 FK on delete cascade로 자동 삭제
          const { error } = await supabase.from("albums").delete().eq("id", albumId);
          if (error) throw error;

          set((s) => ({ albums: s.albums.filter((a) => a.id !== albumId) }));
          set({ currentAlbum: null, form: { ...emptyForm }, errors: null });
        } catch (e) {
          console.error("[deleteAlbum]", e);
        } finally {
          set({ submitting: false });
        }
      },

      /** 곡 목록(선택 UI) */
      listSongsByArtist: async (artistId) => {
        const { data, error } = await supabase
          .from("songs")
          .select("id, title, artist_id")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[listSongsByArtist]", error);
          return [];
        }
        return (data ?? []) as Song[];
      },
    }),
    {
      name: "album-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as any)
      ),
    }
  )
);
