// src/components/AlbumsList.tsx
import { FiEdit2 } from "react-icons/fi";
import { MessageCircle as FiMessage } from "lucide-react"; // 댓글 아이콘(선택: lucide)
// ↑ lucide-react가 없으면 react-icons/fi의 FiMessageSquare로 바꿔 쓰세요.
import type { UIAlbum as HookAlbum } from "../hooks/stage/useAlbumsWithStages";
import StageSummary from "./stage/StageSummary";
import AlbumStagesPanel from "./stage/AlbumStagesPanel";
import AlbumLikeButton from "./AlbumLikeButton"; // ★ 좋아요 버튼 복귀

// 페이지별 UX 분기
type PageType = "audience" | "artist" | "profile_artist";

// StageSummary/AlbumStagesPanel이 이해할 수 있도록 venue를 느슨하게 받는 스테이지 형태
type VenueLike = string | { name?: string | null } | null | undefined;
type StageLike = {
  id: number;
  title?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  venue?: VenueLike;
};

// Stage 데이터를 느슨한 StageLike로 정규화
const toStageLike = (s: any): StageLike => ({
  id: Number(s?.id),
  title: s?.title ?? null,
  start_at: s?.start_at ?? s?.startAt ?? null,
  end_at: s?.end_at ?? s?.endAt ?? null,
  venue:
    typeof s?.venue === "string"
      ? s.venue
      : s?.venue?.name ?? s?.venues?.name ?? s?.venue_name ?? null,
});

type Props = {
  albums: HookAlbum[];
  pageType?: PageType;
  onEdit?: (album: HookAlbum) => void;
  readOnly?: boolean;
  onOpen?: (album: HookAlbum) => void;
  selectedId?: number | string | null;
  onCommentClick?: (album: HookAlbum) => void; // ★ 댓글 클릭 시 동작(옵션)
  artistNameOverride?: string;
};

export default function AlbumsList({
  albums,
  pageType = "audience",
  onEdit,
  readOnly = true,
  onOpen,
  selectedId,
  onCommentClick,
  artistNameOverride,
}: Props) {
  if (!albums.length) {
    return (
      <div className="py-6 text-sm text-gray-400">
        아직 등록된 가사집이 없어요.
      </div>
    );
  }

  const isViewer = pageType === "audience" || pageType === "profile_artist";
  const isOwner = pageType === "artist";

  return (
    <ul className="mt-2">
      {albums.map((a) => {
          console.log("album keys", a);

        const active = String(selectedId ?? "") === String(a.id);

        const stages: StageLike[] | undefined = Array.isArray((a as any).stages)
          ? ((a as any).stages as any[]).map(toStageLike)
          : undefined;

        const latestStage: StageLike | null | undefined = (a as any).latestStage
          ? toStageLike((a as any).latestStage)
          : undefined;

        const commentCount = (a as any).commentCount ?? 0;

        // ★ 아티스트명 안정적으로 뽑기 (override > 앨범 내 필드들)
        const displayArtist =
          (artistNameOverride && artistNameOverride.trim()) ||
          (a as any).artistName ||
          (a as any).artist?.name ||
          (a as any).artist_name ||
          (a as any).artist?.profile?.name ||
          "(아티스트)";
        return (
          <li
            key={String(a.id)}
            className={`px-2 sm:px-0 select-none ${active ? "bg-gray-50/60" : ""
              }`}
          >
            {/* ───────────── 카드 헤더 ───────────── */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-100">
              {/* 썸네일 */}
              <button
                type="button"
                onClick={() => onOpen?.(a)}
                className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0]"
              >
                {a.photoUrl && (
                  <img
                    src={a.photoUrl}
                    alt={a.name || "cover"}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>

              {/* 제목/아티스트 */}
              {/* 제목/아티스트 + 액션 영역을 좌/우로 배치 */}
              <div className="flex-1 min-w-0 flex items-start justify-between">
                {/* 왼쪽: 제목 + 아티스트 */}
                <button
                  type="button"
                  onClick={() => onOpen?.(a)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="font-semibold text-[17px] text-gray-800 truncate">
                    {a.name || "(가사집 제목)"}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-500">
                    {displayArtist}
                  </div>
                </button>

                {/* 오른쪽: 좋아요/댓글 (viewer) 또는 수정 버튼 (owner) */}
                <div className="shrink-0 flex items-center gap-3 ml-3">
                  {isViewer && (
                    <>
                      <span
                        className="inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AlbumLikeButton mode="vm" albumId={Number(a.id)} />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCommentClick?.(a);
                        }}
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        title="댓글 보기"
                      >
                        <FiMessage className="w-5 h-5" />
                        <span className="text-sm">({commentCount})</span>
                      </button>
                    </>
                  )}

                  {isOwner && !readOnly && onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(a);
                      }}
                      className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                      aria-label="가사집 수정"
                      title="가사집 수정"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ───────────── 최신 무대 1줄 + 패널(내부 토글) ───────────── */}
            <div
              className="pl-[4.5rem] sm:pl-[4.5rem] pr-1"
              onClick={(e) => e.stopPropagation()}
            >
              {isViewer && <StageSummary stage={latestStage} />}

              <AlbumStagesPanel
                stages={stages}
                mode={isOwner ? "artist" : "audience"}
                rowClassName="flex items-center text-[13px] text-gray-800"
                leftClassName="flex-1 py-3 pl-3"
                rightClassName="flex items-center gap-6 pr-3 text-gray-500"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}