// (무대 정보를 업로드할 때 사용하는 localStorage)

// store/useStageStore.ts
// ------------------------------------------------------------------
// Stage 작성 도중 입력값을 보존하는 로컬 스토어 (Zustand + localStorage)
// - 모달 닫힘/새로고침에도 값 유지
// - 제출 성공 시 초기화
// - 앨범 단위로 드래프트를 분리 저장 (albumId 키)
// ------------------------------------------------------------------

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { KakaoPlace } from "../hooks/stage/stageService";

// 폼 구조와 호환되는 드래프트 타입 (StageFormValues와 동일 구조)
export type StageDraft = {
  title: string;
  date: string;            // YYYY-MM-DD
  time: string;            // HH:mm
  duration_hours: number;  // 0.5 step
  venue: KakaoPlace | null;
  promotion_url?: string;
  photo_url?: string | null;
  address_detail?: string;
};

export type StageDraftState = {
  // 앨범별 드래프트 저장소
  drafts: Record<string, StageDraft | undefined>; // key: albumId (string)

  // 액션
  saveDraft: (albumId: number | string, patch: Partial<StageDraft>) => void;
  setDraft: (albumId: number | string, draft: StageDraft) => void;
  loadDraft: (albumId: number | string) => StageDraft | undefined;
  clearDraft: (albumId: number | string) => void;
  clearAll: () => void;
};

const DEFAULT_DRAFT: StageDraft = {
  title: "",
  date: "",
  time: "",
  duration_hours: 1,
  venue: null,
  promotion_url: "",
  photo_url: null,
  address_detail: "",
};

export const useStageStore = create<StageDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (albumId, patch) => {
        const key = String(albumId);
        const prev = get().drafts[key] ?? DEFAULT_DRAFT;
        const next: StageDraft = { ...prev, ...patch } as StageDraft;
        set((s) => ({ drafts: { ...s.drafts, [key]: next } }));
      },

      setDraft: (albumId, draft) => {
        const key = String(albumId);
        const normalized: StageDraft = {
          ...DEFAULT_DRAFT,
          ...draft,
          duration_hours: Number(draft.duration_hours ?? 1),
        };
        set((s) => ({ drafts: { ...s.drafts, [key]: normalized } }));
      },

      loadDraft: (albumId) => {
        const key = String(albumId);
        return get().drafts[key];
      },

      clearDraft: (albumId) => {
        const key = String(albumId);
        const { drafts } = get();
        const { [key]: _, ...rest } = drafts;
        set({ drafts: rest });
      },

      clearAll: () => set({ drafts: {} }),
    }),
    {
      name: "stage-drafts",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        // 추후 마이그레이션 포인트
        return persisted as any;
      },
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);

// --------- 헬퍼 훅 (선택) ---------
export function useStageDraft(albumId: number | string) {
  const draft = useStageStore((s) => s.drafts[String(albumId)]);
  const saveDraft = useStageStore((s) => s.saveDraft);
  const setDraft = useStageStore((s) => s.setDraft);
  const clearDraft = useStageStore((s) => s.clearDraft);

  return {
    draft,
    saveDraft: (patch: Partial<StageDraft>) => saveDraft(albumId, patch),
    setDraft: (d: StageDraft) => setDraft(albumId, d),
    clearDraft: () => clearDraft(albumId),
  } as const;
}
