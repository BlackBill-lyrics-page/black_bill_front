// components/stage/StageForm.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import { supabase } from "../../lib/supabaseClient";
import VenueSearchModal from "../venue/VenueSearchModal"; // ★ NEW

export type StageFormValues = {
  title: string;
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
}: StageFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
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

  // ★ 장소 모달 on/off
  const [placeModalOpen, setPlaceModalOpen] = useState(false);

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
        if (!initial?.album_id && list.length > 0) setAlbumId(list[0].id);
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
  }, [artistId, initial?.album_id]);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDate(initial?.date ?? "");
    setTime(initial?.time ?? "");
    setDuration(
      typeof initial?.duration_hours === "number" ? initial!.duration_hours : 1.0
    );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setErr(null);
  }, [title, date, time, duration, venue, promotionUrl, addressDetail, albumId]);

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
        title: title.trim(),
        date,
        time,
        duration_hours: duration,
        venue,
        promotion_url: promotionUrl.trim() || undefined,
        address_detail: addressDetail.trim() || undefined,
        album_id: albumId,
      });
    },
    [title, date, time, duration, venue, promotionUrl, addressDetail, durationError, onSubmit, albumId]
  );

  const canNext = !!date && !!time && !!venue && !!albumId && !durationError;
  const datePretty = useMemo(() => (date ? dayjs(date).format("YYYY. MM. DD") : ""), [date]);

  // ★ 장소 입력칸에 표시될 텍스트
  const venueText =
    venue?.place_name || venue?.road_address_name || venue?.address_name || "";

  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="text-lg font-semibold">공연 추가하기</div>
        <div className="text-sm text-gray-500">{datePretty}</div>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section className="rounded-2xl border border-gray-200 p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">제목 (선택)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공연 제목"
                className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">공연 일자*</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">시작 시간*</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">공연 길이(시간)*</span>
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={8}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                required
              />
              {durationError && (
                <span className="text-xs text-red-600">{durationError}</span>
              )}
            </label>
          </div>
        </section>

        {/* 장소 : 입력칸 클릭 → 모달 */}
        <section className="rounded-2xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">공연 장소*</span>
          </div>

          {/* 클릭 영역 */}
          <div className="grid gap-3">
            <input
              type="text"
              value={venueText}
              onClick={() => setPlaceModalOpen(true)}
              readOnly
              placeholder="장소 검색하기"
              className="border rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세 정보 (예. 9번 출구 앞)"
              className="border rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </section>

        {/* 가사집 : 내부 스크롤 */}
        <section className="rounded-2xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">공연 가사집*</div>
            <button
              type="button"
              onClick={() =>
                onClickAddAlbum ? onClickAddAlbum() : alert("가사집 추가 기능 연결 필요")
              }
              className="px-3 py-1 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
            >
              가사집 추가하기 +
            </button>
          </div>

          {albumsLoading ? (
            <div className="text-sm text-gray-500">가사집 불러오는 중…</div>
          ) : albumsErr ? (
            <div className="text-sm text-red-600">{albumsErr}</div>
          ) : albums.length === 0 ? (
            <div className="text-sm text-gray-500">등록된 가사집이 없습니다.</div>
          ) : (
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1"> {/* ★ 스크롤 */}
              {albums.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="album"
                      value={a.id}
                      checked={albumId === a.id}
                      onChange={() => setAlbumId(a.id)}
                      className="accent-black"
                    />
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 grid place-items-center shrink-0">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt={a.albumname ?? "앨범"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{a.albumname ?? "가사집"}</span>
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
              ))}
            </ul>
          )}
        </section>

        {/* 기타 */}
        <section className="rounded-2xl border border-gray-200 p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">관련 SNS 링크(ex. 인스타그램 홍보 게시글, 있을 경우)</span>
              <input
                type="url"
                value={promotionUrl}
                onChange={(e) => setPromotionUrl(e.target.value)}
                placeholder="https://example.com/promo"
                className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>
          </div>
        </section>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border disabled:opacity-60"
              disabled={!!submitting}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] px-4 py-3 rounded-xl bg-black text-white disabled:opacity-30"
            disabled={!!submitting || !canNext}
          >
            다음
          </button>
        </div>
      </form>

      {/* 장소 찾기 모달 */}
      {placeModalOpen && (
        <VenueSearchModal
          open={placeModalOpen}
          onClose={() => setPlaceModalOpen(false)}
          onSelect={(freeTextPlace) => {
            setVenue(freeTextPlace);
            setPlaceModalOpen(false);
          }}
          initial={venue ?? undefined}
        />
      )}
    </>
  );
}
