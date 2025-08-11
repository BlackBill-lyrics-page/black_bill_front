import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  id: string; // 유저 ID는 로그인 시 받아와서 유지
  username: string; // 닉네임
  photoUrl: string; // 프로필 사진
  provider: string; // 로그인 제공자 (google, email 등)
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({  //state
      id: "",
      username: "",
      photoUrl: "",
      provider: "",

      // 유저 정보 업데이트
      setUser: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      // 로그아웃이나 초기화 시  (추후 구현)
      clearUser: () =>
        set({
          id: "",
          username: "",
          photoUrl: "",
          provider: "",
        }),
    }),
    {
      name: "user-store", // localStorage key
      storage: createJSONStorage(() => localStorage), // 저장 위치
    }
  )
);
