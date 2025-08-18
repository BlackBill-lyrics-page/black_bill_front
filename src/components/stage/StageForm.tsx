// components/stage/StageForm.tsx
// ------------------------------------------------------------------
// (무대 등록/수정에서 공통으로 쓰이는 입력 폼)
// ------------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { KakaoPlace } from "../../hooks/stage/stageService";
import VenueAutocomplete from "../venue/VenueAutoComplete";
import { supabase } from "../../lib/supabaseClient";

export type StageFormValues = {
  title: string;
  date: string;           // YYYY-MM-DD (Asia/Seoul)
  time: string;           // HH:mm (24h, Asia/Seoul)
  duration_hours: number; // 0.5 단위
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
};

type AlbumLite = {
  id: number;
  albumname: string | null;
  is_public?: boolean | null;
  cover_url?: string | null;
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

  // ✅ albums 목록 + 선택 상태
  const [albumId, setAlbumId] = useState<number>(initial?.album_id ?? 0);
  const [albums, setAlbums] = useState<AlbumLite[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsErr, setAlbumsErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setAlbumsLoading(true);
      setAlbumsErr(null);
      try {
        const { data, error } = await supabase
          .from("albums")
          .select("id, albumname, is_public, photo_url, artist_id")
          .eq("artist_id", artistId)
          .order("id", { ascending: false });

        if (error) throw error;
        if (!alive) return;

        const list = (data ?? []) as AlbumLite[];
        setAlbums(list);

        // 초기값 없으면 첫 앨범 선택
        if (!initial?.album_id && list.length > 0) {
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
  }, [artistId, initial?.album_id]);

  // ✅ initial 변경 시 상태 리셋
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
    if (typeof initial?.album_id === "number") {
      setAlbumId(initial.album_id);
    }
  }, [initial]);

  // date/time 기본값 자동 세팅
  useEffect(() => {
    if (!date) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
    }
    if (!time) {
      setTime("19:30");
    }
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
      if (durationError) {
        setErr(durationError);
        return;
      }
      if (!date || !time) {
        setErr("날짜와 시간을 입력해주세요.");
        return;
      }
      if (!venue) {
        setErr("공연 장소를 선택해주세요.");
        return;
      }
      if (!albumId) {
        setErr("가사집을 선택해주세요.");
        return;
      }
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

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">제목 (선택)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공연 제목"
            className="border rounded-xl px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">공연 일자*</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-xl px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">시작 시간*</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border rounded-xl px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">공연 길이(시간)*</span>
          <input
            type="number"
            step={0.5}
            min={0.5}
            max={8}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border rounded-xl px-3 py-2"
            required
          />
          {durationError && <span className="text-xs text-red-600">{durationError}</span>}
        </label>
      </div>

      {/* 장소 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">장소 선택*</span>
        <VenueAutocomplete
          value={venue}
          onChange={(p) => setVenue(p)}
          placeholder="장소명/주소 (예: 롤링홀, 홍대입구역)"
        />
      </div>

      {/* 가사집 선택 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">공연 가사집 선택*</span>
        {albumsLoading ? (
          <div className="text-sm text-gray-500">가사집 불러오는 중…</div>
        ) : albumsErr ? (
          <div className="text-sm text-red-600">{albumsErr}</div>
        ) : albums.length === 0 ? (
          <div className="text-sm text-gray-500">등록된 가사집이 없습니다.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {albums.map((a) => (
              <li key={a.id}>
                <label className="flex items-center gap-3 p-2 rounded-xl border cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="album"
                    value={a.id}
                    checked={albumId === a.id}
                    onChange={() => setAlbumId(a.id)}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{a.albumname ?? "가사집"}</span>
                    <span className="text-xs text-gray-500">
                      {a.is_public ? "" : "비공개"}
                    </span>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">관련 SNS 링크(ex. 인스타그램 홍보 게시글, 있을 경우)</span>
          <input
            type="url"
            value={promotionUrl}
            onChange={(e) => setPromotionUrl(e.target.value)}
            placeholder="https://example.com/promo"
            className="border rounded-xl px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">상세 주소</span>
          <input
            type="text"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="층/호수/비고 등"
            className="border rounded-xl px-3 py-2"
          />
        </label>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border"
            disabled={!!submitting}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-black text-white"
          disabled={!!submitting || !!durationError}
        >
          {mode === "create" ? "등록" : "수정"}
        </button>
      </div>
    </form>
  );
}