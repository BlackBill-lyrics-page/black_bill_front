
// // viewmodels/useUploadStageVM.ts
// // ------------------------------------------------------------------
// // Stage 생성/수정/삭제를 오케스트레이션하는 뷰모델 훅 (포스터 기능 제거 버전)
// // - Venue upsert (KakaoPlace → venue_id)
// // - date+time(Asia/Seoul) → ISO(UTC) 변환
// // - stageService 호출(create/update)
// // ------------------------------------------------------------------
// // viewmodels/useUploadStageVM.ts
// import { useCallback, useState } from "react";
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import type { StageFormValues } from "../components/stage/StageForm";
// import { createStage, updateStage, upsertVenueFromKakao } from "../hooks/stage/stageService";

// dayjs.extend(utc);
// dayjs.extend(timezone);

// export type UseUploadStageVMArgs = {
//   albumId: number;
//   artistId: number;
//   initialStage?: {
//     id?: number;
//     title?: string | null;
//     start_at?: string;
//     duration_hours?: number;
//     promotion_url?: string | null;
//     address_detail?: string | null;
//     album_id?: number;
//     venue?: {
//       id: number;
//       name: string;
//       road_address: string | null;
//       formatted_address: string | null;
//     } | null;
//   } | null;
// };

// export function useUploadStageVM({ albumId }: UseUploadStageVMArgs) {
//   const [submitting, setSubmitting] = useState(false);

//   const toIsoUtc = (date: string, time: string): string => {
//     return dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", "Asia/Seoul").toISOString();
//   };

//   const handleCreate = useCallback(async (v: StageFormValues) => {
//     setSubmitting(true);
//     try {
//       const venueId = v.venue ? await upsertVenueFromKakao(v.venue) : null;
//       const startIso = toIsoUtc(v.date, v.time);

//       await createStage({
//         album_id: v.album_id ?? albumId,   // ✅ 폼 선택 우선
//         venue_id: venueId,
//         start_at: startIso,
//         duration_hours: v.duration_hours,
//         title: v.title?.trim() || undefined,
//         promotion_url: v.promotion_url?.trim() || undefined,
//         address_detail: v.address_detail?.trim() || undefined,
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   }, [albumId]);

//   const handleUpdate = useCallback(async (stageId: number, v: StageFormValues) => {
//     setSubmitting(true);
//     try {
//       const venueId = v.venue ? await upsertVenueFromKakao(v.venue) : undefined;
//       const patch: any = {
//         title: v.title?.trim() || undefined,
//         duration_hours: v.duration_hours,
//         promotion_url: v.promotion_url?.trim() || undefined,
//         address_detail: v.address_detail?.trim() || undefined,
//         album_id: v.album_id,              // ✅ 수정 시 앨범도 반영
//       };
//       if (v.date && v.time) {
//         patch.start_at = toIsoUtc(v.date, v.time);
//       }
//       if (venueId !== undefined) patch.venue_id = venueId;

//       await updateStage(stageId, patch);
//     } finally {
//       setSubmitting(false);
//     }
//   }, []);

//   return { submitting, handleCreate, handleUpdate } as const;
// }
