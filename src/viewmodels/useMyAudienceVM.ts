import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useMyAudienceVM() {
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState("/default-profile.svg"); // (기본프로필사진)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [provider, setProvider] = useState("");  //social login 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setProvider(user.app_metadata?.provider || "");
      }
    };
    getUser();
  }, []);


  useEffect(() => {
    if (!userId) return;
    const fetchUserInfo = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, photo_url")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setNickname(data.username || "");
        setPhotoUrl(data.photo_url || "/default-profile.svg");
      }
    };

    fetchUserInfo();
  }, [userId]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return {
    nickname,
    photoUrl,
    isModalOpen,
    openModal,
    closeModal,
    userId,
    provider,
  };
}
