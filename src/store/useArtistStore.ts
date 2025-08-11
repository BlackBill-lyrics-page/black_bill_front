import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ArtistLink = { platform: string; url: string };

export type ArtistGenre = { id: number; name: string };

export interface Artist {
  id: number | null;
  userId: string;
  name: string;
  photoUrl: string;
  bio: string;
  label: string;
  instruments: string;
  genres: ArtistGenre[];
  links: ArtistLink[];
}

interface ArtistState {
  artist: Artist;
  setArtist: (data: Partial<Artist>) => void;
  clearArtist: () => void;
}

const defaultArtist: Artist = {
  id: null,
  userId: "",
  name: "",
  photoUrl: "",
  bio: "",
  label: "",
  instruments: "",
  genres: [],
  links: [],
};

export const useArtistStore = create<ArtistState>()(
  persist(
    (set) => ({
      artist: defaultArtist,

      setArtist: (data) =>
        set((state) => ({
          artist: { ...state.artist, ...data },
        })),

      clearArtist: () => set({ artist: defaultArtist }),  // 로그아웃 구현 시 구현 아직안함
    }),
    {
      name: "artist-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
