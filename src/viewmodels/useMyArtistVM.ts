import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useArtistStore } from "../store/useArtistStore";


export function useMyArtistVM() {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const init = async () => {
      const {data: { user },} = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

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
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        setArtist({
          id: data.id,
          photoUrl: data.photo_url ?? "", // camelCase 변환
          name: data.name ?? "",
          bio: data.bio ?? "",
          label: data.label ?? "",
          instruments: data.instruments ?? "",
          links: (data.artist_links || []).map((l: any) => ({
            platform: l.platform,
            url: l.url
          })),
          genres: (data.artist_genres || [])
            .filter((ag: any) => ag.genres) // genres가 null인 경우 제거
            .map((ag: any) => ({
              id: ag.genres.id,
              name: ag.genres.name
            })),
        });
      }

      setLoading(false); 
    };

    init();
  }, []);

  return { artist, loading };
}