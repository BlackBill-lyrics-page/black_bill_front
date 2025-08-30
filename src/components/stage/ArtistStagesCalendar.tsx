// components/stage/ArtistStagesCalendar.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { supabase } from "../../lib/supabaseClient";
import UploadAndEditStageModal from "./UploadAndEditStageModal";
import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";
import AlbumLikeButton from "../AlbumLikeButton";
import { useStageCommentVM } from "../../viewmodels/useStageCommentVM";
import TextareaAutosize from "react-textarea-autosize";
import { FiPlus, FiArrowUpRight } from "react-icons/fi";

dayjs.extend(utc);
dayjs.extend(tz);

// 체크무늬(공연 있는 날) 배경 — 오버레이 div에 바로 style로 넣어 사용
const CHECKER_BG: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%)",
    "linear-gradient(-45deg, rgba(0,0,0,0.06) 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.06) 75%)",
    "linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.06) 75%)",
  ].join(","),
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
  opacity: 0.8,
};

type StageRow = {
  id: number;
  title: string | null;
  start_at: string;           // UTC ISO
  end_at: string;             // UTC ISO
  duration_hours: number;
  promotion_url: string | null;
  album_id: number;
  albumname?: string | null;  // join
  artist_id: number;
  venue?: {
    id?: number;
    name: string | null;
    road_address: string | null;
    formatted_address: string | null;
  } | null;
  address_detail?: string | null;
};

type AlbumMeta = {
  id: number;
  name: string | null;
  photoUrl: string | null;
  commentCount: number;
};

export default function ArtistStagesCalendar({
  artistId,
  artistIds,
  artistName,
  artistNameMap,
  onRequestCreate,
  mode = "owner",
  canEdit = mode === "owner",
  onItemClick,
  initialDate,
  highlightStageId,
}: {
  artistId?: number;
  artistIds?: number[];
  artistName?: string;
  artistNameMap?: Record<number, string>;
  onRequestCreate?: (dateStr: string) => void;
  mode?: "owner" | "viewer";
  canEdit?: boolean;
  onItemClick?: (s: StageRow) => void;
  initialDate?: string;        // "YYYY-MM-DD" (KST 기준)
  highlightStageId?: number;   // 특정 stage 강조
}) {
  // 기준 월/선택 날짜
  // const [cursor, setCursor] = useState(dayjs().tz("Asia/Seoul").startOf("month"));
  // const [selectedDate, setSelectedDate] = useState(
  //   dayjs().tz("Asia/Seoul").format("YYYY-MM-DD")
  // );

  const initialKst = useMemo(() => {
    if (initialDate && dayjs(initialDate).isValid()) {
      // YYYY-MM-DD 로 들어오므로 KST로 간주
      return dayjs(initialDate).tz("Asia/Seoul");
    }
    return dayjs().tz("Asia/Seoul");
  }, [initialDate]);
  const [cursor, setCursor] = useState(initialKst.startOf("month"));
  const [selectedDate, setSelectedDate] = useState(initialKst.format("YYYY-MM-DD"));

  // NEW: initialDate가 바뀌면 달/선택일 동기화
  useEffect(() => {
    if (initialDate && dayjs(initialDate).isValid()) {
      const kst = dayjs(initialDate).tz("Asia/Seoul");
      setCursor(kst.startOf("month"));
      setSelectedDate(kst.format("YYYY-MM-DD"));
    }
  }, [initialDate]);




  // 재조회 트리거
  const [reloadKey, setReloadKey] = useState(0);

  // 현재 달 범위(KST) → UTC ISO
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
    artistId: artistId ?? 0,
  });



  // NEW: 하이라이트 스테이지 날짜로 선택/달 이동
  useEffect(() => {
    if (!highlightStageId) return;
    // 이번 달에 로드된 데이터 안에서만 찾는다.
    const target = monthStages.find(s => s.id === highlightStageId);
    if (!target) return;

    const kstStr = dayjs(target.start_at).tz("Asia/Seoul").format("YYYY-MM-DD");
    const kstMonth = dayjs(kstStr).tz("Asia/Seoul").startOf("month");

    // 다른 달이면 달 이동
    if (!kstMonth.isSame(cursor, "month")) {
      setCursor(kstMonth);
    }
    setSelectedDate(kstStr);
  }, [highlightStageId, monthStages]); // cursor는 내부에서 읽기만

  // 펼침 댓글 상태
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
  const {
    comments, count: stageCommentCount, addComment, deleteComment, loading: stageCmtLoading,
  } = useStageCommentVM(expandedStageId);
  const [cmtText, setCmtText] = useState("");
  const [cmtFile, setCmtFile] = useState<File | undefined>();
  const [cmtPreview, setCmtPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  useEffect(() => {
    if (!cmtFile) { setCmtPreview(null); return; }
    const url = URL.createObjectURL(cmtFile);
    setCmtPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cmtFile]);

  const handleRowClick = (s: StageRow) => {
    if (canEdit) openEdit(s);
    else onItemClick?.(s);
  };

  // 월간 스테이지 로드
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

        const idSet =
          artistIds && artistIds.length
            ? new Set(artistIds.map(Number))
            : artistId
              ? new Set([Number(artistId)])
              : null;

        const rows = (data ?? [])
          .filter((r: any) => (idSet ? idSet.has(Number(r.albums?.artist_id)) : true))
          .map((r: any) => ({
            id: Number(r.id),
            title: r.title ?? null,
            start_at: String(r.start_at),
            end_at: String(r.end_at),
            duration_hours: Number(r.duration_hours),
            promotion_url: r.promotion_url ?? null,
            album_id: Number(r.album_id),
            albumname: r.albums?.albumname ?? null,
            artist_id: Number(r.albums?.artist_id ?? 0),
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
    return () => { alive = false; };
  }, [artistId, artistIds?.join(","), range.fromUtc, range.toUtc, reloadKey]);

  // 날짜별 그룹
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

  // 수정 모달
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageRow | null>(null);
  const openEdit = (s: StageRow) => { setEditTarget(s); setEditOpen(true); };
  const closeEdit = () => { setEditOpen(false); setEditTarget(null); setReloadKey(k => k + 1); };

  // 앨범 메타 로드
  const [albumMetaMap, setAlbumMetaMap] = useState<Map<number, AlbumMeta>>(new Map());
  useEffect(() => {
    let alive = true;
    (async () => {
      const albumIds = Array.from(new Set(monthStages.map((s) => s.album_id)));
      if (!albumIds.length) { if (alive) setAlbumMetaMap(new Map()); return; }
      try {
        const { data: albumsRows, error: albumsErr } = await supabase
          .from("albums").select("id, albumname, photo_url").in("id", albumIds);
        if (albumsErr) throw albumsErr;

        const { data: stagesRows, error: stagesErr } = await supabase
          .from("stage_info").select("id, album_id").in("album_id", albumIds);
        if (stagesErr) throw stagesErr;

        const stageToAlbum = new Map<number, number>();
        (stagesRows ?? []).forEach((s: any) => stageToAlbum.set(Number(s.id), Number(s.album_id)));
        const stageIds = (stagesRows ?? []).map((s: any) => Number(s.id));

        let commentByAlbum: Record<number, number> = {};
        if (stageIds.length) {
          const { data: cRows, error: cErr } = await supabase
            .from("stage_comments").select("stage_id").in("stage_id", stageIds);
          if (cErr) throw cErr;
          (cRows ?? []).forEach((c: any) => {
            const aid = stageToAlbum.get(Number(c.stage_id));
            if (aid != null) commentByAlbum[aid] = (commentByAlbum[aid] ?? 0) + 1;
          });
        }

        const map = new Map<number, AlbumMeta>();
        (albumsRows ?? []).forEach((a: any) => {
          const id = Number(a.id);
          map.set(id, {
            id,
            name: a.albumname ?? null,
            photoUrl: a.photo_url ?? null,
            commentCount: commentByAlbum[id] ?? 0,
          });
        });

        if (alive) setAlbumMetaMap(map);
      } catch (e) {
        console.error("[album meta load error]", e);
        if (alive) setAlbumMetaMap(new Map());
      }
    })();
    return () => { alive = false; };
  }, [monthStages]);

  // 삭제
  async function handleDelete(s: StageRow) {
    if (!canEdit) return;
    const ok = window.confirm(`'${s.title ?? s.albumname ?? "공연"}'을(를) 삭제할까요?`);
    if (!ok) return;
    try {
      setDeletingId(s.id);
      await vmDelete(s.id);
      setMonthStages(prev => prev.filter(x => x.id !== s.id));
      if (expandedStageId === s.id) setExpandedStageId(null);
    } catch (e: any) {
      setErrMonth(e?.message ?? "공연 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  const handleSubmitStageComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedStageId) return;
    if (!cmtText.trim() && !cmtFile) return;
    await addComment(cmtText, cmtFile);
    setCmtText(""); setCmtFile(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더: 월 이동 (무드톤) */}
      <div className="flex items-center justify-between px-1">
        <button
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
          onClick={() => setCursor((c) => c.clone().subtract(1, "month"))}
          aria-label="이전 달"
        >‹</button>
        <div className="text-lg font-medium">{cursor.format("YYYY년 M월")}</div>
        <button
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
          onClick={() => setCursor((c) => c.clone().add(1, "month"))}
          aria-label="다음 달"
        >›</button>
      </div>

      {/* 달력 */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="text-sm text-gray-400">
            <tr>
              {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
                <th key={w} className="py-2 font-normal">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysMatrix.map((week, wi) => (
              <tr key={`w-${wi}`}>
                {week.map((cell, di) => {
                  const dStr = cell?.format("YYYY-MM-DD");
                  const todayStr = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");
                  const isToday = dStr === todayStr;
                  const isSelected = dStr === selectedDate;
                  const inMonth = !!cell && cell.month() === cursor.month();
                  const count = dStr ? stagesByDay.get(dStr)?.length ?? 0 : 0;
                  const hasHighlighted =
                    !!dStr && !!highlightStageId &&
                    (stagesByDay.get(dStr)?.some(s => s.id === highlightStageId) ?? false);

                  return (
                    <td key={dStr ?? `empty-${wi}-${di}`} className="align-top">
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(dStr!)}
                          className={[
                            "relative overflow-hidden w-full h-16 sm:h-20 p-2 text-left rounded-xl transition",
                            inMonth ? "" : "bg-gray-50 text-gray-300",
                            isSelected ? "bg-gray-900 text-white" : "",
                            !isSelected && isToday ? "ring-1 ring-gray-400/40" : "",
                            !isSelected && hasHighlighted ? "ring-2 ring-gray-800/60" : "",
                          ].join(" ")}
                        >
                          {/* 공연 있는 날 체크무늬 오버레이 */}
                          {count > 0 && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={CHECKER_BG}
                            />
                          )}
                          <div className="relative z-10 text-sm">{cell.date()}</div>
                          {count > 0 && !isSelected && (
                            <div className="relative z-10 mt-1 text-[11px] opacity-70">
                              공연 {count}건
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="h-16 sm:h-20 bg-gray-50" />
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
      {loadingMonth && <div className="text-sm text-gray-500">달력 데이터를 불러오는 중…</div>}
      {errMonth && <div className="text-sm text-red-600">{errMonth}</div>}

      {/* 선택된 날짜의 공연 리스트 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{dayjs(selectedDate).format("YYYY.MM.DD (ddd)")} 공연</h4>
          {canEdit && onRequestCreate && (
            <button
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => onRequestCreate(selectedDate)}
            >
              무대 추가 +
            </button>
          )}
        </div>

        {selectedList.length === 0 ? (
          <div className="text-sm text-gray-500">해당 날짜의 공연이 없습니다.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {selectedList.map((s) => {
              const startKst = dayjs(s.start_at).tz("Asia/Seoul");
              const endKst = dayjs(s.end_at).tz("Asia/Seoul");
              const timeLabel = `${startKst.format("HH:mm")} - ${endKst.format("HH:mm")}`;
              const place =
                s.venue?.name ??
                s.venue?.road_address ??
                s.venue?.formatted_address ??
                "장소 미정";

              const meta = albumMetaMap.get(s.album_id);
              const isExpanded = expandedStageId === s.id;
              const artistLabel =
                artistName ??
                (artistNameMap ? artistNameMap[s.artist_id] : undefined) ??
                "아티스트";

              return (
                <li key={s.id} className="border rounded-2xl">
                  {/* 상단 행 */}
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <button
                      type="button"
                      className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                      onClick={() => handleRowClick(s)}
                      title={canEdit ? "클릭하여 수정" : "상세 보기"}
                    >
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {meta?.photoUrl ? (
                          <img src={meta.photoUrl} alt={meta.name ?? "album"} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600">{place}</div>
                        <div className="font-medium truncate">{meta?.name ?? s.albumname ?? "가사집 제목"}</div>
                        <div className="text-xs text-gray-500 truncate">{artistLabel}</div>
                      </div>
                    </button>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-sm text-gray-600">{timeLabel}</div>
                      <AlbumLikeButton mode="vm" albumId={s.album_id} showCount size="md" />
                      <button
                        type="button"
                        className="px-2 py-1 text-sm rounded-lg border hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = isExpanded ? null : s.id;
                          setExpandedStageId(next);
                          setCmtText("");
                          setCmtFile(undefined);
                        }}
                        title="댓글 보기/숨기기"
                      >
                        댓글 {isExpanded ? (stageCommentCount ?? 0) : (meta?.commentCount ?? 0)}
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          className="ml-2 px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={(e) => { e.stopPropagation(); void handleDelete(s); }}
                          disabled={deletingId === s.id || submitting}
                          aria-label="공연 삭제"
                          title="공연 삭제"
                        >
                          {deletingId === s.id ? "삭제중..." : "삭제"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 댓글 패널 */}
                  {isExpanded && (
                    <div className="px-3 pb-4">
                      {stageCmtLoading ? (
                        <div className="text-sm text-gray-500 px-1">댓글 불러오는 중…</div>
                      ) : comments.length === 0 ? (
                        <div className="text-sm text-gray-500 px-1">아직 댓글이 없습니다.</div>
                      ) : (
                        <ul className="space-y-3 mt-2">
                          {comments.map((c) => (
                            <li key={c.id} className="border-b pb-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={c.users?.photo_url || "/default-avatar.png"}
                                    alt={c.users?.username || "user"}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <span className="text-sm font-medium text-gray-800">
                                    {c.users?.username ?? ""}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">{c.updated_at}</span>
                              </div>

                              {c.photo_url && (
                                <div className="mt-2">
                                  <img src={c.photo_url} alt="첨부 이미지" className="max-h-64 rounded-lg border object-contain" />
                                </div>
                              )}

                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {c.content}
                              </div>

                              <button onClick={() => deleteComment(c.id)} className="text-xs text-gray-500 mt-2">
                                삭제
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <form
                        onSubmit={handleSubmitStageComment}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setDragOver(false);
                          const f = Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith("image/"));
                          if (f) setCmtFile(f);
                        }}
                        className={`mt-3 flex items-center gap-2 bg-white border rounded-3xl px-1 ${dragOver ? "ring-2 ring-gray-300" : ""}`}
                      >
                        <label className="mx-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer">
                          <FiPlus className="w-5 h-5" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setCmtFile(e.target.files?.[0])} />
                        </label>

                        {cmtPreview && (
                          <div className="relative ml-1 shrink-0">
                            <img src={cmtPreview} alt="preview" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                            <button
                              type="button"
                              onClick={() => setCmtFile(undefined)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] leading-none"
                              aria-label="미리보기 제거"
                              title="미리보기 제거"
                            >
                              ×
                            </button>
                          </div>
                        )}

                        <TextareaAutosize
                          value={cmtText}
                          onChange={(e) => setCmtText(e.target.value)}
                          placeholder="이미지를 드래그, 또는 댓글을 작성해주세요."
                          className="flex-1 rounded px-3 py-2 text-sm"
                          minRows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              (e.currentTarget.form as HTMLFormElement).requestSubmit();
                            }
                          }}
                        />
                        <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1 ">
                          <FiArrowUpRight className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canEdit && editOpen && editTarget && (
        <UploadAndEditStageModal
          open={editOpen}
          onClose={closeEdit}
          mode="edit"
          albumId={editTarget.album_id}
          artistId={artistId!}
          initialStage={{
            id: editTarget.id,
            start_at: editTarget.start_at,
            duration_hours: editTarget.duration_hours,
            promotion_url: editTarget.promotion_url ?? undefined,
            address_detail: editTarget.address_detail ?? undefined,
            album_id: editTarget.album_id,
            venue: editTarget.venue ? {
              id: editTarget.venue.id ?? 0,
              name: editTarget.venue.name ?? "",
              road_address: editTarget.venue.road_address,
              formatted_address: editTarget.venue.formatted_address,
            } : null,
          }}
        />
      )}
    </div>
  );
}

/** '일요일' 시작 6x7 매트릭스 (빈칸은 null) */
function buildMonthMatrix(baseMonth: dayjs.Dayjs) {
  const start = baseMonth.startOf("month");
  const end = baseMonth.endOf("month");
  const lead = start.day(); // 0=일 ~ 6=토
  const daysInMonth = end.date();

  const cells: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(start.date(d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const rows: (dayjs.Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
