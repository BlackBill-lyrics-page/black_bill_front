// zustand의 스토어(전역상태) 생성 함수 create를 가져옴
// 이 파일에서 이제 create()를 호출해서 전역 상태 저장소(스토어)를 만들 수 있음
import { create } from "zustand";
// persist : 스토어 상태를 브라우저 저장소(localStorage)에 자동 저장/복원하는 미들웨어
// createJSONStorage : JSON 형태로 저장소를 생성하는 헬퍼 함수(직렬화/역직렬화)
import { persist, createJSONStorage } from "zustand/middleware";

// SongLinks라는 타입 별명(런타임에는 존재x)을 만들고, 바깥 파일에서도 import해서 쓰게 허용
export type SongLinks = {
    platform: string;            // 예: "YouTube", "Spotify"
    url: string;                 // 예: "https://..."
};

// interface : type과 비슷한데, 주로 객체 구조 설명에 쓰임
export interface Songs {
    id?: number | null;          // ✅ 추가: songs.id (목록/업데이트 식별용)
    created_at?: string | null;  // ✅ 추가: songs.created_at (옵션, 서버 타임스탬프 보관용)
    artist_id: number | null;    // songs.artist_id
    title: string;               // 곡 제목
    lyrics: string;              // 가사
    bio: string;                 // 곡 설명
    song_photo: string;          // 곡 사진 (커버/썸네일 URL 등)
    song_link: string;           // 곡 링크 (단일 링크 컬럼이지만, 별도 song_links도 있음: 레거시/보조용)
    links: SongLinks[];          // UI 편의를 위해 관계형 데이터도 함께 보관
}

// 스토어의 초기 상태(빈 곡 폼) 정의
const defaultSong: Songs = {
  id: null,                      // ✅ 추가: 초기값 null
  created_at: null,              // ✅ 추가: 초기값 null
  artist_id: null,
  title: "",
  lyrics: "",
  bio: "",
  song_photo: "",
  song_link: "",     // 단일 링크를 별도로 쓰지 않으면 빈 문자열로 둡니다.
  links: [],         // 복수 플랫폼 링크는 여기 배열로 관리
};

// ===== Store Shape =====
// Songs 스토어가 제공할 상태 및 액션의 타입 정의
interface SongState {
  songs: Songs[];                // ✅ 추가: 전역 곡 목록 상태
  song: Songs;                   // 현재 편집중인 songs 상태

  // 기본 액션
  //setSong : 곡 상태를 부분 업데이트하는 함수
  // Partial<Songs> : Songs의 일부만 담긴 patch를 받아서 상태를 갱신
  setSong: (patch: Partial<Songs>) => void;
  // 곡 상태를 초기화하는 함수
  clearSong: () => void;

  // 링크 전용 액션
  // addLink : 링크 하나 추가
  addLink: (link?: Partial<SongLinks>) => void;
  // updateLink : 특정 인덱스의 링크 정보의 수정 / index번째 링크를 부분 업데이트함
  updateLink: (index: number, patch: Partial<SongLinks>) => void;
  removeLink: (index: number) => void; // index번째 링크를 삭제
  setLinks: (links: SongLinks[]) => void; // 링크 배열 전체를 통째로 교체

  // ✅ 추가: 목록 전용 액션
  replaceSongs: (rows: Songs[]) => void;  // 전체 교체(초기 로드/리프레시)
  addSong: (row: Songs) => void;          // 새 곡 추가(중복 id 방지)
  updateSong: (row: Songs) => void;       // 기존 곡 갱신(id 기준)
  removeSong: (id: number) => void;       // 곡 삭제

  // 헬퍼: DB 입출력 변환을 위한 헬퍼
  // toInsertPayload : 현재 폼 상태를 DB 삽입용 payload로 바꾸는 함수
  toInsertPayload: () => {
    song: Omit<Songs, "links" | "id" | "created_at">; // ✅ INSERT 시 id/created_at 제외
    song_links: Array<SongLinks>;
  };
  // applyFromDB : DB에서 읽은 행을 스토어에 반영하는 함수
  applyFromDB: (row: Partial<Songs> & { links?: SongLinks[] }) => void;
  applyManyFromDB: (rows: (Partial<Songs> & { links?: SongLinks[] })[]) => void; // ✅ 추가: 여러 행 주입
}

// ===== Store ===== : 실제 스토어 구현부
// 컴포넌트에서 const x = useSongStore(...)하면, 이 스토어의 현재 상태를 구독하고
// 상태가 바뀌면 컴포넌트가 자동 리렌더링 됨
export const useSongStore = create<SongState>()(
  persist( // 스토어를 persist 미들웨어로 감싸 로컬 저장/복원을 활성화
    (set, get) => ({ // 실제 상태와 함수들을 정의하는 부분
      // set : 상태를 바꾸는 갱신 함수, get : 현재 상태를 즉시 읽는 함수
      songs: [],                // ✅ 초기 전역 곡 목록
      song: defaultSong,         // 초기 상태를 defaultSong으로 설정

      // 부분 업데이트 setSong
      // 이전 song을 펼치고(...state.song, 객체를 펼치는 스프레드 문법)
      // 넘어온 patch로 덮어써 새 객체로 저장
      // 반드시 새 객체로 만들어 넣어야 리액트가 변경을 감지하고 리렌더링됨
      setSong: (patch) =>
        set((state) => ({ song: { ...state.song, ...patch } })),

      clearSong: () => set({ song: defaultSong }),

      addLink: (link) =>
        set((state) => ({
          song: {
            ...state.song, // 기존 곡 상태 복사
            links: [// 링크 배열에 새 링크 추가
              ...state.song.links, // 기존 링크 펼쳐두고
              { // 새로 추가할 링크 객체 시작
                platform: link?.platform ?? "",
                url: link?.url ?? "",
              },
            ],
          },
        })),

      updateLink: (index, patch) =>
        set((state) => {
          const links = [...state.song.links];
          // patch가 없으면 아무것도 하지 않음
          if (!patch) return state;
          // index 범위 벗어나면 아무것도 하지 않고 기존 상태 반환
          if (!links[index]) return state; // out of range 방지
          // 해당 인덱스의 링크에 patch 적용
          links[index] = { ...links[index], ...patch };
          // 갱신된 링크 배열을 가진 새 song으로 상태 반환
          return { song: { ...state.song, links } };
        }),

      removeLink: (index) =>
        set((state) => {
          // 지정 인덱스 제외한 새 배열 생성
          const links = state.song.links.filter((_, i) => i !== index);
          // 링크 배열이 교체된 새 song 객체 반환
          return { song: { ...state.song, links } };
        }),

      setLinks: (links) =>
        set((state) => ({ song: { ...state.song, links: [...links] } })),

      // ✅ 전역 목록 액션 구현
      replaceSongs: (rows) =>
        set(() => ({ songs: [...rows] })),

      addSong: (row) =>
        set((state) => ({
          songs: [
            ...state.songs.filter((s) => s.id !== row.id), // 같은 id 있으면 제거
            row,
          ],
        })),

      updateSong: (row) =>
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === row.id ? { ...s, ...row } : s
          ),
        })),

      removeSong: (id) =>
        set((state) => ({
          songs: state.songs.filter((s) => s.id !== id),
        })),

      // Supabase INSERT 용도: songs + song_links 분리
      toInsertPayload: () => {
        // 현재 스토어에서 song상태를 읽어옴
        const { song } = get();
        // links는 별도 테이블 용으로 분리, id/created_at 제외
        const { links, id, created_at, ...restSong } = song;
        return {
          song: restSong, // songs 테이블에 그대로 insert (id/created_at 제외)
          song_links: links.map((l) => l), // map((1)=>1)은 사실상 복사 역할
        };
      },

      // DB -> 폼 상태 주입
      // DB에서 읽은 행을 스토어에 주입하는 함수
      applyFromDB: (row) =>
        set((state) => ({
          song: {
            ...state.song, // 기존 상태를 기본으로 하되
            ...defaultSong, // 누락 필드가 있으면 디폴트값을 채우고
            ...row, // DB에서 온 값으로 덮어써 최종 상태 구성
            links: row.links ?? [], // links없으면 빈배열로 보정
          },
        })),

      // ✅ 여러 행 주입: DB에서 읽은 곡 목록을 songs[]에 반영
      applyManyFromDB: (rows) =>
        set(() => ({
          songs: rows.map((r) => ({
            ...defaultSong,
            ...r,
            links: r.links ?? [],
          })) as Songs[],
        })),
    }),
    // persist 미들웨어 옵션 객체 시작
    {
      name: "song-store",
      storage: createJSONStorage(() => localStorage),
      // 필요 시 버전/마이그레이션도 추가 가능
      // version: 1,
      // migrate: (persisted, version) => { ... }
    }
  )
);
// ===== End of Store =====