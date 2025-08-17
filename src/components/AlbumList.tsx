// AlbumsList.tsx
// MyArtistPage에서 아티스트가 업로드한 "가사집(앨범)" 리스트를 보여주는 컴포넌트

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUploadAlbumsVM } from "../viewmodels/useUploadAlbumsVM";

// 화면(UI)에서 쓸 가벼운 타입 (외부 파일 의존 X)
export type UIAlbum = {
  id: string;
  name: string;                 // albums.albumname
  photoUrl?: string | null;     // albums.photo_url
  createdAt?: string | null;    // albums.created_at
};

export default function AlbumsList({
  artistId,
  onEdit,
  readOnly =true,
}: {
  artistId: string | number;
  onEdit?: (album: UIAlbum) => void; // 수정 버튼 클릭 시 부모(MyArtistPage)에서 모달 열도록
  readOnly?: boolean;
}) {
  const [albums, setAlbums] = useState<UIAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ── Row 전용 액션: 삭제/수정 버튼 묶음 ─────────────────────────────
  function RowActions({
    item,
    artistId,
    onEdit,
    onDeleted,
    readOnly,
  }: {
    item: UIAlbum;
    artistId: number | string;
    onEdit?: (album: UIAlbum) => void;
    onDeleted: (id: string) => void;
    readOnly?: boolean;
  }) {
    // 앨범 삭제/상세 로드를 위해 VM 사용
    const vm = useUploadAlbumsVM();
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
      // 삭제/수정 동작에 대비해 행 마운트 시점에 편집 모드 초기화
      if (artistId && item.id) {
        vm.initEdit(Number(artistId), Number(item.id));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artistId, item.id]);

    const handleDelete = async () => {
      if (readOnly) return;
      if (!confirm(`정말로 "${item.name || "제목 없음"}" 가사집을 삭제하시겠습니까?`)) return;
      try {
        setDeleting(true);
        await vm.removeAlbum();         // FK cascade로 album_songs 자동 정리됨
        onDeleted(item.id);             // UI에서 제거
      } finally {
        setDeleting(false);
      }
    };

    if (readOnly) return null;

    return (
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
            disabled={vm.submitting || deleting}
          >
            수정
          </button>
        )}
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-sm rounded border text-red-600 hover:bg-red-50"
          disabled={vm.submitting || deleting}
          title="이 가사집을 삭제합니다"
        >
          {vm.submitting || deleting ? "삭제 중…" : "삭제"}
        </button>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!artistId) return;
      setLoading(true);
      setErr(null);

      // ⬇⬇ DB 컬럼명 기준으로 조회
      const { data, error } = await supabase
        .from("albums")
        .select("id, albumname, photo_url, created_at, artist_id")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setErr(error.message);
      } else {
        const mapped: UIAlbum[] = (data || []).map((r: any) => ({
          id: String(r.id),
          name: r.albumname ?? "",
          photoUrl: r.photo_url ?? null,
          createdAt: r.created_at ?? null,
        }));
        setAlbums(mapped);
      }
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [artistId]);

  if (loading) return <div className="py-6 text-sm text-gray-500">불러오는 중…</div>;
  if (err) return <div className="py-6 text-sm text-red-500">{err}</div>;
  if (albums.length === 0) return <div className="py-6 text-sm text-gray-400">아직 등록된 가사집이 없어요.</div>;

  return (
    <ul className="mt-4 grid gap-3">
      {albums.map((a) => (
        <li key={a.id} className="flex items-center justify-between border rounded-lg p-3">
          {/* 왼쪽: 사진 + 이름/날짜 */}
          <div className="flex items-center min-w-0 gap-3">
            {a.photoUrl && (
              <img
                src={a.photoUrl}
                alt={a.name || "cover"}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{a.name || "(제목 없음)"}</div>
              {a.createdAt && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 수정/삭제 버튼 */}
          {!readOnly && (
            <RowActions
              item={a}
              artistId={artistId}
              onEdit={onEdit}
              onDeleted={(id) => setAlbums((prev) => prev.filter((x) => x.id !== id))}
              readOnly={readOnly}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
