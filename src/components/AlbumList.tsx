// AlbumsList.tsx
import { FiEdit2 } from "react-icons/fi";
import AlbumLikeButton from "./AlbumLikeButton";

// ▼ 추가: 최신 무대 프리뷰 + 토글 패널
import StageSummary from "./stage/StageSummary";
import AlbumStagesPanel from "./stage/AlbumStagesPanel";

// ✅ 이 파일에서 UIAlbum을 다시 정의/내보내지 말고, hooks의 타입을 사용하세요.
//    (중복 타입/불일치로 인한 오류 방지)
import type { UIAlbum as HookAlbum } from "../hooks/stage/useAlbumsWithStages";

// ──────────────────────────────────────────────────────────────
// 페이지별 UX 분기
type PageType = "audience" | "artist" | "profile_artist";

// AlbumStagesPanel/StageSummary가 이해할 수 있도록 venue를 느슨하게 받는 스테이지 형태
type VenueLike = string | { name?: string | null } | null | undefined;
type StageLike = {
  id: number;
  title?: string | null;
  start_at?: string | null;
  venue?: VenueLike;
};

// Stage 데이터를 느슨한 StageLike로 정규화
const toStageLike = (s: any): StageLike => ({
  id: Number(s?.id),
  title: s?.title ?? null,
  start_at: s?.start_at ?? s?.startAt ?? null,
  // venues:venue_id(name) 로 조인했을 때도, venue_name 같은 문자열 컬럼일 때도 대응
  venue:
    typeof s?.venue === "string"
      ? s.venue
      : s?.venue?.name ?? s?.venues?.name ?? s?.venue_name ?? null,
});

// ──────────────────────────────────────────────────────────────

type Props = {
  albums: HookAlbum[];                 // ← hooks 타입 그대로
  pageType?: PageType;                 // ← 없으면 audience로 동작(호환성)
  onEdit?: (album: HookAlbum) => void;
  readOnly?: boolean;
  onOpen?: (album: HookAlbum) => void;
  selectedId?: number | string | null;
};

export default function AlbumsList({
  albums,
  pageType = "audience",              // 기본값: 관객
  onEdit,
  readOnly = true,
  onOpen,
  selectedId,
}: Props) {
  if (!albums.length)
    return (
      <div className="py-6 text-sm text-gray-400">아직 등록된 가사집이 없어요.</div>
    );

  return (
    <ul className="mt-4 grid gap-3">
      {albums.map((a) => {
        const active = String(selectedId ?? "") === String(a.id);

        // createdAt 필드가 없고 created_at만 있는 데이터도 안전 처리
        const created = (a as any).createdAt ?? (a as any).created_at ?? null;

        // 스테이지 정규화(없으면 undefined로)
        const stages: StageLike[] | undefined = Array.isArray((a as any).stages)
          ? ((a as any).stages as any[]).map(toStageLike)
          : undefined;

        const latestStage: StageLike | null | undefined = (a as any).latestStage
          ? toStageLike((a as any).latestStage)
          : undefined;

        return (
          <li
            key={String(a.id)}
            onClick={() => onOpen?.(a)}
            className={`flex flex-col gap-2 p-3 cursor-pointer border-b border-gray-50 ${
              active ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
            role="button"
            tabIndex={0}
          >
            {/* 왼쪽: 사진 + 이름/날짜 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 gap-3">
                {a.photoUrl && (
                  <img
                    src={a.photoUrl}
                    alt={a.name || "cover"}
                    className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {a.name || "(제목 없음)"}
                  </div>
                  {created && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(created).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 좋아요 + 댓글 + 수정 */}
              <div className="flex items-center gap-3">
                <AlbumLikeButton mode="vm" albumId={Number(a.id)} />
                <span className="text-xs text-gray-500">
                  댓글({(a as any).commentCount ?? 0})
                </span>
                {!readOnly && onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 onClick으로 버블링 차단
                      onEdit(a);
                    }}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-50"
                  >
                    <FiEdit2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* ▼ 2행: 최신 무대 프리뷰(관객/프로필 아티스트에서만) */}
            {(pageType === "audience" || pageType === "profile_artist") && (
              <StageSummary stage={latestStage} />
            )}

            {/* ▼ 3행: 무대 정보 토글 패널
                - 빈 상태면 버튼 없이 “(연동된 무대 정보가 없습니다)” 메시지를 보여줌
                - 내부에서 stopPropagation 처리되어 있어 카드 onClick과 충돌 안 함 */}
            <AlbumStagesPanel
              stages={stages}
              mode={pageType === "artist" ? "artist" : "audience"}
            />
          </li>
        );
      })}
    </ul>
  );
}
