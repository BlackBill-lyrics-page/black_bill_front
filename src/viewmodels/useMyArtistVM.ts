import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useArtistStore } from "../store/useArtistStore";


export function useMyArtistVM() {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { setArtist: setStoreArtist } = useArtistStore();

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
          user_id,
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
          ),
          artist_followed(count)
        `)
        .eq("user_id", user.id)
        .maybeSingle();
    

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        const formatted = {
          id: data.id,
          userId: data.user_id,   
          photoUrl: data.photo_url ?? "",
          name: data.name ?? "",
          bio: data.bio ?? "",
          label: data.label ?? "",
          instruments: data.instruments ?? "",
          links: (data.artist_links || []).map((l: any) => ({ platform: l.platform, url: l.url })),
          genres: (data.artist_genres || [])
            .filter((ag: any) => ag.genres)
            .map((ag: any) => ({ id: ag.genres.id, name: ag.genres.name })),
          followerCount: data.artist_followed?.[0]?.count??0,
        };

        setArtist(formatted);       
        setStoreArtist(formatted);  
      }

      setLoading(false);
    };

    init();
  }, []);

  return { artist, loading };
}