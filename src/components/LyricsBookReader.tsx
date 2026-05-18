import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiList, FiMessageCircle } from "react-icons/fi";
import { FaLink, FaSoundcloud, FaSpotify, FaYoutube } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";
import { supabase } from "../lib/supabaseClient";
import AlbumLikeButton from "./AlbumLikeButton";
import ContentImage from "./ContentImage";
import melonPng from "../assets/melon.png";
import ytMusicPng from "../assets/youtubemusic.png";

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

  const selectTrack = (index: number) => {
    setActiveIndex(index);
    setShowToc(false);
  };

  const linkMeta = (platform?: string | null) => {
    const key = (platform ?? "").toLowerCase();
    if (key.includes("youtube") && key.includes("music")) {
      return { label: "YouTube Music", image: ytMusicPng };
    }
    if (key.includes("youtube")) return { label: "YouTube", Icon: FaYoutube, className: "text-red-600" };
    if (key.includes("spotify")) return { label: "Spotify", Icon: FaSpotify, className: "text-green-700" };
    if (key.includes("apple")) return { label: "Apple Music", Icon: SiApplemusic, className: "text-gray-900" };
    if (key.includes("sound")) return { label: "SoundCloud", Icon: FaSoundcloud, className: "text-orange-600" };
    if (key.includes("melon")) return { label: "Melon", image: melonPng };
    return { label: platform || "Link", Icon: FaLink, className: "text-gray-700" };
  };

  const links = currentTrack
    ? [
        ...(currentTrack.song_link ? [{ platform: "대표 링크", url: currentTrack.song_link }] : []),
        ...((currentTrack.links ?? []).filter((link) => link.url) as { platform: string | null; url: string }[]),
      ]
    : [];

  const trackList = (
    <ol className="space-y-1">
      {tracks.map((track, index) => (
        <li key={track.id}>
          <button
            type="button"
            onClick={() => selectTrack(index)}
            className={`grid w-full grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50 ${
              index === activeIndex ? "bg-gray-100 text-gray-950" : "text-gray-600"
            }`}
          >
            <span className="text-xs text-gray-400">
              {String(track.position ?? index + 1).padStart(2, "0")}
            </span>
            <span className="truncate font-medium">{track.title || "제목 없는 곡"}</span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="mt-4 pb-10">
      <div className="px-3 md:grid md:grid-cols-[180px_minmax(0,1fr)] md:items-start md:gap-6">
        <aside className="hidden md:block md:sticky md:top-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <FiChevronLeft className="h-4 w-4" />
            목록
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <ContentImage
              src={albumPhotoUrl}
              alt={albumName}
              kind="album"
              title={albumName}
              subtitle={artistName}
              className="aspect-square w-full rounded-xl object-cover"
            />
            <div className="mt-3 min-w-0">
              <div className="text-xs text-gray-500">가사집</div>
              <div className="truncate text-sm font-semibold text-gray-950">{albumName || "제목 없는 가사집"}</div>
              <div className="truncate text-xs text-gray-500">{artistName}</div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
              <AlbumLikeButton mode="vm" albumId={albumId} showCount />
              <span className="inline-flex items-center gap-1">
                <FiMessageCircle className="h-4 w-4" />
                {commentCount}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-2">
            <div className="px-2 pb-2 text-xs font-semibold text-gray-500">곡 순서</div>
            {loading ? (
              <div className="px-2 py-3 text-sm text-gray-500">불러오는 중...</div>
            ) : error ? (
              <div className="px-2 py-3 text-sm text-red-500">{error}</div>
            ) : tracks.length === 0 ? (
              <div className="px-2 py-3 text-sm text-gray-500">아직 수록된 곡이 없습니다.</div>
            ) : (
              trackList
            )}
          </div>
        </aside>

        <main className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 md:hidden"
          >
            <FiChevronLeft className="h-4 w-4" />
            목록
          </button>

          <section className="flex items-center gap-4 border-b border-gray-200 pb-5 md:hidden">
            <ContentImage
              src={albumPhotoUrl}
              alt={albumName}
              kind="album"
              title={albumName}
              subtitle={artistName}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-500">가사집</div>
              <h1 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-gray-950">
                {albumName || "제목 없는 가사집"}
              </h1>
              <div className="mt-1 text-sm text-gray-500">{artistName}</div>
            </div>
          </section>

          <div className="border-b border-gray-100 py-4 md:hidden">
            <button
              type="button"
              onClick={() => setShowToc((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <FiList className="h-4 w-4" />
              곡 순서
            </button>
            {showToc && <div className="mt-3 rounded-2xl border border-gray-200 p-2">{trackList}</div>}
          </div>

          {loading && (
            <div className="py-8 text-sm text-gray-500">불러오는 중...</div>
          )}
          {error && (
            <div className="py-8 text-sm text-red-500">{error}</div>
          )}

          {currentTrack && (
            <section
              className="py-8"
              onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
            >
              <article key={currentTrack.id}>
                <div className="text-xs text-gray-400">
                  {String(currentTrack.position ?? activeIndex + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-gray-950">
                  {currentTrack.title || "제목 없는 곡"}
                </h2>

                <section className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-gray-500">비하인드 스토리</h3>
                  {currentTrack.bio?.trim() ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {currentTrack.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">아직 등록된 이야기가 없습니다.</p>
                  )}
                </section>

                <section className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-gray-500">링크</h3>
                  {links.length ? (
                    <div className="flex flex-wrap gap-2">
                      {links.map((link, i) => {
                        const meta = linkMeta(link.platform);
                        const Icon = meta.Icon;
                        return (
                          <a
                            key={`${currentTrack.id}-${i}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
                            title={meta.label}
                            aria-label={meta.label}
                          >
                            {meta.image ? (
                              <img src={meta.image} alt={meta.label} className="h-5 w-5 object-contain" />
                            ) : Icon ? (
                              <Icon className={`h-5 w-5 ${meta.className ?? ""}`} />
                            ) : (
                              <FiExternalLink className="h-5 w-5 text-gray-600" />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">등록된 링크가 없습니다.</p>
                  )}
                </section>

                <section className="mt-8">
                  <h3 className="mb-4 text-sm font-semibold text-gray-500">가사</h3>
                  <div className="whitespace-pre-wrap text-[15px] leading-8 text-gray-900">
                    {currentTrack.lyrics?.trim() || "아직 등록된 가사가 없습니다."}
                  </div>
                </section>

                {children && (
                  <section className="mt-8 border-t border-gray-100 pt-6">
                    <h3 className="mb-4 text-sm font-semibold text-gray-500">댓글</h3>
                    {children(currentTrack)}
                  </section>
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
                  <span className="rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    {activeIndex + 1} / {tracks.length}
                  </span>
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
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
