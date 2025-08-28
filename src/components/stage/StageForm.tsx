import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import { supabase } from "../../lib/supabaseClient";
import VenueSearchModal from "../venue/VenueSearchModal";

export type StageFormValues = {
  // title은 선택값으로만 유지(입력칸 없음)
  title?: string;
  date: string;
  time: string;
  duration_hours: number;
  venue: KakaoPlace | null;
  promotion_url?: string;
  address_detail?: string;
  album_id: number;
};

export type StageFormProps = {
  mode: "create" | "edit";
  artistId: number;
  initial?: Partial<StageFormValues>;
  onSubmit: (values: StageFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  onClickAddAlbum?: () => void;
  onDatePrettyChange?: (pretty: string) => void;
  /** ✅ 새 가사집 생성/수정 후 목록 재조회 트리거 */
  refreshAlbumsSignal?: number;
};

type AlbumLite = {
  id: number;
  albumname: string | null;
  is_public?: boolean | null;
  photo_url?: string | null;
  artist_id: number;
};

function isHalfHourStep(h: number) {
  return Number.isInteger(h * 2);
}

export default function StageForm({
  mode,
  artistId,
  initial,
  onSubmit,
  onCancel,
  submitting,
  onClickAddAlbum,
  onDatePrettyChange,
  refreshAlbumsSignal = 0,
}: StageFormProps) {
  // 공연 제목 state 제거 (입력칸 없음)
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [duration, setDuration] = useState<number>(
    typeof initial?.duration_hours === "number" ? initial!.duration_hours : 1.0
  );
  const [venue, setVenue] = useState<KakaoPlace | null>(initial?.venue ?? null);
  const [promotionUrl, setPromotionUrl] = useState(initial?.promotion_url ?? "");
  const [addressDetail, setAddressDetail] = useState(initial?.address_detail ?? "");
  const [albumId, setAlbumId] = useState<number>(initial?.album_id ?? 0);

  const [albums, setAlbums] = useState<AlbumLite[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsErr, setAlbumsErr] = useState<string | null>(null);

  const [placeModalOpen, setPlaceModalOpen] = useState(false);

  // ✅ 앨범 목록 로드 (새 앨범 생성/수정 시 refreshAlbumsSignal 변경에 반응)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAlbumsLoading(true);
        setAlbumsErr(null);
        const { data, error } = await supabase
          .from("albums")
          .select("id, albumname, is_public, photo_url, artist_id")
          .eq("artist_id", artistId)
          .order("id", { ascending: false });
        if (error) throw error;
        if (!alive) return;
        const list = (data ?? []) as AlbumLite[];
        setAlbums(list);

        // 초기 선택값이 없으면 최신 앨범을 기본 선택
        if (!initial?.album_id && list.length > 0 && !albumId) {
          setAlbumId(list[0].id);
        }
      } catch (e: any) {
        if (!alive) return;
        setAlbumsErr(e?.message ?? "가사집 목록을 불러오지 못했습니다.");
      } finally {
        if (alive) setAlbumsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [artistId, initial?.album_id, refreshAlbumsSignal]); // ✅ 신호 반영

  // ✅ 부모가 initial을 바꿔줄 수 있으므로 동기화 유지
  useEffect(() => {
    setDate(initial?.date ?? "");
    setTime(initial?.time ?? "");
    setDuration(typeof initial?.duration_hours === "number" ? initial!.duration_hours : 1.0);
    setVenue(initial?.venue ?? null);
    setPromotionUrl(initial?.promotion_url ?? "");
    setAddressDetail(initial?.address_detail ?? "");
    if (typeof initial?.album_id === "number") setAlbumId(initial.album_id);
  }, [initial]);

  useEffect(() => {
    if (!date) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
    }
    if (!time) setTime("19:30");
  }, []);

  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setErr(null);
  }, [date, time, duration, venue, promotionUrl, addressDetail, albumId]);

  const durationError = useMemo(() => {
    if (!(duration > 0 && duration <= 8)) return "공연 길이는 0보다 크고 8 이하이어야 합니다.";
    if (!isHalfHourStep(duration)) return "공연 길이는 0.5 단위여야 합니다.";
    return null;
  }, [duration]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (durationError) return setErr(durationError);
      if (!date || !time) return setErr("날짜와 시간을 입력해주세요.");
      if (!venue) return setErr("공연 장소를 선택해주세요.");
      if (!albumId) return setErr("가사집을 선택해주세요.");
      onSubmit({
        // title은 전달하지 않음(또는 undefined)
        date,
        time,
        duration_hours: duration,
        venue,
        promotion_url: promotionUrl.trim() || undefined,
        address_detail: addressDetail.trim() || undefined,
        album_id: albumId,
      });
    },
    [date, time, duration, venue, promotionUrl, addressDetail, durationError, onSubmit, albumId]
  );

  const canNext = !!date && !!time && !!venue && !!albumId && !durationError;
  const datePretty = useMemo(() => (date ? dayjs(date).format("YYYY. MM. DD") : ""), [date]);

  useEffect(() => {
    onDatePrettyChange?.(datePretty);
  }, [datePretty, onDatePrettyChange]);

  const venueText =
    venue?.place_name || venue?.road_address_name || venue?.address_name || "";

  return (
    <>
      {/* 상단 내부 타이틀/날짜는 제거 → 모달 헤더에서만 표시 */}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section className="rounded-3xl border border-gray-200 p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">공연 일자*</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">시작 시간*</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">공연 길이(시간)*</span>
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={8}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
              {durationError && <span className="text-xs text-red-600">{durationError}</span>}
            </label>
          </div>
        </section>

        {/* 공연 장소 */}
        <section className="rounded-3xl border border-gray-200 p-4 bg-white">
          <div className="mb-2 text-sm font-semibold text-gray-700">공연 장소*</div>
          <div className="grid gap-3">
            <input
              type="text"
              value={venueText}
              onClick={() => setPlaceModalOpen(true)}
              readOnly
              placeholder="장소 검색하기"
              className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세 정보 (예. 9번 출구 앞)"
              className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </section>

        {/* 공연 가사집 */}
        <section className="rounded-3xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-700">공연 가사집*</div>
            <button
              type="button"
              onClick={() =>
                onClickAddAlbum ? onClickAddAlbum() : alert("가사집 추가 기능 연결 필요")
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm hover:bg-black/90"
            >
              가사집 추가하기 +
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">공연할 때 사용할 가사집을 선택해주세요</p>

          {albumsLoading ? (
            <div className="text-sm text-gray-500">가사집 불러오는 중…</div>
          ) : albumsErr ? (
            <div className="text-sm text-red-600">{albumsErr}</div>
          ) : albums.length === 0 ? (
            <div className="text-sm text-gray-500">등록된 가사집이 없습니다.</div>
          ) : (
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {albums.map((a) => {
                const selected = albumId === a.id;
                return (
                  <li key={a.id}>
                    <label
                      className={[
                        "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors",
                        selected
                          ? "border-gray-900 bg-gray-50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]"
                          : "border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="album"
                        value={a.id}
                        checked={selected}
                        onChange={() => setAlbumId(a.id)}
                        className="accent-black"
                      />
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 grid place-items-center shrink-0">
                        {a.photo_url ? (
                          <img
                            src={a.photo_url}
                            alt={a.albumname ?? "앨범"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {a.albumname ?? "가사집 제목"}
                          </span>
                          {!a.is_public && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                              비공개
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">(아티스트)</div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 기타 */}
        <section className="rounded-3xl border border-gray-200 p-4 bg-white">
          <label className="flex flex-col gap-1 w-full">
            <span className="text-sm font-semibold text-gray-700">공연 일정 관련 sns링크(선택)</span>
            <input
              type="url"
              value={promotionUrl}
              onChange={(e) => setPromotionUrl(e.target.value)}
              placeholder="https://www.instagram.com/"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>
        </section>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-60"
              disabled={!!submitting}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] px-4 py-3 rounded-2xl bg-gray-900 text-white disabled:opacity-30"
            disabled={!!submitting || !canNext}
          >
            저장
          </button>
        </div>
      </form>

      {/* 장소 찾기 모달 */}
      {placeModalOpen && (
        <VenueSearchModal
          open={placeModalOpen}
          onClose={() => setPlaceModalOpen(false)}
          onSelect={(kakaoPlace) => {
            setVenue(kakaoPlace);
            setPlaceModalOpen(false);
          }}
          initial={venue ?? undefined}
        />
      )}
    </>
  );
}
