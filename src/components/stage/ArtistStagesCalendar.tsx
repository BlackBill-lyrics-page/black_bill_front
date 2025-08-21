// components/stage/ArtistStagesCalendar.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { supabase } from "../../lib/supabaseClient";
import UploadAndEditStageModal from "./UploadAndEditStageModal";
import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";

dayjs.extend(utc);
dayjs.extend(tz);

type StageRow = {
  id: number;
  title: string | null;
  start_at: string;           // UTC ISO
  end_at: string;             // UTC ISO (DB 트리거 계산)
  duration_hours: number;
  promotion_url: string | null;
  album_id: number;
  albumname?: string | null;  // join
  venue?: {
    id?: number;
    name: string | null;
    road_address: string | null;
    formatted_address: string | null;
  } | null;
  address_detail?: string | null;
};

export default function ArtistStagesCalendar({
  artistId,
  onRequestCreate,
  mode = "owner",
  canEdit = mode === "owner",
  onItemClick,
}: {
  artistId: number;
  onRequestCreate?: (dateStr: string) => void;
  mode?: "owner" | "viewer";
  canEdit?: boolean;
  onItemClick?: (s: StageRow) => void;
}) {
  const [cursor, setCursor] = useState(dayjs().tz("Asia/Seoul").startOf("month"));
  const [selectedDate, setSelectedDate] = useState(
    dayjs().tz("Asia/Seoul").format("YYYY-MM-DD")
  );

  const [reloadKey, setReloadKey] = useState(0);

  const range = useMemo(() => {
    const startKst = cursor.clone().startOf("month");
    const endKst = cursor.clone().endOf("month");
    return {
      fromUtc: startKst.utc().toISOString(),
      toUtc: endKst.endOf("day").utc().toISOString(),
      startKst,
      endKst,
    };
  }, [cursor]);

  const [monthStages, setMonthStages] = useState<StageRow[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [errMonth, setErrMonth] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { submitting, handleDelete: vmDelete } = useUploadStageVM({
    albumId: 0,
    artistId,
  });

  const handleRowClick = (s: StageRow) => {
    if (canEdit) openEdit(s);
    else onItemClick?.(s);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingMonth(true);
      setErrMonth(null);
      try {
        const { data, error } = await supabase
          .from("stage_info")
          .select(`
            id, title, start_at, end_at, duration_hours, promotion_url, album_id, address_detail,
            venue:venue_id ( id, name, road_address, formatted_address ),
            albums:album_id ( albumname, artist_id )
          `)
          .gte("start_at", range.fromUtc)
          .lte("start_at", range.toUtc)
          .order("start_at", { ascending: true });

        if (error) throw error;

        const rows = (data ?? [])
          .filter((r: any) => r.albums?.artist_id === artistId)
          .map((r: any) => ({
            id: Number(r.id),
            title: r.title ?? null,
            start_at: String(r.start_at),
            end_at: String(r.end_at),
            duration_hours: Number(r.duration_hours),
            promotion_url: r.promotion_url ?? null,
            album_id: Number(r.album_id),
            albumname: r.albums?.albumname ?? null,
            address_detail: r.address_detail ?? null,
            venue: r.venue
              ? {
                  id: r.venue.id ?? undefined,
                  name: r.venue.name ?? null,
                  road_address: r.venue.road_address ?? null,
                  formatted_address: r.venue.formatted_address ?? null,
                }
              : null,
          })) as StageRow[];

        if (!alive) return;
        setMonthStages(rows);
      } catch (e: any) {
        if (!alive) return;
        setErrMonth(e?.message ?? "달력 데이터를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoadingMonth(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [artistId, range.fromUtc, range.toUtc, reloadKey]);

  const stagesByDay = useMemo(() => {
    const map = new Map<string, StageRow[]>();
    for (const s of monthStages) {
      const d = dayjs(s.start_at).tz("Asia/Seoul").format("YYYY-MM-DD");
      const arr = map.get(d) ?? [];
      arr.push(s);
      map.set(d, arr);
    }
    return map;
  }, [monthStages]);

  const daysMatrix = useMemo(() => buildMonthMatrix(cursor), [cursor]);
  const selectedList = stagesByDay.get(selectedDate) ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageRow | null>(null);

  const openEdit = (s: StageRow) => {
    setEditTarget(s);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    setReloadKey((k) => k + 1);
  };

  // 삭제 핸들러
  async function handleDelete(s: StageRow) {
    if (!canEdit) return;
    const ok = window.confirm(`'${s.title ?? s.albumname ?? "공연"}'을(를) 삭제할까요?`);
    if (!ok) return;

    try {
      setDeletingId(s.id);
      await vmDelete(s.id);
      setMonthStages((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e: any) {
      setErrMonth(e?.message ?? "공연 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더: 월 이동 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => setCursor((c) => c.clone().subtract(1, "month"))}
            aria-label="이전 달"
          >
            ‹
          </button>
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => setCursor(dayjs().tz("Asia/Seoul").startOf("month"))}
            title="이번 달로 이동"
          >
            {cursor.format("YYYY년 M월")}
          </button>
          <button
            className="px-3 py-2 rounded-xl border"
            onClick={() => setCursor((c) => c.clone().add(1, "month"))}
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        <div className="text-sm text-gray-600">{/* 필요 시 총 건수 */}</div>
      </div>

      {/* 달력 */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              {["일", "월", "화", "수", "목", "금", "토"].map((w) => ( // 일요일 시작
                <th key={w} className="py-2">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysMatrix.map((week, wi) => (
              <tr key={`w-${wi}`}>
                {week.map((cell, di) => {
                  const dStr = cell?.format("YYYY-MM-DD");
                  const isToday =
                    dStr === dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");
                  const isSelected = dStr === selectedDate;
                  const inMonth = !!cell && cell.month() === cursor.month();
                  const count = dStr ? stagesByDay.get(dStr)?.length ?? 0 : 0;

                  return (
                    <td key={dStr ?? `empty-${wi}-${di}`} className="align-top">
                      {cell ? (
                        <button
                          type="button"
                          // 🔧 변경: 날짜 클릭 시 '선택'만 수행 (생성 트리거 제거)
                          onClick={() => setSelectedDate(dStr!)}
                          className={[
                            "w-full h-20 p-2 text-left",
                            inMonth ? "" : "bg-gray-50",
                            isSelected ? "bg-black text-white" : "",
                            !isSelected && isToday ? "ring-1 ring-black/50" : "",
                          ].join(" ")}
                        >
                          <div className="text-sm">{cell.date()}</div>
                          {count > 0 && (
                            <div className="mt-1 text-xs opacity-80">
                              공연 {count}건
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="h-20 bg-gray-50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상태 */}
      {loadingMonth && (
        <div className="text-sm text-gray-500">달력 데이터를 불러오는 중…</div>
      )}
      {errMonth && <div className="text-sm text-red-600">{errMonth}</div>}

      {/* 선택된 날짜의 공연 리스트 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">
            {dayjs(selectedDate).format("YYYY.MM.DD (ddd)")} 공연
          </h4>
        </div>

        {selectedList.length === 0 ? (
          <div className="text-sm text-gray-500">해당 날짜의 공연이 없습니다.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {selectedList.map((s) => {
              const startKst = dayjs(s.start_at).tz("Asia/Seoul");
              const endKst = dayjs(s.end_at).tz("Asia/Seoul");
              const timeLabel = `${startKst.format("HH:mm")} - ${endKst.format(
                "HH:mm"
              )}`;
              const place =
                s.venue?.name ??
                s.venue?.road_address ??
                s.venue?.formatted_address ??
                "장소 미정";

              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between border rounded-2xl p-3 hover:bg-gray-50"
                >
                  {/* 왼쪽: 정보 (클릭 시 수정/상세) */}
                  <button
                    type="button"
                    className="min-w-0 text-left flex-1 cursor-pointer"
                    onClick={() => handleRowClick(s)}
                    title={canEdit ? "클릭하여 수정" : "상세 보기"}
                  >
                    <div className="text-sm text-gray-600">{place}</div>
                    <div className="font-medium truncate">
                      {s.albumname ?? "가사집"}
                    </div>
                    <div className="text-sm text-gray-600">{timeLabel}</div>
                  </button>

                  {/* 오른쪽: 삭제 (오너만) */}
                  {canEdit && (
                    <button
                      type="button"
                      className="ml-3 shrink-0 px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation(); // 수정 클릭과 충돌 방지
                        void handleDelete(s);
                      }}
                      disabled={deletingId === s.id || submitting}
                      aria-label="공연 삭제"
                      title="공연 삭제"
                    >
                      {deletingId === s.id ? "삭제중..." : "삭제"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 수정 모달 (오너만) */}
      {canEdit && editOpen && editTarget && (
        <UploadAndEditStageModal
          open={editOpen}
          onClose={closeEdit}
          mode="edit"
          albumId={editTarget.album_id}
          artistId={artistId}
          initialStage={{
            id: editTarget.id,
            title: editTarget.title ?? undefined,
            start_at: editTarget.start_at,
            duration_hours: editTarget.duration_hours,
            promotion_url: editTarget.promotion_url ?? undefined,
            address_detail: editTarget.address_detail ?? undefined,
            venue: editTarget.venue
              ? {
                  id: editTarget.venue.id ?? 0,
                  name: editTarget.venue.name ?? "",
                  road_address: editTarget.venue.road_address,
                  formatted_address: editTarget.venue.formatted_address,
                }
              : null,
          }}
        />
      )}
    </div>
  );
}

/** 월 시작을 '일요일'로 맞춘 6x7 매트릭스 생성 (빈칸은 null) */
function buildMonthMatrix(baseMonth: dayjs.Dayjs) {
  const start = baseMonth.startOf("month");
  const end = baseMonth.endOf("month");

  // 일요일 시작: 0=일 ~ 6=토
  const lead = start.day();

  const daysInMonth = end.date();
  const cells: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(start.date(d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const rows: (dayjs.Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}
