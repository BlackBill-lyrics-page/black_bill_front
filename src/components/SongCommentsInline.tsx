import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSongCommentVM } from "../viewmodels/useSongCommentVM";
import TextareaAutosize from "react-textarea-autosize";
import { FiArrowUpRight } from "react-icons/fi";


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
    <div className="w-full">
      {/* 입력창 */}
      <div className="flex gap-2 mb-10">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleAdd();
          }}
          className="w-full mt-1 flex items-center gap-2 bg-white border rounded-3xl px-1"
        >
          <TextareaAutosize
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 resize-none rounded-3xl px-3 py-2 text-sm leading-5 outline-none placeholder:text-gray-400"
            minRows={1}
            maxRows={6}
            onKeyDown={(e) => {
              // IME(한글 조합) 중에는 submit 금지
              // @ts-ignore
              if (e.nativeEvent?.isComposing || e.key === "Process" || (e as any).keyCode === 229) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
          />

          <button
            type="submit"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white mr-1"
            aria-label="댓글 등록"
            title="댓글 등록"
          >
            <FiArrowUpRight className="w-5 h-5" />
          </button>
        </form>
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
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">{c.users?.username ?? "익명"}</span>

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
                  <p className="text-sm break-words whitespace-pre-wrap text-gray-800">{c.comment}</p>
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
