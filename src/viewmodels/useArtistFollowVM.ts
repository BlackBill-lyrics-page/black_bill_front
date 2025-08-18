import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export function useArtistFollowVM(artistId?: number | string) {
  const [count, setCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!artistId) return;

    // 팔로워 수
    const { count: c } = await supabase
      .from("artist_followed")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId);
    setCount(c ?? 0);

    //내 팔로우 여부
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) {
      setFollowing(false);
      return;
    }
    const { data } = await supabase
      .from("artist_followed")
      .select("user_id")
      .eq("artist_id", artistId)
      .eq("user_id", uid)
      .maybeSingle();
    setFollowing(!!data);
  }, [artistId]);



  useEffect(() => {
    load();
  }, [load]);



  const toggle = useCallback(async () => {
    if (!artistId) return;
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) {
      navigate(`/sign-in?redirect=${encodeURIComponent(location.pathname + location.search)}`); //redirect
      setLoading(false);
      return;
    }

    const aid = Number(artistId);

    if (following) {
      const { error } = await supabase
        .from("artist_followed")
        .delete()
        .match({ user_id: uid, artist_id: aid });
      if (!error) {
        setFollowing(false);
        setCount((c) => Math.max(0, c - 1));
      }
    } 

    else {
      const { error } = await supabase
        .from("artist_followed")
        .insert({ user_id: uid, artist_id: aid });
      if (!error) {
        setFollowing(true);
        setCount((c) => c + 1);
      } 

      else if ((error as any).code === "23505") { //postgreSQL unique_violation
        setFollowing(true);
      }
    }
    setLoading(false);
  }, [artistId, following]);

  return { count, following, loading, load, toggle };
}
