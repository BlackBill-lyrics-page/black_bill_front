// components/stage/ArtistStagesCalendar.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { supabase } from "../../lib/supabaseClient";
import UploadAndEditStageModal from "./UploadAndEditStageModal";
import { useUploadStageVM } from "../../viewmodels/useUploadStageVM";
// ✅ 추가: 가사집 좋아요 버튼(내부에서 album_liked 사용)
import AlbumLikeButton from "../AlbumLikeButton";
// ✅ 추가: 무대 댓글 VM & 입력 UI
import { useStageCommentVM } from "../../viewmodels/useStageCommentVM";
import TextareaAutosize from "react-textarea-autosize";
import { FiPlus, FiArrowUpRight } from "react-icons/fi";

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

// 🔧 변경: 좋아요 카운트는 AlbumLikeButton이 처리 → 여기선 앨범 커버/제목과
//         "앨범 단위 총 댓글 수"만 요약으로 보여줌(행 접힘 상태에서 사용)
type AlbumMeta = {
  id: number;
  name: string | null;
  photoUrl: string | null;
  commentCount: number; // 해당 앨범의 모든 stage 댓글 총합
};

export default function ArtistStagesCalendar({
  artistId,
  artistName, // ✅ 추가: 리스트에 "(아티스트)" 텍스트 표기용(옵션)
  onRequestCreate,
  mode = "owner",
  canEdit = mode === "owner",
  onItemClick,
}: {
  artistId: number;
  artistName?: string;
  onRequestCreate?: (dateStr: string) => void;
  mode?: "owner" | "viewer";
  canEdit?: boolean;
  onItemClick?: (s: StageRow) => void;
}) {
  // 기준 월/선택 날짜
  const [cursor, setCursor] = useState(dayjs().tz("Asia/Seoul").startOf("month"));
  const [selectedDate, setSelectedDate] = useState(
    dayjs().tz("Asia/Seoul").format("YYYY-MM-DD")
  );

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

  // 삭제 진행 상태
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // VM: 생성/수정/삭제 공용(삭제는 albumId 불필요 → 0으로 전달)
  const { submitting, handleDelete: vmDelete } = useUploadStageVM({
    albumId: 0,
    artistId,
  });

  // ✅ 추가: 펼쳐둔(댓글 패널 오픈) 무대 id
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);

  // ✅ 추가: 펼친 무대의 댓글 VM
  const {
    comments,
    count: stageCommentCount,
    addComment,
    deleteComment,
    loading: stageCmtLoading,
  } = useStageCommentVM(expandedStageId);

  // ✅ 추가: 댓글 입력 상태(현재 펼친 무대에 귀속됨)
  const [cmtText, setCmtText] = useState("");
  const [cmtFile, setCmtFile] = useState<File | undefined>();
  const [cmtPreview, setCmtPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!cmtFile) {
      setCmtPreview(null);
      return;
    }
    const url = URL.createObjectURL(cmtFile);
    setCmtPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cmtFile]);

  // 🔧 변경: 리스트 아이템 클릭은 기존 동작 유지(오너면 수정 모달, 아니면 상위 onItemClick)
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

  const openEdit = (s: StageRow) => {
    setEditTarget(s);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    setReloadKey((k) => k + 1);
  };

  // ✅ 추가: 앨범 메타(커버, 앨범 단위 총 댓글수) 배치 로드
  const [albumMetaMap, setAlbumMetaMap] = useState<Map<number, AlbumMeta>>(new Map());

  useEffect(() => {
    let alive = true;
    (async () => {
      const albumIds = Array.from(new Set(monthStages.map((s) => s.album_id)));
      if (!albumIds.length) {
        if (alive) setAlbumMetaMap(new Map());
        return;
      }

      try {
        // 1) 앨범 기본 정보
        const { data: albumsRows, error: albumsErr } = await supabase
          .from("albums")
          .select("id, albumname, photo_url")
          .in("id", albumIds);
        if (albumsErr) throw albumsErr;

        // 2) 앨범들의 stage id 수집
        const { data: stagesRows, error: stagesErr } = await supabase
          .from("stage_info")
          .select("id, album_id")
          .in("album_id", albumIds);
        if (stagesErr) throw stagesErr;

        const stageToAlbum = new Map<number, number>();
        (stagesRows ?? []).forEach((s: any) => {
          stageToAlbum.set(Number(s.id), Number(s.album_id));
        });
        const stageIds = (stagesRows ?? []).map((s: any) => Number(s.id));

        // 3) stage_comments를 album_id로 합산
        let commentByAlbum: Record<number, number> = {};
        if (stageIds.length) {
          const { data: cRows, error: cErr } = await supabase
            .from("stage_comments")
            .select("stage_id")
            .in("stage_id", stageIds);
          if (cErr) throw cErr;

          (cRows ?? []).forEach((c: any) => {
            const aid = stageToAlbum.get(Number(c.stage_id));
            if (aid != null) {
              commentByAlbum[aid] = (commentByAlbum[aid] ?? 0) + 1;
            }
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
      } catch (e: any) {
        console.error("[album meta load error]", e);
        if (alive) setAlbumMetaMap(new Map());
      }
    })();

    return () => {
      alive = false;
    };
  }, [monthStages]);

  // 삭제
  async function handleDelete(s: StageRow) {
    if (!canEdit) return;
    const ok = window.confirm(`'${s.title ?? s.albumname ?? "공연"}'을(를) 삭제할까요?`);
    if (!ok) return;

    try {
      setDeletingId(s.id);
      await vmDelete(s.id);
      setMonthStages((prev) => prev.filter((x) => x.id !== s.id));
      if (expandedStageId === s.id) setExpandedStageId(null);
    } catch (e: any) {
      setErrMonth(e?.message ?? "공연 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  // ✅ 추가: 댓글 전송
  const handleSubmitStageComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedStageId) return;
    if (!cmtText.trim() && !cmtFile) return;
    await addComment(cmtText, cmtFile);
    setCmtText("");
    setCmtFile(undefined);
  };

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

        <div className="text-sm text-gray-600" />
      </div>

      {/* 달력 (❗주의: 일요일 시작) */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
                <th key={w} className="py-2">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysMatrix.map((week, wi) => (
              <tr key={`w-${wi}`}>
                {week.map((cell, di) => {
                  const dStr = cell?.format("YYYY-MM-DD");
                  const isToday = dStr === dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");
                  const isSelected = dStr === selectedDate;
                  const inMonth = !!cell && cell.month() === cursor.month();
                  const count = dStr ? stagesByDay.get(dStr)?.length ?? 0 : 0;

                  return (
                    <td key={dStr ?? `empty-${wi}-${di}`} className="align-top">
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(dStr!)} // 🔧 변경: 날짜 선택만(모달 X)
                          className={[
                            "w-full h-20 p-2 text-left",
                            inMonth ? "" : "bg-gray-50",
                            isSelected ? "bg-black text-white" : "",
                            !isSelected && isToday ? "ring-1 ring-black/50" : "",
                          ].join(" ")}
                        >
                          <div className="text-sm">{cell.date()}</div>
                          {count > 0 && (
                            <div className="mt-1 text-xs opacity-80">공연 {count}건</div>
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
      {loadingMonth && <div className="text-sm text-gray-500">달력 데이터를 불러오는 중…</div>}
      {errMonth && <div className="text-sm text-red-600">{errMonth}</div>}

      {/* 선택된 날짜의 공연 리스트 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{dayjs(selectedDate).format("YYYY.MM.DD (ddd)")} 공연</h4>
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

              return (
                <li key={s.id} className="border rounded-2xl">
                  {/* 상단 행 */}
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                    {/* 왼쪽(커버 + 텍스트들) */}
                    <button
                      type="button"
                      className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                      onClick={() => handleRowClick(s)}
                      title={canEdit ? "클릭하여 수정" : "상세 보기"}
                    >
                      {/* 커버 */}
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {meta?.photoUrl ? (
                          <img src={meta.photoUrl} alt={meta.name ?? "album"} className="w-full h-full object-cover" />
                        ) : null}
                      </div>

                      {/* 텍스트 */}
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600">{place}</div>
                        <div className="font-medium truncate">{meta?.name ?? s.albumname ?? "가사집 제목"}</div>
                        <div className="text-xs text-gray-500 truncate">{artistName ?? "아티스트"}</div>
                      </div>
                    </button>

                    {/* 오른쪽(시간 + 좋아요/댓글 + 삭제) */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-sm text-gray-600">{timeLabel}</div>

                      {/* ✅ 좋아요(가사집 단위) → album_liked 테이블 사용 */}
                      <AlbumLikeButton mode="vm" albumId={s.album_id} showCount size="md" />

                      {/* ✅ 댓글 버튼(무대 단위) : 접힘/펼침 토글 */}
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

                      {/* 오너 전용 삭제 */}
                      {canEdit && (
                        <button
                          type="button"
                          className="ml-2 px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(s);
                          }}
                          disabled={deletingId === s.id || submitting}
                          aria-label="공연 삭제"
                          title="공연 삭제"
                        >
                          {deletingId === s.id ? "삭제중..." : "삭제"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ✅ 댓글 패널 (펼친 경우) */}
                  {isExpanded && (
                    <div className="px-3 pb-4">
                      {/* 댓글 리스트 */}
                      {stageCmtLoading ? (
                        <div className="text-sm text-gray-500 px-1">댓글 불러오는 중…</div>
                      ) : comments.length === 0 ? (
                        <div className="text-sm text-gray-500 px-1">아직 댓글이 없습니다.</div>
                      ) : (
                        <ul className="space-y-3 mt-2">
                          {comments.map((c) => (
                            <li key={c.id} className="border-b pb-3">
                              {/* 헤더 */}
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

                              {/* 이미지 */}
                              {c.photo_url && (
                                <div className="mt-2">
                                  <img
                                    src={c.photo_url}
                                    alt="첨부 이미지"
                                    className="max-h-64 rounded-lg border object-contain"
                                  />
                                </div>
                              )}

                              {/* 본문 */}
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {c.content}
                              </div>

                              {/* 삭제(권한 검증은 VM 내부 정책에 따름) */}
                              <button
                                onClick={() => deleteComment(c.id)}
                                className="text-xs text-gray-500 mt-2"
                              >
                                삭제
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* 댓글 입력폼 */}
                      <form
                        onSubmit={handleSubmitStageComment}
                        onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
                        onDragLeave={()=>setDragOver(false)}
                        onDrop={(e)=>{
                          e.preventDefault(); setDragOver(false);
                          const f = Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith("image/"));
                          if (f) setCmtFile(f);
                        }}
                        className={`mt-3 flex items-center gap-2 bg-white border rounded-3xl px-1 ${dragOver ? "ring-2 ring-gray-300" : ""}`}
                      >
                        {/* 이미지 업로드 버튼 */}
                        <label className="mx-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white cursor-pointer">
                          <FiPlus className="w-5 h-5"/>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setCmtFile(e.target.files?.[0])}
                          />
                        </label>

                        {/* 미리보기 */}
                        {cmtPreview && (
                          <div className="relative ml-1 shrink-0">
                            <img
                              src={cmtPreview}
                              alt="preview"
                              className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                            />
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

                        {/* 입력창 */}
                        <TextareaAutosize
                          value={cmtText}
                          onChange={(e) => setCmtText(e.target.value)}
                          placeholder="이미지를 드래그, 또는 댓글을 작성해주세요."
                          className="flex-1 rounded px-3 py-2 text-sm"
                          minRows={1}
                          onKeyDown={(e)=>{
                            if (e.key === "Enter" && !e.shiftKey){
                              e.preventDefault();
                              (e.currentTarget.form as HTMLFormElement).requestSubmit();
                            }
                          }}
                        />
                        {/* 전송 */}
                        <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1 ">
                          <FiArrowUpRight className="w-5 h-5"/>
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

/** 🔧 변경: '일요일' 시작 6x7 매트릭스 (빈칸은 null) */
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
