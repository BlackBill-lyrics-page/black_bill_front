import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSongLikeVM } from "../viewmodels/useSongLikeVM";

type BaseProps = {
  className?: string;
  showCount?: boolean;          // 기본 true
  size?: "sm" | "md" | "lg";    // 아이콘 크기
  stopPropagation?: boolean;    // 리스트행 클릭과 충돌 방지용
};

/** 제어 모드: 상위에서 상태/토글을 넘겨줌 (예: SongDetailPanel) */
type ControlledProps = BaseProps & {
  mode?: "controlled";
  liked: boolean;
  likeCount: number;
  likeLoading?: boolean;
  onToggleLike: () => void;
  songId?: never;
};

/** 자체 VM 모드: songId만 주면 내부에서 useSongLikeVM 사용 (예: 트랙행) */
type VMProps = BaseProps & {
  mode?: "vm";
  songId: number;
  liked?: never;
  likeCount?: never;
  likeLoading?: never;
  onToggleLike?: never;
};

export default function SongLikeButton(props: ControlledProps | VMProps) {
  const {
    className = "",
    showCount = true,
    size = "md",
    stopPropagation = true,
  } = props;

  // 아이콘 크기 클래스
  const sizeCls = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  // 두 모드의 상태/동작 통일
  const isControlled = (props as ControlledProps).onToggleLike !== undefined;
  const vm = !isControlled && (props as VMProps).songId
    ? useSongLikeVM((props as VMProps).songId)
    : null;

  const liked       = isControlled ? (props as ControlledProps).liked       : vm?.liked ?? false;
  const likeCount   = isControlled ? (props as ControlledProps).likeCount   : vm?.likeCount ?? 0;
  const likeLoading = isControlled ? (props as ControlledProps).likeLoading : vm?.loading ?? false;
  const toggleLike  = isControlled ? (props as ControlledProps).onToggleLike : (vm?.toggleLike ?? (() => {}));

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        toggleLike();
      }}
      disabled={likeLoading}
      className={`inline-flex items-center gap-1 ${className}`}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      title={liked ? "좋아요 취소" : "좋아요"}
    >
      {liked ? (
        <FaHeart className={`${sizeCls}`} />
      ) : (
        <FaRegHeart className={`${sizeCls}`} />
      )}
      {showCount && (
        <span className="text-xs text-gray-500">{likeCount ?? 0}</span>
      )}
    </button>
  );
}
