import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export type UIArtist = {
  id: number;
  name: string;
  photoUrl?: string | null;
  genre?: string | null;
};

export function useFollowedArtists(userId: string | null | undefined) {
  const [artists, setArtists] = useState<UIArtist[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArtists = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("artist_followed")
      .select(`
        artists:artist_id (
          id, name, photo_url, 
          artist_genres(
            genres:genre_id(id, name)
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[artist_followed join artists]", error);
      setArtists([]);
      setLoading(false);
      return;
    }

    const ui =
      (data ?? [])
        .map((row: any) => {
          const a = row.artists;
          if (!a) return null;

          const genres=(a.artist_genres??[])
            .map((ag: any)=>ag?.genres?.name)
            .filter(Boolean);

          return {
            id: a.id,
            name: a.name ?? "(이름 없음)",
            photoUrl: a.photo_url ?? null,
            genre: genres.length ? genres.join(", ") : null,
          } as UIArtist;
        })
        .filter(Boolean) as UIArtist[];

    setArtists(ui);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  return { artists, loading, refetch: fetchArtists };
}
