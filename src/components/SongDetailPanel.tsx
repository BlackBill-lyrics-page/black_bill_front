import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SongLikeButton from "./SongLikeButton";

type SongDetail = {
  id: number;
  title: string;
  lyrics: string | null;
  bio: string | null;
  song_photo: string | null;
  song_link: string | null;
  created_at: string | null;
  links?: { platform: string; url: string }[];
};

type Props = {
  openSong: SongDetail | null;
  openLoading: boolean;
  onClose: () => void;
  platformMeta: (p: string) => { label: string; Icon: any; className: string };

  // 좋아요/댓글 상태
  liked: boolean;
  likeCount: number;
  likeLoading: boolean;
  onToggleLike: () => void;
  commentCount: number;

  // 스크롤용 ref (선택)
  panelRef?: React.RefObject<HTMLDivElement | null>;
  // 가사/댓글 컴포넌트 (필요 시 외부에서 주입)
  commentsSlot?: React.ReactNode;
};

export default function SongDetailPanel({
  openSong,
  openLoading,
  onClose,
  platformMeta,
  liked,
  likeCount,
  likeLoading,
  onToggleLike,
  commentCount,
  panelRef,
  commentsSlot,
}: Props) {
  if (!openLoading && !openSong) return null;

  return (
    <div ref={panelRef} className="mt-6 rounded-xl bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 pl-3">
        <button
          type="button"
          className=" text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="닫기"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          {!!openSong?.bio && (
            <div className="text-xs text-gray-500 mt-0.5">{openSong.bio}</div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 pb-4">
        {openLoading ? (
          <div className="text-sm text-gray-500 py-8">불러오는 중…</div>
        ) : (
          <>
            {!!openSong?.links?.length && (
              <div className="mb-3 flex flex-wrap gap-2">
                {openSong.links!.map((L, i) => {
                  if (!L.url) return null;
                  const { label, Icon, className } = platformMeta(L.platform);
                  return (
                    <a
                      key={i}
                      href={L.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${className}`}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </a>
                  );
                })}
              </div>
            )}

            <div className="max-h-96 overflow-y-auto whitespace-pre-line text-sm leading-6 text-gray-800">
              {openSong?.lyrics || "가사가 비어 있습니다."}
            </div>

            <div className="w-full h-px bg-gray-300 mt-4" />

            <div className="mb-3 flex items-cneter gap-4 mt-4">
                <SongLikeButton
                    mode="controlled"
                    liked={liked}
                    likeCount={likeCount}
                    likeLoading={likeLoading}
                    onToggleLike={onToggleLike}
                    size="md"
                    className="text-black"
                    showCount={true}
                    stopPropagation={false} 
                />
                <span className="text-sm">댓글 ({commentCount})</span>
            </div>

            {/* 외부에서 댓글 컴포넌트 꽂기 */}
            {commentsSlot}
          </>
        )}
      </div>
    </div>
  );
}
