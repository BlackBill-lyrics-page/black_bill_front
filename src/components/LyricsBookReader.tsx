import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiExternalLink, FiMessageCircle } from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import AlbumLikeButton from "./AlbumLikeButton";
import ContentImage from "./ContentImage";

type Track = {
  position: number | null;
  id: number;
  title: string;
  lyrics: string | null;
  bio: string | null;
  song_link: string | null;
  links?: { platform: string | null; url: string | null }[];
};

type Props = {
  albumId: number;
  albumName: string;
  albumPhotoUrl?: string | null;
  artistName: string;
  onBack: () => void;
  commentCount?: number;
  children?: React.ReactNode;
};

export default function LyricsBookReader({
  albumId,
  albumName,
  albumPhotoUrl,
  artistName,
  onBack,
  commentCount = 0,
  children,
}: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("album_songs")
        .select(`
          position,
          songs (
            id, title, lyrics, bio, song_link,
            song_links (platform, url)
          )
        `)
        .eq("album_id", albumId)
        .order("position", { ascending: true });

      if (!alive) return;
      if (error) {
        setError(error.message);
        setTracks([]);
      } else {
        setTracks(
          (data ?? [])
            .map((r: any) => ({
              position: r.position ?? null,
              id: r.songs?.id,
              title: r.songs?.title ?? "",
              lyrics: r.songs?.lyrics ?? null,
              bio: r.songs?.bio ?? null,
              song_link: r.songs?.song_link ?? null,
              links: r.songs?.song_links ?? [],
            }))
            .filter((t) => t.id),
        );
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [albumId]);

  const firstTrackId = useMemo(() => tracks[0]?.id, [tracks]);

  return (
    <div className="mt-4 pb-10">
      <div className="px-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          <FiChevronLeft className="h-4 w-4" />
          목록
        </button>

        <section className="flex items-center gap-4 border-b border-gray-200 pb-5">
          <ContentImage
            src={albumPhotoUrl}
            alt={albumName}
            kind="album"
            title={albumName}
            subtitle={artistName}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-500">가사집</div>
            <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-gray-950">
              {albumName || "제목 없는 가사집"}
            </h1>
            <div className="mt-1 text-sm text-gray-500">{artistName}</div>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
              <AlbumLikeButton mode="vm" albumId={albumId} showCount />
              <span className="inline-flex items-center gap-1">
                <FiMessageCircle className="h-4 w-4" />
                {commentCount}
              </span>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 py-5">
          <div className="mb-3 text-sm font-semibold text-gray-900">수록곡</div>
          {loading ? (
            <div className="text-sm text-gray-500">불러오는 중...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : tracks.length === 0 ? (
            <div className="text-sm text-gray-500">아직 수록된 곡이 없습니다.</div>
          ) : (
            <ol className="space-y-2">
              {tracks.map((track, index) => (
                <li key={track.id}>
                  <a
                    href={`#song-${track.id}`}
                    className="flex items-baseline gap-3 rounded-lg px-2 py-2 text-gray-800 hover:bg-gray-50"
                  >
                    <span className="w-6 text-right text-xs text-gray-400">
                      {String(track.position ?? index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{track.title || "제목 없는 곡"}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="divide-y divide-gray-100">
          {tracks.map((track, index) => (
            <article
              key={track.id}
              id={`song-${track.id}`}
              className={`scroll-mt-4 py-8 ${track.id === firstTrackId ? "" : ""}`}
            >
              <div className="mb-5">
                <div className="text-xs text-gray-400">
                  {String(track.position ?? index + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  {track.title || "제목 없는 곡"}
                </h2>
              </div>

              <div className="whitespace-pre-wrap text-[15px] leading-8 text-gray-900">
                {track.lyrics?.trim() || "아직 등록된 가사가 없습니다."}
              </div>

              {(track.bio?.trim() || track.song_link || track.links?.some((l) => l.url)) && (
                <details className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-gray-700">
                    곡 이야기와 링크
                  </summary>
                  {track.bio?.trim() && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {track.bio}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {track.song_link && (
                      <a
                        href={track.song_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                      >
                        대표 링크
                        <FiExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {track.links?.map((link, i) =>
                      link.url ? (
                        <a
                          key={`${track.id}-${i}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                        >
                          {link.platform || "Link"}
                          <FiExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null,
                    )}
                  </div>
                </details>
              )}
            </article>
          ))}
        </section>

        {children && (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer select-none text-sm font-medium text-gray-800">
              감상 남기기
            </summary>
            <div className="mt-4">{children}</div>
          </details>
        )}
      </div>
    </div>
  );
}
