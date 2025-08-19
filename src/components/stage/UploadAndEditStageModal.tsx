// // components/stage/UploadAndEditStageModal.tsx
// import React, { useMemo } from "react";
// import StageForm, { type StageFormValues } from "./StageForm";
// import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import tz from "dayjs/plugin/timezone";
// import type { KakaoPlace } from "../../hooks/stage/stageService";

// dayjs.extend(utc);
// dayjs.extend(tz);

// export type UploadAndEditStageModalProps = {
//   open: boolean;
//   onClose: () => void;
//   mode: "create" | "edit";
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
//   initialForm?: Partial<StageFormValues>;
// };

// function toKakaoPlace(v?: {
//   id: number;
//   name: string;
//   road_address: string | null;
//   formatted_address: string | null;
// } | null): KakaoPlace | null {
//   if (!v) return null;
//   return {
//     id: String(v.id ?? ""),
//     place_name: v.name ?? "",
//     road_address_name: v.road_address ?? undefined,
//     address_name: v.formatted_address ?? undefined,
//     x: undefined as any,
//     y: undefined as any,
//   } as unknown as KakaoPlace;
// }

// export default function UploadAndEditStageModal({
//   open,
//   onClose,
//   mode,
//   albumId,
//   artistId,
//   initialStage,
//   initialForm,
// }: UploadAndEditStageModalProps) {
//   const { submitting, handleCreate, handleUpdate } = useUploadStageVM({
//     albumId,
//     artistId,
//     initialStage,
//   });

//   const fromInitialStage: Partial<StageFormValues> | undefined = useMemo(() => {
//     if (!initialStage) return undefined;
//     let date: string | undefined;
//     let time: string | undefined;
//     if (initialStage.start_at) {
//       const kst = dayjs(initialStage.start_at).tz("Asia/Seoul");
//       date = kst.format("YYYY-MM-DD");
//       time = kst.format("HH:mm");
//     }
//     return {
//       title: initialStage.title ?? "",
//       duration_hours: initialStage.duration_hours ?? 1,
//       promotion_url: initialStage.promotion_url ?? undefined,
//       address_detail: initialStage.address_detail ?? undefined,
//       date,
//       time,
//       venue: toKakaoPlace(initialStage.venue),
//       album_id: initialStage.album_id,
//     };
//   }, [initialStage]);

//   const mergedInitial: Partial<StageFormValues> | undefined = useMemo(() => {
//     return { ...(fromInitialStage ?? {}), ...(initialForm ?? {}) };
//   }, [fromInitialStage, initialForm]);

//   if (!open) return null;

//   const onSubmit = async (values: StageFormValues) => {
//     if (mode === "create") {
//       await handleCreate(values);
//     } else {
//       if (!initialStage?.id) return;
//       await handleUpdate(initialStage.id, values);
//     }
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-5">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-semibold">
//             {mode === "create" ? "무대 등록" : "무대 수정"}
//           </h2>
//           <button onClick={onClose} className="px-3 py-1 rounded-xl border">닫기</button>
//         </div>

//         <StageForm
//           mode={mode}
//           artistId={artistId}
//           initial={mergedInitial}
//           onSubmit={onSubmit}
//           onCancel={onClose}
//           submitting={submitting}
//         />
//       </div>
//     </div>
//   );
// }
