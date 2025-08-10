import { create } from "zustand";

interface UserState {
  id: string;
  username: string;
  photoUrl: string;
  provider: string;
  setUser: (data: Partial<UserState>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: "",
  username: "",
  photoUrl: "",
  provider: "",
  setUser: (data) => set((state) => ({ ...state, ...data })),
}));
