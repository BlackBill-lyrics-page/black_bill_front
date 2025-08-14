import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

import { uploadArtistSongsPhoto } from "../utility/uploadSongsPhoto";

import { useSongStore } from "../store/useSongsStore";

// (참고) 여기 Songs 인터페이스는 VM 내부에서만 사용. 
// 스토어의 Songs와 큰 틀에서 호환되며, 필요한 필드만 포함.
// 필요 시 스토어의 타입을 import해서 재사용해도 됨.
export interface Songs {
    id: number | null;           // songs.id
    artist_id: number | null;    // songs.artist_id
    title: string;               // songs.title
    lyrics: string;              // songs.lyrics
    bio: string;                 // songs.bio
    song_photo: string;          // songs.song_photo (커버/썸네일 URL 등)
    created_at: string | null;   // songs.created_at
    song_link: string;           // songs.song_link (단일 링크 컬럼이지만, 별도 song_links도 있음: 레거시/보조용)
    links: { platform: string; url: string }[];
}

// 간단 URL 검증 (너무 빡세지 않게 http/https만 확인)
const isValidUrl = (u: string) => /^https?:\/\/\S+$/i.test(u.trim());

// ✅ 로그인 유저(uuid) → artists.id(number) 매핑 헬퍼
//    ⚠️ 너희 스키마에 맞게 'artists' 테이블/컬럼명을 확인해서 필요 시 변경해줘.
//    예: artists(auth_user_id uuid, id int)
const getArtistIdForUser = async (authUserId: string): Promise<number | null> => {
    const { data, error } = await supabase
        .from("artists")               // TODO: 스키마에 따라 테이블/컬럼명 확인
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
      id, artist_id,  title, lyrics, bio, song_photo, created_at, song_link,
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


export const useUploadSongsVM = (song: Songs | null) => {
    const [title, setTitle] = useState(song?.title || "");
    const [lyrics, setLyrics] = useState(song?.lyrics || "");
    const [bio, setBio] = useState(song?.bio || "");
    const [songPhoto, setSongPhoto] = useState(song?.song_photo || "");
    // 업로드 대기 중인 새 곡 사진 파일
    const [songPhotoFile, setSongPhotoFile] = useState<File | null>(null);
    const [songLink, setSongLink] = useState(song?.song_link || "");
    const [links, setLinks] = useState(song?.links?.length ? song.links : [
        // 곡 링크가 없으면 기본으로 youtube링크를 하나 제공함
        { platform: "YouTube", url: "" }
    ]);

    // ✅ 추가: 저장 중 버튼 비활성화/스피너용 로딩 상태
    const [loading, setLoading] = useState(false);

    // ✅ 전역 스토어(목록) 갱신을 위한 액션 사용
    const addSongToStore = useSongStore((s) => s.addSong);
    const updateSongInStore = useSongStore((s) => s.updateSong);
    const removeSongFromStore = useSongStore((s) => s.removeSong);

    // db에서 정보를 받아온 뒤, useEffect를 통해 안전하게 상태에 넣고, 그 이후 UI에 그림
    // db에서 정보를 받아온 뒤, useEffect를 통해 안전하게 상태에 넣고, 그 이후 UI에 그림
    useEffect(() => {
        (async () => {
            if (!song?.id) {
                // 신규 작성 모드라면, 기본값만 유지
                return;
            }

            // 부모가 이미 모든 핵심 필드를 제공하면 추가쿼리 없이 그대로 사용
            const hasAllFields =
                typeof song.lyrics !== "undefined" &&
                typeof song.bio !== "undefined" &&
                typeof song.song_photo !== "undefined" &&
                typeof song.song_link !== "undefined" &&
                typeof song.links !== "undefined";

            if (hasAllFields) {
                setTitle(song.title || "");
                setLyrics(song.lyrics || "");
                setBio(song.bio || "");
                setSongPhoto(song.song_photo || "");
                setSongLink(song.song_link || "");
                setLinks(
                    song.links?.length ? song.links : [{ platform: "YouTube", url: "" }]
                );
                return;
            }

            // 부족하면 DB에서 상세 보충
            const full = await fetchFullSongById(song.id);
            if (!full) return;

            setTitle(full.title || "");
            setLyrics(full.lyrics || "");
            setBio(full.bio || "");
            setSongPhoto(full.song_photo || "");
            setSongLink(full.song_link || "");
            setLinks(
                full.song_links?.length
                    ? full.song_links
                    : [{ platform: "YouTube", url: "" }]
            );
        })();
        // ✅ song의 id가 바뀔 때만 트리거
    }, [song?.id]);
    // ✅ 새 곡 사진 파일이 선택되면 상태 업데이트

    // 새 곡 사진 미리보기
    useEffect(() => {
        if (!songPhotoFile) return;
        const previewUrl = URL.createObjectURL(songPhotoFile);
        setSongPhoto(previewUrl);
        return () => URL.revokeObjectURL(previewUrl); // 컴포넌트 언마운트 시 URL 해제
        // ✅ 버그 수정: 의존성은 songPhotoFile 이어야 함(기존엔 songPhoto였음)
    }, [songPhotoFile]);

    // ✅ 링크 편집 헬퍼(컴포넌트에서 setLinks로 map/filter 반복하지 않도록 제공)
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

            // 1) 하위 링크 선삭제 (FK 제약 회피)
            await supabase.from("song_links").delete().eq("song_id", song.id);

            // 2) 곡 삭제
            const { error } = await supabase.from("songs").delete().eq("id", song.id);
            if (error) {
                console.error(error);
                alert("곡 삭제에 실패했습니다.");
                return false;
            }

            // // 3) 스토리지 이미지 삭제 (옵션)
            // if (opts?.alsoRemovePhoto && songPhoto) {
            //     try {
            //         await deleteStorageByPublicURL(songPhoto);
            //     } catch (e) {
            //         console.warn("이미지 삭제 중 경고:", e);
            //         // 이미지 삭제 실패는 곡 삭제 성공과 별개로 취급
            //     }
            // }

            // 4) 전역 목록에서 제거
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

            // 곡 정보가 모두 입력되었는지 확인
            if (!title.trim()) return alert("곡 제목을 입력해주세요.") as any;
            if (!lyrics.trim()) return alert("가사를 입력해주세요.") as any;
            // ✅ 문구 수정: bio는 아티스트가 아니라 곡 설명
            if (!bio.trim()) return alert("곡 설명을 입력해주세요.") as any;

            // ✅ 대표 링크(song_link)는 선택입력으로 완화(정책에 따라 필수로 바꿔도 됨)
            if (songLink.trim() && !isValidUrl(songLink)) {
                return alert("대표 링크 형식이 올바르지 않습니다.") as any;
            }
            // ✅ links 내부 URL 형식 점검(비어 있으면 패스)
            for (const l of links) {
                if (l.url.trim() && !isValidUrl(l.url)) {
                    return alert(`링크 형식이 올바르지 않습니다: ${l.platform}`) as any;
                }
            }

            // ✅ 아티스트 id 확보 (신규 insert 시 필요)
            let artistId: number | null = song?.artist_id ?? null;
            if (!artistId) {
                artistId = await getArtistIdForUser(user.id);
                if (!artistId) {
                    alert("아티스트 정보를 찾을 수 없습니다.");
                    return false;
                }
            }

            // 새 곡 사진 업로드
            let finalSongPhoto = songPhoto;
            if (songPhotoFile) {
                const uploadedUrl = await uploadArtistSongsPhoto(
                    songPhotoFile,
                    user.id,
                    title
                );
                if (!uploadedUrl) return alert("곡 사진 업로드 실패") as any;
                finalSongPhoto = uploadedUrl;
            }

            // ✅ 신규/수정 분기 처리 (기존엔 update만 있어서 신규 업로드 불가)
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

                // ✅ 전역 목록에 즉시 반영 (페이지 전체 리패치 없이 UI 동기화)
                addSongToStore?.(inserted);
            } else {
                // 기존 곡 수정
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

                // ✅ 전역 목록에 즉시 반영
                updateSongInStore?.(updated);
            }

            // SNS 링크 동기화 (심플하게 전체 삭제 후 재삽입)
            await supabase.from("song_links").delete().eq("song_id", targetSongId);

            const linksToInsert = links
                .filter((link) => link.url.trim() !== "")
                .map((link) => ({
                    song_id: targetSongId,
                    platform: link.platform,
                    url: link.url.trim(),
                }));

            if (linksToInsert.length > 0) {
                const { error: linkError } = await supabase
                    .from("song_links")
                    .insert(linksToInsert);
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
        songPhotoFile,         // ✅ 파일 입력 컴포넌트에서 세팅할 수 있도록 노출
        setSongPhotoFile,      // ✅ 파일 입력의 onChange에서 사용
        songLink,
        setSongLink,
        links,
        setLinks,

        // ✅ 링크 편집 헬퍼(컴포넌트 코드 단순화)
        addLink,
        updateLink,
        removeLink,

        // ✅ 로딩 상태 (저장 중 버튼 비활성/스피너 표시 등에 사용)
        loading,

        // ✅ 저장 액션
        handleSubmit,

        // 기존 곡 삭제
        deleteCurrentSong,
    };
};
