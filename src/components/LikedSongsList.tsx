import type { UISong } from "./SongList";

export default function LikedSongsList({
  songs,
  onOpen,
}: {
  songs: UISong[];
  onOpen?: (song: UISong) => void;
}) {
  if (!songs.length) return <div className="py-6 text-sm text-gray-400">좋아요한 곡이 없어요.</div>;

  return (
    <ul className="mt-4 grid gap-3">
      {songs.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between rounded-lg p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => onOpen?.(s)}
        >
          <div className="flex items-center min-w-0 gap-3">
            {s.photoUrl && (
              <img
                src={s.photoUrl}
                alt={s.title || "cover"}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{s.title || "(제목 없음)"}</div>
              <div className="text-xs text-gray-500 truncate">
                {s.artistName ?? "(아티스트 미상)"}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
