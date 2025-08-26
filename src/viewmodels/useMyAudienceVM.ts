import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { signOut as authSignOut } from "../lib/auth";

export function useMyAudienceVM() {
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>("/default-profile.svg"); 
  const [userId, setUserId] = useState("");
  const [provider, setProvider] = useState("");  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!user) {
        setUserId("");
        setProvider("");
        setNickname("");
        setPhotoUrl(null);
        return;
      }

      setUserId(user.id);
      setProvider(user.app_metadata?.provider || "");

     
      const { data: profile, error } = await supabase
        .from("users")
        .select("username, photo_url")
        .eq("id", user.id)
        .single();
 

      if (error) throw error;

      setNickname(profile?.username || "");
      setPhotoUrl(profile?.photo_url || null);
    } catch (e: any) {

      setError(e?.message ?? "failed to load profile");
    } finally {

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = load;

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    await signOut(); //추후구현
  }, [signOut]);

  return {
    nickname,
    photoUrl,
    userId,
    provider,
    loading,
    error,
    refresh,
    signOut,
    deleteAccount,
  };
}
