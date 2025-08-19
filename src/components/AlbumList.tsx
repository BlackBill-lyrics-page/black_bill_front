// AlbumsList.tsx
import { FiEdit2 } from "react-icons/fi";
import AlbumLikeButton from "./AlbumLikeButton";

export type UIAlbum = {
  id: string;
  name: string;
  photoUrl?: string | null;
  createdAt?: string | null;
  commentCount?: number;
};

type Props = {
  albums: UIAlbum[];
  onEdit?: (album: UIAlbum) => void;
  readOnly?: boolean;
  onOpen?: (album: UIAlbum) => void;
  selectedId?: number | string | null;
};

export default function AlbumsList({
  albums,
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
        return (
          <li
            key={a.id}
            onClick={() => onOpen?.(a)}
            className={`flex items-center justify-between rounded-lg p-3 cursor-pointer ${
              active ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
            role="button"
            tabIndex={0}
          >
            {/* 왼쪽: 사진 + 이름/날짜 */}
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
                {a.createdAt && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 좋아요 + 댓글 + 수정 */}
            <div className="flex items-center gap-3">
              <AlbumLikeButton mode="vm" albumId={Number(a.id)} />
              <span className="text-xs text-gray-500">
                댓글({a.commentCount ?? 0})
              </span>
              {!readOnly && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(a);
                  }}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-50"
                >
                  <FiEdit2 size={18} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
