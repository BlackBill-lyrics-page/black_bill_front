import { memo } from "react"; // decreasing unnecessary rerendering
import { useAlbumTracksVM } from "../viewmodels/useAlbumTracksVM";

type Props = { albumId: number | null; albumName?: string };

function AlbumTracksPanelBase({ albumId, albumName }: Props) {
  const { tracks, loading, error } = useAlbumTracksVM(albumId);

  if (!albumId) return <div className="text-gray-400">가사집을 선택하세요</div>;
  if (loading)  return <div className="text-sm text-gray-500">불러오는 중…</div>;
  if (error)    return <div className="text-sm text-red-500">{error}</div>;
  if (!tracks.length) return <div className="text-gray-400">수록곡 없음</div>;

  return (
    <div className="space-y-5">

      {albumName && <div className="text-base font-semibold">{albumName}</div>}

      <ol className="space-y-3 divide-y divide-gray-200">
        {tracks.map(t => (
          <li key={t.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">

            <div className="w-6 text-right text-gray-400">{t.position ?? "-"}</div>

            <img
                src={t.song_photo || "/placeholder.png"}
                alt={t.title}
                className="w-10 h-10 rounded object-cover"
            />

            <div className="truncate">{t.title}</div>

          </li>
        ))}
      </ol>

    </div>
  );
}

const AlbumTracksPanel = memo(AlbumTracksPanelBase); 
export default AlbumTracksPanel;