import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { signOut as authSignOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export function useMyAudienceVM() {
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>("/default-profile.svg"); 
  const [userId, setUserId] = useState("");
  const [provider, setProvider] = useState("");  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate= useNavigate();

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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      await supabase.auth.signOut();
      navigate("/sign-in", { replace: true });
      return;
    }
  
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/account-delete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "unknown error" }));
      console.error("account-delete failed:", error);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
      return;
    }
  
    // 세션 정리
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }, [navigate]);

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
