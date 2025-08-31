import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useAlbumLikeVM } from "../viewmodels/useAlbumLikeVM";

type BaseProps = {
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  stopPropagation?: boolean;
};

type ControlledProps = BaseProps & {
  mode?: "controlled";
  liked: boolean;
  likeCount: number;
  likeLoading?: boolean;
  onToggleLike: () => void;
  albumId?: never;
};

type VMProps = BaseProps & {
  mode?: "vm";
  albumId: number;
  liked?: never;
  likeCount?: never;
  likeLoading?: never;
  onToggleLike?: never;
};

export default function AlbumLikeButton(props: ControlledProps | VMProps) {
  const {
    className = "",
    showCount = true,
    size = "md",
    stopPropagation = true,
  } = props;

  const sizeCls =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  const isControlled = (props as ControlledProps).onToggleLike !== undefined;

  // VM 모드라면 훅 사용
  const vm =
    !isControlled && (props as VMProps).albumId
      ? useAlbumLikeVM((props as VMProps).albumId)
      : null;

  const liked = isControlled
    ? (props as ControlledProps).liked
    : vm?.liked ?? false;

  const likeCount = isControlled
    ? (props as ControlledProps).likeCount
    : vm?.likeCount ?? 0;

  const likeLoading = isControlled
    ? (props as ControlledProps).likeLoading
    : vm?.loading ?? false;

  const toggleLike = isControlled
    ? (props as ControlledProps).onToggleLike
    : vm?.toggleLike ?? (() => {});

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
        <FaHeart className={sizeCls} />
      ) : (
        <FaRegHeart className={sizeCls} />
      )}
      {showCount && (
        <span className="text-xs text-gray-500">{likeCount ?? 0}</span>
      )}
    </button>
  );
}
