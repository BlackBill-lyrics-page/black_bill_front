import type { UISong } from "./SongList";
import SongLikeButton from "./SongLikeButton";


export default function LikedSongsList({
  songs,
  onOpen,
}: {
  songs: UISong[];
  onOpen?: (song: UISong) => void;
}) {
  if (!songs.length) return <div className="py-6 text-sm text-gray-400">좋아요한 곡이 없어요.</div>;


  return (
<ul>
  {songs.map((s) => (
    <li
      key={s.id}
      className="px-2 sm:px-0 select-none"
      onClick={() => onOpen?.(s)}
    >
      <div className="flex items-start gap-3 py-3 border-b border-gray-100">
        {/* 썸네일 */}
        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
          {s.photoUrl && (
            <img
              src={s.photoUrl}
              alt={s.title || "cover"}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 제목/아티스트 + 액션 영역 (좌/우 배치) */}
        <div className="flex-1 min-w-0 flex items-start justify-between">
          {/* 왼쪽: 제목 + 아티스트 */}
          <button
            type="button"
            onClick={() => onOpen?.(s)}
            className="text-left flex-1 min-w-0"
          >
            <div className="font-semibold text-[17px] text-gray-800 truncate">
              {s.title || "(제목 없음)"}
            </div>
            <div className="mt-0.5 text-sm text-gray-500 truncate">
              {s.artistName ?? "(아티스트 미상)"}
            </div>
          </button>

          {/* 오른쪽: 좋아요 + 댓글 */}
          <div
            className="shrink-0 flex items-center gap-3 ml-3"
            onClick={(e) => e.stopPropagation()}
          >
            <SongLikeButton mode="vm" songId={Number(s.id)} />
            <span className="text-sm text-gray-500">
              댓글({s.commentCount ?? 0})
            </span>
          </div>
        </div>
      </div>
    </li>
  ))}
</ul>
  );
}
