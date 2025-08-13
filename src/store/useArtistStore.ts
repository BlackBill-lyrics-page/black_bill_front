import { create } from "zustand";
// persist 미들웨어는 상태를 로컬 저장소(localStorage)에 자동저장/복원
// createJSONStorage는 해당 저장소를 JSON 형태로 변환하여 저장
import { persist, createJSONStorage } from "zustand/middleware";

// 타입 정의 : 아티스트 링크와 장르
export type ArtistLink = { platform: string; url: string };
export type ArtistGenre = { id: number; name: string };

// 아티스트 한 명을 표현하는 전체 스키마
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

// 스토어에 들어갈 상태 모양과 액션들
// artist : 현재 보관 중인 아티스트 데이터
// setArtist : 일부 필드만 덮어쓸 수 있게 Partial<Artist>로 받음
// clearArtist : 초기 상태로 리셋
interface ArtistState {
  artist: Artist;
  setArtist: (data: Partial<Artist>) => void;
  clearArtist: () => void;
}

// 초깃값 정의(빈 아티스트) : 새 유저/로그아웃 시 기준점으로 사용
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

// useArtistStore 훅 정의
// 컴포넌트에서 userArtistStore()로 접근
export const useArtistStore = create<ArtistState>()(
  persist(
    (set) => ({
      // 초기 상태 : artist:defaultArtist
      artist: defaultArtist,

      // setArtist : 기존 state.artist를 펼친 뒤(...state.artist)
      // 넘어온 변경 분(...data)만 부분 업데이트로 덮어씀
      setArtist: (data) =>
        set((state) => ({
          artist: { ...state.artist, ...data },
        })),

      clearArtist: () => set({ artist: defaultArtist }),  // 로그아웃 구현 시 구현 아직안함
    }),
    //persist 옵션
    // name : 'artist-store' : localStorage에 저장될 키 이름
    // storage : createJSONStorage(() => localStorage) : 저장소를 JSON 형태로 변환하여 저장
    // 결과적으로 새로고침/브라우저 재시작 후에도 상태가 복원됨
    {
      name: "artist-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
