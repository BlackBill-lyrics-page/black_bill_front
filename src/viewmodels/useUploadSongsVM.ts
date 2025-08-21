// viewmodels/useUploadSongsVM.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadArtistSongsPhoto } from "../utility/uploadSongsPhoto";
import { useSongStore } from "../store/useSongsStore";

// (참고) 여기 Songs 인터페이스는 VM 내부에서만 사용.
export interface Songs {
    id: number | null;
    artist_id: number | null;
    title: string;
    lyrics: string;
    bio: string;
    song_photo: string;
    created_at: string | null;
    song_link: string;
    links: { platform: string; url: string }[];
}

// 간단 URL 검증
const isValidUrl = (u: string) => /^https?:\/\/\S+$/i.test(u.trim());

// ✅ 로그인 유저(uuid) → artists.id(number) 매핑 헬퍼
const getArtistIdForUser = async (authUserId: string): Promise<number | null> => {
    const { data, error } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", authUserId)
        .maybeSingle();

    if (error) {
        console.error("artist 조회 실패:", error);
        return null;
    }
    return data?.id ?? null;
};

// ✅ 곡 상세 조회: songs + 하위 song_links까지 함께
const fetchFullSongById = async (songId: number) => {
    const { data, error } = await supabase
        .from("songs")
        .select(`
      id, artist_id, title, lyrics, bio, song_photo, created_at, song_link,
      song_links ( platform, url )
    `)
        .eq("id", songId)
        .maybeSingle();

    if (error) {
        console.error("곡 상세 조회 실패:", error);
        alert("곡 정보를 불러오지 못했습니다.");
        return null;
    }
    return data as unknown as {
        id: number;
        artist_id: number | null;
        title: string;
        lyrics: string | null;
        bio: string | null;
        song_photo: string | null;
        created_at: string | null;
        song_link: string | null;
        song_links?: { platform: string; url: string }[] | null;
    };
};

// 🔧 Changed: 두 번째 인자로 watchKey 옵션 추가
export const useUploadSongsVM = (
    song: Songs | null,
    opts?: { watchKey?: any } // ✅ Added: 외부 트리거(예: 모달 open 상태)를 전달해서 동기화 보장
) => {
    const [title, setTitle] = useState(song?.title || "");
    const [lyrics, setLyrics] = useState(song?.lyrics || "");
    const [bio, setBio] = useState(song?.bio || "");
    const [songPhoto, setSongPhoto] = useState(song?.song_photo || "");
    const [songPhotoFile, setSongPhotoFile] = useState<File | null>(null);
    const [songLink, setSongLink] = useState(song?.song_link || "");
    const [links, setLinks] = useState(
        song?.links?.length ? song.links : [{ platform: "YouTube", url: "" }]
    );

    const [loading, setLoading] = useState(false);

    const addSongToStore = useSongStore((s) => s.addSong);
    const updateSongInStore = useSongStore((s) => s.updateSong);
    const removeSongFromStore = useSongStore((s) => s.removeSong);

    // 🔧 Changed: 수정 모드일 때는 항상 DB에서 전체 필드 보충 조회
    useEffect(() => {
        (async () => {
            // 신규 작성 모드: 폼 초기화
            if (!song?.id) {
                setTitle("");
                setLyrics("");
                setBio("");
                setSongPhoto("");
                setSongLink("");
                setLinks([{ platform: "YouTube", url: "" }]);
                return;
            }

            // 수정 모드: DB에서 항상 최신 값 로드
            const full = await fetchFullSongById(song.id);
            if (full) {
                setTitle(full.title || "");
                setLyrics(full.lyrics || "");
                setBio(full.bio || "");
                setSongPhoto(full.song_photo || "");
                setSongLink(full.song_link || "");
                setLinks(
                    full.song_links?.length ? full.song_links : [{ platform: "YouTube", url: "" }]
                );
                return;
            }

            // 🔁 조회 실패 시 initialSong으로 폴백 (있을 수 있는 값만 반영)
            setTitle(song.title || "");
            setLyrics(song.lyrics || "");
            setBio(song.bio || "");
            setSongPhoto(song.song_photo || "");
            setSongLink(song.song_link || "");
            setLinks(song.links?.length ? song.links : [{ platform: "YouTube", url: "" }]);
        })();
        // ✅ 안정적인 키만 의존성에 둬서 무한루프 방지
    }, [song?.id, opts?.watchKey]);


    // 새 곡 사진 미리보기
    useEffect(() => {
        if (!songPhotoFile) return;
        const previewUrl = URL.createObjectURL(songPhotoFile);
        setSongPhoto(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [songPhotoFile]);

    // 링크 편집 헬퍼들
    const addLink = () => setLinks((prev) => [...prev, { platform: "YouTube", url: "" }]);
    const updateLink = (index: number, patch: Partial<{ platform: string; url: string }>) =>
        setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    const removeLink = (index: number) =>
        setLinks((prev) => prev.filter((_, i) => i !== index));

    const deleteCurrentSong = async (opts?: { alsoRemovePhoto?: boolean }) => {
        if (!song?.id) {
            alert("삭제할 곡이 없습니다.");
            return false;
        }
        if (!confirm("정말로 이 곡을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            return false;
        }

        try {
            setLoading(true);

            // 하위 링크 선삭제
            await supabase.from("song_links").delete().eq("song_id", song.id);

            // 곡 삭제
            const { error } = await supabase.from("songs").delete().eq("id", song.id);
            if (error) {
                console.error(error);
                alert("곡 삭제에 실패했습니다.");
                return false;
            }

            // 전역 목록에서 제거
            removeSongFromStore?.(song.id);

            alert("곡이 삭제되었습니다.");
            return true;
        } finally {
            setLoading(false);
        }
    };

    // 저장 로직
    const handleSubmit = async (): Promise<boolean> => {
        try {
            setLoading(true);

            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                alert("로그인이 필요합니다.");
                return false;
            }

            if (!title.trim()) return alert("곡 제목을 입력해주세요.") as any;
            if (!lyrics.trim()) return alert("가사를 입력해주세요.") as any;
            if (!bio.trim()) return alert("곡 설명을 입력해주세요.") as any;

            if (songLink.trim() && !isValidUrl(songLink)) {
                return alert("대표 링크 형식이 올바르지 않습니다.") as any;
            }
            for (const l of links) {
                if (l.url.trim() && !isValidUrl(l.url)) {
                    return alert(`링크 형식이 올바르지 않습니다: ${l.platform}`) as any;
                }
            }

            let artistId: number | null = song?.artist_id ?? null;
            if (!artistId) {
                artistId = await getArtistIdForUser(user.id);
                if (!artistId) {
                    alert("아티스트 정보를 찾을 수 없습니다.");
                    return false;
                }
            }

            // 사진 업로드
            let finalSongPhoto = songPhoto;
            if (songPhotoFile) {
                const uploadedUrl = await uploadArtistSongsPhoto(songPhotoFile, user.id, title);
                if (!uploadedUrl) return alert("곡 사진 업로드 실패") as any;
                finalSongPhoto = uploadedUrl;
            }

            let targetSongId = song?.id ?? null;

            if (!targetSongId) {
                // 신규 생성
                const insertPayload = {
                    artist_id: artistId,
                    title,
                    lyrics,
                    bio,
                    song_photo: finalSongPhoto,
                    song_link: songLink,
                };

                const { data: inserted, error: insertError } = await supabase
                    .from("songs")
                    .insert(insertPayload)
                    .select("*")
                    .single();

                console.log("Insert payload:", insertPayload);
                console.log("Insert error:", insertError);
                console.log("Inserted data:", inserted);

                if (insertError || !inserted) {
                    console.error(insertError);
                    alert("곡 생성에 실패했습니다.");
                    return false;
                }

                targetSongId = inserted.id as number;
                addSongToStore?.(inserted);
            } else {
                // 수정
                const updatePayload = {
                    title,
                    lyrics,
                    bio,
                    song_photo: finalSongPhoto,
                    song_link: songLink,
                };

                const { data: updated, error: updateError } = await supabase
                    .from("songs")
                    .update(updatePayload)
                    .eq("id", targetSongId)
                    .select("*")
                    .single();

                if (updateError || !updated) {
                    console.error(updateError);
                    return alert("곡 정보 수정 실패") as any;
                }

                updateSongInStore?.(updated);
            }

            // 링크 동기화
            await supabase.from("song_links").delete().eq("song_id", targetSongId);

            const linksToInsert = links
                .filter((link) => link.url.trim() !== "")
                .map((link) => ({
                    song_id: targetSongId,
                    platform: link.platform,
                    url: link.url.trim(),
                }));

            if (linksToInsert.length > 0) {
                const { error: linkError } = await supabase.from("song_links").insert(linksToInsert);
                if (linkError) {
                    console.error(linkError);
                    return alert("곡 링크 저장 실패") as any;
                }
            }

            alert(!song?.id ? "곡이 업로드되었습니다!" : "곡 정보가 수정되었습니다!");
            return true;
        } finally {
            setLoading(false);
        }
    };

    return {
        title,
        setTitle,
        lyrics,
        setLyrics,
        bio,
        setBio,
        songPhoto,
        setSongPhoto,
        songPhotoFile,
        setSongPhotoFile,
        songLink,
        setSongLink,
        links,
        setLinks,
        addLink,
        updateLink,
        removeLink,
        loading,
        handleSubmit,
        deleteCurrentSong,
    };
};
