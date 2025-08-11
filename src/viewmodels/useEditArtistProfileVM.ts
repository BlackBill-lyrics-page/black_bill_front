import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadArtistPhoto } from "../utility/uploadArtistPhoto";
import { useArtistStore } from "../store/useArtistStore";

export interface Artist {
  id: number;
  user_id: string;
  photoUrl?: string;
  name?: string;
  type?: string;
  instruments?: string;
  label?: string;
  bio?: string;
  created_at?: string;
  links?: { platform: string; url: string }[]; 
  genres: { id: number; name: string }[]
}

export const useEditArtistProfileVM = (artist : Artist) => {
  const [photoUrl, setPhotoUrl] = useState(artist?.photoUrl || "");
  const [name, setName] = useState(artist?.name || "");
  const [bio, setBio] = useState(artist?.bio || "");
  const [label, setLabel] = useState(artist?.label || "");
  const [instruments, setInstruments] = useState(artist?.instruments || "");
  const [snsLinks, setSnsLinks] = useState(artist?.links || [
    { platform: "instagram", url: "" }
  ]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    artist?.genres?.map((g: { id: number }) => g.id) || []
  );
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  
  useEffect(() => {
    if (artist) {
      setPhotoUrl(artist.photoUrl || "");
      setName(artist.name || "");
      setBio(artist.bio || "");
      setLabel(artist.label || "");
      setInstruments(artist.instruments || "");

      setSnsLinks(
        artist.links?.length
          ? artist.links
          : [{ platform: "instagram", url: "" }]
      );

      setSelectedGenres(
        artist.genres?.map((g) => g.id) || []
      );
    }
  }, [artist]);

  useEffect(() => {
    if (!photoFile) return;
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data) {
        setGenres(data);
      }
    };
    fetchGenres();
  }, []);

  const handleSubmit = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return alert("로그인이 필요합니다.");
    if (!name.trim()) return alert("활동명을 입력해주세요.");

    if (selectedGenres.length < 1) {
      return alert("장르는 최소 1개 이상 선택해야 합니다.");
    }
    if (selectedGenres.length > 3) {
      return alert("장르는 최대 3개까지만 선택 가능합니다.");
    }

    let finalPhotoUrl = artist.photoUrl;

    // 새 사진 업로드
    if (photoFile) {
      const uploadedUrl = await uploadArtistPhoto(photoFile, user.id);
      if (!uploadedUrl) return alert("사진 업로드 실패");
      finalPhotoUrl = uploadedUrl;
    }

    // 아티스트 정보 업데이트
    const { error: updateError } = await supabase
      .from("artists")
      .update({
        photo_url: finalPhotoUrl,
        name,
        bio,
        label,
        instruments,
      })
      .eq("id", artist.id);

    if (updateError) {
      console.error(updateError);
      return alert("아티스트 정보 수정 실패");
    }

    // SNS 링크 동기화
    // (단순화: 기존 링크 삭제 후 새로 삽입)
    await supabase.from("artist_links").delete().eq("artist_id", artist.id);

    const linksToInsert = snsLinks
      .filter((link) => link.url.trim() !== "")
      .map((link) => ({
        artist_id: artist.id,
        platform: link.platform,
        url: link.url,
        icon_url: null,  //icon-image 추후 설정
      }));

    if (linksToInsert.length > 0) {
      const { error: linkError } = await supabase
        .from("artist_links")
        .insert(linksToInsert);
      if (linkError) {
        console.error(linkError);
        return alert("SNS 링크 수정 실패");
      }
    }

    // 장르 동기화
    await supabase.from("artist_genres").delete().eq("artist_id", artist.id);

    const validGenres = [...new Set(selectedGenres)] // 중복 제거 set
        .filter(id => typeof id === "number" && id > 0);

    if (validGenres.length > 0) {
        const genresToInsert = validGenres.map(genre_id => ({
          artist_id: artist.id,
          genre_id
        }));

      const { error: genreError } = await supabase
        .from("artist_genres")
        .insert(genresToInsert);

      if (genreError) {
        console.error(genreError);
        return alert("장르 수정 실패");
      }
    }

    const cacheBusted = (finalPhotoUrl ?? artist.photoUrl ?? "")
    ? `${finalPhotoUrl ?? artist.photoUrl}?v=${Date.now()}`
    : "";

  //store
  useArtistStore.getState().setArtist({ 
    id: artist.id,
    userId: artist.user_id,
    name,
    photoUrl: cacheBusted,
    bio,
    label,
    instruments,
    genres: [...new Set(selectedGenres)]
    .map((id) => {
      const found = genres.find((g) => g.id === id);
      return found ? { id: found.id, name: found.name } : { id, name: "" };
    }),
    links: snsLinks.filter(l => l.url.trim() !== ""),
  });

    alert("아티스트 정보가 수정되었습니다!");
    return true
  };

  
  
  return {
    photoUrl,
    setPhotoFile,
    name,
    setName,
    bio,
    setBio,
    label,
    setLabel,
    instruments,
    setInstruments,
    snsLinks,
    setSnsLinks,
    handleSubmit,
    selectedGenres,
    setSelectedGenres,
    genres,
  };
};
