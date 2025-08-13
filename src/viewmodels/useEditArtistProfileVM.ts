// react의 상태 훅과 사이드이펙트 훅
// useState : 초기값, 화면에 보여줄 값(입력창 내용 등)을 메모리에 보관, 값이 바뀌면 컴포넌트가 다시 그려짐
// useEffect : 부수효과 실행, 
// // ex. 첫 로드 때 장르 목록 불러오기, 파일을 선택했을 때 미리보기 URL 생성
// // []면 처음 한번 실행, [artist]면 artist가 바뀔 때마다 실행
import { useState, useEffect } from "react";
// supabase 백엔드 연동 객체
import { supabase } from "../lib/supabaseClient";
// 사진 업로드 유틸함수(스토리지 업로드 후 URL 반환 예상)
import { uploadArtistPhoto } from "../utility/uploadArtistPhoto";
// 아티스트 상태 관리 훅
import { useArtistStore } from "../store/useArtistStore";

// VM이 다루는 아티스트 데이터 타입 정의
// ts의 interface타입 : 이 훅이 받는 artist가 무슨 모양인지(키, 값 타입) 정의
// 런타임에는 영향 없지만, 개발 중 오류를 미리 잡아줌
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

// 아티스트 객체를 받아 편집 상태/로직을 제공하는 커스텀 훅 선언
export const useEditArtistProfileVM = (artist : Artist) => {
  // 폼 입력용 기본 상태값들을 아티스트 데이터로 초기화
  // 옵셔널 체이닝(?.) : null 또는 undefined인 경우 에러를 발생시키지 않고 undefined를 반환
  // // artist?.photoUrl || "" : artist나 photoUrl이 없으면 빈 문자열 ""을 쓰자는 뜻
  const [photoUrl, setPhotoUrl] = useState(artist?.photoUrl || "");
  const [name, setName] = useState(artist?.name || "");
  const [bio, setBio] = useState(artist?.bio || "");
  const [label, setLabel] = useState(artist?.label || "");
  const [instruments, setInstruments] = useState(artist?.instruments || "");
  // sns 링크 배열 상태, 없으면 기본 한 줄 제공
  const [snsLinks, setSnsLinks] = useState(artist?.links || [
    { platform: "instagram", url: "" }
  ]);
  // 업로드 대기 중인 새 프로필 사진 파일
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // 현재 선택된 장르 ID 배열
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    artist?.genres?.map((g: { id: number }) => g.id) || []
  );
  // 전체 장르 목록 상태
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  
  // 아티스트 변경 시 상태 재설정
  // artist prop이 변경될 때마다, 입력폼 상태를 최신 데이터로 덮어씀
  // 먼 소리냐? 첫 렌더 이후, artist가 바뀔 때마다, useEffect가 이를 감지해서 다시 실행됨
  useEffect(() => {
    if (artist) { // artist가 없는 초기 렌더를 대비한 가드
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
  }, [artist]); // [artist] : artist참조가 바뀔 때마다 다시 실행됨

  // 새 사진 미리보기
  // 사진 파일 선택 시 브라우저 임시 URL을 생성해 미리보기 표시
  // 컴포넌트 언마운트나 파일 변경 시 URL 해제
  useEffect(() => {
    if (!photoFile) return;
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  // 장르 목록 불러오기
  useEffect(() => {
    const fetchGenres = async () => {
      // await : 이 줄에서 결과가 올때까지 기다렸다가 다음 줄 실행
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

  // 저장 로직
  const handleSubmit = async () => {
    // 로그인 여부 및 필수값 검증
    // supabase.auth.getUser() : 현재 로그인 사용자 확인
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return alert("로그인이 필요합니다.");
    if (!name.trim()) return alert("활동명을 입력해주세요.");

    // 장르 개수 제한
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

  // store : 전역 상태, 아티스트 정보를 한 곳에 저장해두고, 필요한 컴포넌트들이 이걸 구독해서 쓰는 형태
  // 약간 임시 캐시같은 개념으로 생각하면 될듯
  // 캐시 무효화를 위해 사진 URL에 쿼리 스트링 추가
  // 전역 스토어에 최신 데이터 반영(페이지 전환 없이도 UI 갱신됨)
  // 앱 전역에서 사용하는 아티스트 정보를 최신으로 갱신
  // userArtistStore.getState().setArtist와 같이 스토어 값을 바꾸면, 이 값을 쓰던 컴포넌트들이 자동으로 다시 렌더링됨
  // artistStore의 setArtist 함수 호출, artist 객체의 일부 속성만 업데이트
  // artistStore는 useArtistStore 훅을 통해 접근 가능
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

  
  
  return { // view컴포넌트가 사용할 상태, 세터, 장르목록, 제출 함수 제공
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
