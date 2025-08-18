import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ArtistProfileView from "../components/ArtistProfileView";
import { useArtistFollowVM } from "../viewmodels/useArtistFollowVM";

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
  bio : string | null;
};

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>(); // /artist/:id
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"songs" | "books" | "stages">("songs");

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
            bio : data.bio ?? null,
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
    <ArtistProfileView
      artist={artist}
      isOwner={false} // 관객이므로 추가/편집 버튼 없음
      activeTab={activeTab}
      setActiveTab={setActiveTab}

      followerCount={followerCount}
      following={following}
      followLoading={followLoading}
      onToggleFollow={onToggleFollow}
    />
  );
}
