// components/SongList.tsx
// MyArtistPage에서 아티스트가 업로드한 곡의 리스트를 보여주는 컴포넌트

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUploadSongsVM } from "../viewmodels/useUploadSongsVM";
import SongLikeButton from "./SongLikeButton";
import { FiEdit2, FiTrash, FiMessageCircle } from "react-icons/fi";

// 화면(UI)에서 쓸 가벼운 타입 (외부 파일 의존 X)
export type UISong = {
    id: string;
    title: string;
    photoUrl?: string | null;
    createdAt?: string | null;
    artistName?: string | null;
    likeCount?: number;
    commentCount?: number;
};

export default function SongList({
    artistId,
    onEdit,
    onOpen,
    readOnly = true,
}: {
    artistId: string | number;
    onEdit?: (song: UISong) => void;
    onOpen?: (song: UISong) => void;
    readOnly?: boolean;
}) {
    const [songs, setSongs] = useState<UISong[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // 체크보드 플레이스홀더 (썸네일 없을 때)
    const Placeholder = () => (
        <div
            aria-hidden
            className="w-24 h-24 rounded-xl border border-gray-200 bg-[length:12px_12px] bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[position:0_0,0_6px,6px_-6px,-6px_0]"
        />
    );

    // ── Row 전용 액션: 삭제/수정 버튼 묶음 ─────────────────────────────
    function RowActions({
        item,
        onEdit,
        onDeleted,
        readOnly,
    }: {
        item: UISong;
        onEdit?: (song: UISong) => void;
        onDeleted: (id: string) => void;
        readOnly?: boolean;
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
            if (readOnly) return;
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
            <div className="shrink-0 flex items-start gap-3">
                {onEdit && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        aria-label="곡 수정"
                        title="수정"
                        // 🔥 불필요한 배경/둥근 테두리 제거
                        className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                    >
                        <FiEdit2 className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    aria-label="곡 삭제"
                    title="삭제"
                    className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                >
                    <FiTrash className="w-4 h-4" />
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

            const { data, error } = await supabase
                .from("songs")
                .select(`id,title,song_photo,created_at,artist_id, 
                 like_count:song_liked!song_liked_song_id_fkey(count), 
                 comment_count:song_comment!song_comment_song_id_fkey(count)
        `)
                .eq("artist_id", artistId)
                .order("created_at", { ascending: false });

            if (!alive) return;

            if (error) {
                setErr(error.message);
                setLoading(false);
                return;
            }

            const base = (data ?? []).map((r: any) => ({
                id: String(r.id),
                title: r.title ?? "",
                photoUrl: r.song_photo ?? null,
                createdAt: r.created_at ?? null,
                likeCount: r.like_count?.[0]?.count ?? 0,
                commentCount: r.comment_count?.[0]?.count ?? 0,
            })) as UISong[];

            setSongs(base);
            setLoading(false);
        }

        load();
        return () => {
            alive = false;
        };
    }, [artistId]);

    if (loading) return <div className="py-6 text-sm text-gray-500">불러오는 중…</div>;
    if (err) return <div className="py-6 text-sm text-red-500">{err}</div>;
    if (songs.length === 0)
        return <div className="py-6 text-sm text-gray-400">아직 등록된 곡이 없어요.</div>;

    return (
        <ul className="mt-2 divide-y divide-gray-100">
            {songs.map((s) => (
                <li
                    key={s.id}
                    className="group flex items-start justify-between gap-4 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => onOpen?.(s)}
                >
                    {/* 왼쪽: 사진 + 텍스트 */}
                    <div className="flex items-start gap-4 min-w-0">
                        {s.photoUrl ? (
                            <img
                                src={s.photoUrl}
                                alt={s.title || "cover"}
                                className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                            />
                        ) : (
                            <Placeholder />
                        )}

                        <div className="min-w-0">
                            <div className="text-[17px] font-semibold text-gray-900 truncate">
                                {s.title || "(곡 제목)"}
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                <span>좋아요 {s.likeCount ?? 0}</span>
                                <span>댓글 {s.commentCount ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 관객/본인 뷰 분기 */}
                    {readOnly ? (
                        <div
                            className="shrink-0 self-start flex items-center gap-3 pr-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 좋아요 버튼 */}
                            <SongLikeButton mode="vm" songId={Number(s.id)} />

                            {/* 댓글 버튼 + 개수 */}
                            <button
                                type="button"
                                onClick={() => onOpen?.(s)}   // 곡 열기(=댓글 보기)
                                aria-label="댓글 보기"
                                title="댓글"
                                className="flex items-center gap-1 p-0 bg-transparent border-0 hover:opacity-80 transition"
                            >
                                <FiMessageCircle className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-500">
                                    {s.commentCount ?? 0}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="self-start" onClick={(e) => e.stopPropagation()}>
                            <RowActions
                                item={s}
                                onEdit={onEdit}
                                onDeleted={(id) => setSongs((prev) => prev.filter((x) => x.id !== id))}
                                readOnly={readOnly}
                            />
                        </div>
                    )}


                </li>
            ))}
        </ul>
    );
}
