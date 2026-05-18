-- Add lyrics-book context to song comments.
-- This lets the same song collect comments from different albums/lyrics books
-- while still preserving existing song-level comments where album_id is null.

alter table public.song_comment
  add column if not exists album_id bigint null;

alter table public.song_comment
  drop constraint if exists song_comment_album_id_fkey;

alter table public.song_comment
  add constraint song_comment_album_id_fkey
  foreign key (album_id)
  references public.albums(id)
  on delete set null;

create index if not exists song_comment_song_album_idx
  on public.song_comment (song_id, album_id, updated_at desc);

create index if not exists song_comment_album_idx
  on public.song_comment (album_id, updated_at desc);
