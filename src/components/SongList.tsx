// MyArtistPage에서 아티스트가 업로드한 곡의 리스트를 보여주는 컴포넌트

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUploadSongsVM } from "../viewmodels/useUploadSongsVM";

// 화면(UI)에서 쓸 가벼운 타입 (외부 파일 의존 X)
export type UISong = {
    id: string;
    title: string;
    photoUrl?: string | null;
    createdAt?: string | null;
};

export default function SongList({
    artistId,
    onEdit,
}: {
    artistId: string | number;
    onEdit?: (song: UISong) => void;
}) {
    const [songs, setSongs] = useState<UISong[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // ── Row 전용 액션: 삭제/수정 버튼 묶음 ─────────────────────────────
    function RowActions({
        item,
        onEdit,
        onDeleted,
    }: {
        item: UISong;
        onEdit?: (song: UISong) => void;
        onDeleted: (id: string) => void;
    }) {
        // useUploadSongsVM은 최소 필드만 줘도 내부에서 보완 fetch 가능
        const vm = useUploadSongsVM({
            id: Number(item.id),
            artist_id: null,
            title: item.title,
            lyrics: "",
            bio: "",
            song_photo: item.photoUrl ?? "",
            created_at: item.createdAt ?? null,
            song_link: "",
            links: [],
        });

        const [deleting, setDeleting] = useState(false);

        const handleDelete = async () => {
            if (!confirm(`정말로 "${item.title || "제목 없음"}"을(를) 삭제하시겠습니까?`)) return;
            try {
                setDeleting(true);
                // 필요 시 이미지까지 삭제하고 싶다면 alsoRemovePhoto: true
                const ok = await vm.deleteCurrentSong?.({ alsoRemovePhoto: true });
                if (ok) onDeleted(item.id);
            } finally {
                setDeleting(false);
            }
        };

        return (
            <div className="flex items-center gap-2">
                {onEdit && (
                    <button
                        onClick={() => onEdit(item)}
                        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
                        disabled={vm.loading || deleting}
                    >
                        수정
                    </button>
                )}
                <button
                    onClick={handleDelete}
                    className="px-2 py-1 text-sm rounded border text-red-600 hover:bg-red-50"
                    disabled={vm.loading || deleting}
                    title="이 곡을 삭제합니다"
                >
                    {vm.loading || deleting ? "삭제 중…" : "삭제"}
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

            // ⬇⬇ DB 컬럼명에 맞게 필요시 수정
            const { data, error } = await supabase
                .from("songs")
                .select("id,title,song_photo,created_at,artist_id")
                .eq("artist_id", artistId)
                .order("created_at", { ascending: false });

            if (!alive) return;

            if (error) {
                setErr(error.message);
            } else {
                const mapped: UISong[] = (data || []).map((r: any) => ({
                    id: String(r.id),
                    title: r.title ?? "",
                    photoUrl: r.song_photo ?? null,
                    createdAt: r.created_at ?? null,
                }));
                setSongs(mapped);
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
    if (songs.length === 0) return <div className="py-6 text-sm text-gray-400">아직 등록된 곡이 없어요.</div>;

    return (
        <ul className="mt-4 grid gap-3">
            {songs.map((s) => (
                <li key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                    {/* 왼쪽: 사진 + 제목/날짜 */}
                    <div className="flex items-center min-w-0 gap-3">
                        {s.photoUrl && (
                            <img
                                src={s.photoUrl}
                                alt={s.title || "cover"}
                                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                            />
                        )}
                        <div className="min-w-0">
                            <div className="font-medium truncate">{s.title || "(제목 없음)"}</div>
                            {s.createdAt && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(s.createdAt).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 수정/삭제 버튼 */}
                    <RowActions
                        item={s}
                        onEdit={onEdit}
                        onDeleted={(id) => setSongs((prev) => prev.filter((x) => x.id !== id))}
                    />
                </li>
            ))}
        </ul>
    );
}
