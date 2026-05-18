import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiList, FiMessageCircle } from "react-icons/fi";
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
  children?: (track: Track) => React.ReactNode;
};

export default function LyricsBookReader({
  albumId,
  albumName,
  albumPhotoUrl,
  artistName,
  onBack,
  children,
}: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  useEffect(() => {
    setActiveIndex((idx) => Math.min(idx, Math.max(tracks.length - 1, 0)));
  }, [tracks.length]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { count } = await supabase
        .from("song_comment")
        .select("*", { count: "exact", head: true })
        .eq("album_id", albumId);
      if (alive) setCommentCount(count ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [albumId]);

  const currentTrack = useMemo(() => tracks[activeIndex] ?? null, [tracks, activeIndex]);
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < tracks.length - 1;
  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(tracks.length - 1, i + 1));

  const handleTouchEnd = (x: number) => {
    if (touchStartX == null) return;
    const dx = x - touchStartX;
    setTouchStartX(null);
    if (Math.abs(dx) < 48) return;
    if (dx < 0 && canGoNext) goNext();
    if (dx > 0 && canGoPrev) goPrev();
  };

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
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setShowToc(false);
                    }}
                    className={`flex w-full items-baseline gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 ${
                      index === activeIndex ? "bg-gray-50 text-gray-950" : "text-gray-800"
                    }`}
                  >
                    <span className="w-6 text-right text-xs text-gray-400">
                      {String(track.position ?? index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{track.title || "제목 없는 곡"}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {currentTrack && (
          <section
            className="py-8"
            onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
            onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
          >
            <article key={currentTrack.id}>
              <div className="mb-5">
                <div className="text-xs text-gray-400">
                  {String(currentTrack.position ?? activeIndex + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  {currentTrack.title || "제목 없는 곡"}
                </h2>
              </div>

              <div className="whitespace-pre-wrap text-[15px] leading-8 text-gray-900">
                {currentTrack.lyrics?.trim() || "아직 등록된 가사가 없습니다."}
              </div>

              {(currentTrack.bio?.trim() || currentTrack.song_link || currentTrack.links?.some((l) => l.url)) && (
                <details className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-gray-700">
                    곡 이야기와 링크
                  </summary>
                  {currentTrack.bio?.trim() && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {currentTrack.bio}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentTrack.song_link && (
                      <a
                        href={currentTrack.song_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                      >
                        대표 링크
                        <FiExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {currentTrack.links?.map((link, i) =>
                      link.url ? (
                        <a
                          key={`${currentTrack.id}-${i}`}
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

            <div className="sticky bottom-0 -mx-3 mt-8 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="inline-flex items-center justify-start gap-1 rounded-full px-3 py-2 text-sm text-gray-700 disabled:text-gray-300"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  이전 곡
                </button>
                <button
                  type="button"
                  onClick={() => setShowToc((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  <FiList className="h-4 w-4" />
                  목차
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="inline-flex items-center justify-end gap-1 rounded-full px-3 py-2 text-sm text-gray-700 disabled:text-gray-300"
                >
                  다음 곡
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>

              {showToc && (
                <div className="mt-3 max-h-48 overflow-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  {tracks.map((track, index) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        setActiveIndex(index);
                        setShowToc(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                        index === activeIndex ? "bg-gray-100 text-gray-950" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-6 text-xs text-gray-400">
                        {String(track.position ?? index + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate">{track.title || "제목 없는 곡"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {children && currentTrack && (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer select-none text-sm font-medium text-gray-800">
              이 곡에 감상 남기기
            </summary>
            <div className="mt-4">{children(currentTrack)}</div>
          </details>
        )}
      </div>
    </div>
  );
}
