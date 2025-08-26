// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import { supabase } from "../lib/supabaseClient";
// import ArtistProfileView from "../components/ArtistProfileView";
// import { useArtistFollowVM } from "../viewmodels/useArtistFollowVM";
// import ArtistStagesCalendar from "../components/stage/ArtistStagesCalendar";

// type Link = { platform: string; url: string };
// type Genre = { id: number; name: string };
// type Artist = {
//   id: number;
//   name: string;
//   photoUrl?: string | null;
//   label?: string | null;
//   instruments?: string | null;
//   genres: Genre[];
//   links: Link[];
//   bio: string | null;
// };

// export default function ArtistPage() {
//   const { id } = useParams<{ id: string }>(); // /artist/:id
//   const [artist, setArtist] = useState<Artist | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [activeTab, setActiveTab] = useState<"songs" | "books" | "stages">("songs");

//   const artistIdNum = id ? Number(id) : undefined;
//   const {
//     count: followerCount,
//     following,
//     loading: followLoading,
//     toggle: onToggleFollow,
//   } = useArtistFollowVM(artistIdNum);

//   useEffect(() => {
//     const fetchArtist = async () => {
//       if (!id) return;
//       setLoading(true);

//       const { data, error } = await supabase
//         .from("artists")
//         .select(`
//           id,
//           photo_url,
//           name,
//           bio,
//           label,
//           instruments,
//           artist_links (
//             platform,
//             url
//           ),
//           artist_genres (
//             genre_id,
//             genres (
//               id,
//               name
//             )
//           )
//         `)
//         .eq("id", id)
//         .maybeSingle();

//       if (error) {
//         console.error(error);
//         setLoading(false);
//         return;
//       }

//       if (data) {
//         setArtist({
//           id: data.id,
//           photoUrl: data.photo_url ?? "",
//           name: data.name ?? "",
//           label: data.label ?? "",
//           instruments: data.instruments ?? "",
//           links: (data.artist_links || []).map((l: any) => ({
//             platform: l.platform,
//             url: l.url,
//           })),
//           genres: (data.artist_genres || [])
//             .filter((ag: any) => ag.genres)
//             .map((ag: any) => ({
//               id: ag.genres.id,
//               name: ag.genres.name,
//             })),
//           bio: data.bio ?? null,
//         });
//       }

//       setLoading(false);
//     };

//     fetchArtist();
//   }, [id]);

//   if (loading) return <div className="p-6">로딩중...</div>;

//   if (!artist) {
//     return (
//       <div className="flex flex-col items-center justify-center p-6 text-gray-500">
//         해당 아티스트를 찾을 수 없습니다.
//       </div>
//     );
//   }

//   return (
//     <>
//       <ArtistProfileView
//         artist={artist}
//         isOwner={false} // 관객이므로 추가/편집 버튼 없음
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         followerCount={followerCount}
//         following={following}
//         followLoading={followLoading}
//         onToggleFollow={onToggleFollow}
//       />

//       {/* 🔧 추가: 탭별 콘텐츠. Stages일 때 캘린더 조회 전용 렌더 */}
//       {activeTab === "stages" && (
//         <div className="p-4">
//           <ArtistStagesCalendar
//             artistId={artist.id}
//             artistName={artist.name}
//             mode="viewer"           // ✅ 관객 모드
//             canEdit={false}         // ✅ 수정/삭제 비활성화
//             onItemClick={(s) => {   // ✅ (옵션) 홍보 링크 열기
//               if (s.promotion_url) window.open(s.promotion_url, "_blank");
//             }}
//           />
//         </div>
//       )}
//     </>
//   );
// }

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ArtistProfileView from "../components/ArtistProfileView";
import { useArtistFollowVM } from "../viewmodels/useArtistFollowVM";
import ArtistStagesCalendar from "../components/stage/ArtistStagesCalendar";

type Link = { platform: string; url: string };
type Genre = { id: number; name: string };
type Artist = {
  id: number;
  name: string;
  photoUrl?: string | null;
  label?: string | null;
  instruments?: string | null;
  genres: Genre[];
  links: Link[];
  bio: string | null;
};

type Tab = "songs" | "books" | "stages";

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>(); // /artist/:id
  const [searchParams] = useSearchParams();   // [NEW] URL 쿼리 사용
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  // [NEW] URL ?tab= 값 읽어서 초기 탭 결정 (기본: books)
  const initialTab: Tab = useMemo(() => {
    const t = searchParams.get("tab");
    if (t === "books" || t === "lyricsbook") return "books";
    if (t === "stages") return "stages";
    if (t === "songs") return "songs";
    return "books";
  }, [searchParams]);

  // [CHANGED] 기본값 songs → URL 기반(books 기본)
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  useEffect(() => setActiveTab(initialTab), [initialTab]); // 뒤로가기 등 URL 변경 반영

  const artistIdNum = id ? Number(id) : undefined;
  const {
    count: followerCount,
    following,
    loading: followLoading,
    toggle: onToggleFollow,
  } = useArtistFollowVM(artistIdNum);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("artists")
        .select(`
          id,
          photo_url,
          name,
          bio,
          label,
          instruments,
          artist_links (
            platform,
            url
          ),
          artist_genres (
            genre_id,
            genres (
              id,
              name
            )
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        setArtist({
          id: data.id,
          photoUrl: data.photo_url ?? "",
          name: data.name ?? "",
          label: data.label ?? "",
          instruments: data.instruments ?? "",
          links: (data.artist_links || []).map((l: any) => ({
            platform: l.platform,
            url: l.url,
          })),
          genres: (data.artist_genres || [])
            .filter((ag: any) => ag.genres)
            .map((ag: any) => ({
              id: ag.genres.id,
              name: ag.genres.name,
            })),
          bio: data.bio ?? null,
        });
      }

      setLoading(false);
    };

    fetchArtist();
  }, [id]);

  if (loading) return <div className="p-6">로딩중...</div>;

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-gray-500">
        해당 아티스트를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <>
      <ArtistProfileView
        artist={artist}
        isOwner={false} // 관객이므로 추가/편집 버튼 없음
        activeTab={activeTab}          // [CHANGED] controlled tab
        setActiveTab={setActiveTab}    // [CHANGED] controlled tab setter
        followerCount={followerCount}
        following={following}
        followLoading={followLoading}
        onToggleFollow={onToggleFollow}
      />

      {/* (옵션) 탭이 stages일 때 캘린더 표시 */}
      {activeTab === "stages" && (
        <div className="p-4">
          <ArtistStagesCalendar
            artistId={artist.id}
            artistName={artist.name}
            mode="viewer"
            canEdit={false}
            onItemClick={(s) => {
              if (s.promotion_url) window.open(s.promotion_url, "_blank");
            }}
          />
        </div>
      )}
    </>
  );
}
