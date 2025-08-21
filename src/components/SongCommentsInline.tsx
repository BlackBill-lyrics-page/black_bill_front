// src/components/SongCommentsInline.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";

export default function SongCommentsInline({ songId }: { songId: number }) {
  const { comments, loading, addComment, editComment, deleteComment } = useSongCommentVM(songId);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data?.user?.id ?? null));
  }, []);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  const startEdit = (id: number, current: string, ownerId?: string) => {
    if (!meId || String(meId) !== String(ownerId)) return;
    setEditingId(id);
    setEditingText(current);
  };
  const cancelEdit = () => { setEditingId(null); setEditingText(""); };
  const saveEdit = async () => {
    if (!editingId) return;
    const v = editingText.trim();
    if (!v) return;
    await editComment(editingId, v);
    cancelEdit();
  };
  const handleDelete = async (id: number, ownerId?: string) => {
    if (!meId || String(meId) !== String(ownerId)) return;
    await deleteComment(id);
  };

  return (
    <div className="mt-4 w-full">
      {/* 입력창 */}
      <div className="flex gap-2 mb-3">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button onClick={handleAdd} className="px-3 py-1 bg-black text-white rounded text-sm">
          등록
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500">불러오는 중…</p>}

      {/* 리스트 — ArtistProfileView와 동일 레이아웃 */}
      <ul className="space-y-2">
        {comments.map((c) => {
          const isEditing = editingId === c.id;
          const mine = meId != null && String(c.user_id) === String(meId);
          return (
            <li key={c.id} className="flex gap-2 items-start">
              <img
                src={c.users?.photo_url || "/default-avatar.png"}
                alt={c.users?.username || "user"}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{c.users?.username ?? "익명"}</span>

                  {/* 우측 액션 */}
                  {mine && (
                    <div className="flex gap-2 text-xs text-gray-500">
                      {!isEditing ? (
                        <>
                          <button onClick={() => startEdit(c.id, c.comment, c.user_id)}>수정</button>
                          <button onClick={() => handleDelete(c.id, c.user_id)}>삭제</button>
                        </>
                      ) : (
                        <>
                          <button onClick={saveEdit} className="text-black">저장</button>
                          <button onClick={cancelEdit}>취소</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 본문: 보기 vs 편집 */}
                {!isEditing ? (
                  <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
                ) : (
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    autoFocus
                  />
                )}

                <span className="text-xs text-gray-400">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
