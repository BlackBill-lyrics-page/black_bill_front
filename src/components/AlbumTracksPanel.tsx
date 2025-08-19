import { memo } from "react"; // decreasing unnecessary rerendering
import { useAlbumTracksVM } from "../viewmodels/useAlbumTracksVM";
import SongLikeButton from "./SongLikeButton";

type Track = {
  id: number;
  title: string;
  position?: number | null;
  song_photo?: string | null;
};

type Props = {
  albumId: number | null;
  albumName?: string;
  onOpen?: (song: { id: number; title?: string }) => void;
};

function AlbumTracksPanelBase({ albumId, albumName, onOpen }: Props) {
  const { tracks, loading, error } = useAlbumTracksVM(albumId);

  if (!albumId) return <div className="text-gray-400">가사집을 선택하세요</div>;
  if (loading)  return <div className="text-sm text-gray-500">불러오는 중…</div>;
  if (error)    return <div className="text-sm text-red-500">{error}</div>;
  if (!tracks.length) return <div className="text-gray-400">수록곡 없음</div>;

  return (
    <div className="space-y-5">
      {albumName && <div className="text-base font-semibold">{albumName}</div>}

      <ol className="space-y-3 divide-y divide-gray-200">
        {(tracks as Track[]).map((t) => (
          <li key={t.id}>
            {/* 버튼 전체행 클릭영역 */}
            <div className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <button
                type="button"
                onClick={() => onOpen?.({ id: t.id, title: t.title })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen?.({ id: t.id, title: t.title });
                  }
                }}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 text-left focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <div className="w-6 text-right text-gray-400">
                  {t.position ?? "-"}
                </div>

                <img
                  src={t.song_photo || "/placeholder.png"}
                  alt={t.title}
                  className="w-10 h-10 rounded object-cover"
                />

                <div className="truncate flex-1">{t.title}</div>
              </button>
              <SongLikeButton
                mode="vm"
                songId={t.id}
                size="md"
                showCount={true}
                className="px-2 py-1 rounded hover:bg-gray-100"
                stopPropagation={true}
              />
            </div>
            
          </li>
        ))}
      </ol>
    </div>
  );
}

const AlbumTracksPanel = memo(AlbumTracksPanelBase);
export default AlbumTracksPanel;
