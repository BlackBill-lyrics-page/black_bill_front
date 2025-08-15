// src/viewmodels/useProfileModalVM.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "../store/useUserStore";

type Errors = { nickname?: string; password?: string };

export function useProfileModalVM({
  open,
  userId,
}: {
  open: boolean;
  userId: string;
}) {
  const setUser = useUserStore((s) => s.setUser);

  const [nickname, setNickname] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingNick, setCheckingNick] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const applyCroppedPhoto = (file: File, previewUrl: string) => {
      setPhotoFile(file);
      setPhotoPreview(previewUrl);
    };

  // 열릴 때 사용자 닉/사진 로딩
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, photo_url")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setNickname(data.username || "");
        setPhotoPreview(data.photo_url || "/default-profile.svg");
      }
    })();
  }, [open, userId]);

  // 닉네임 검증 + 중복확인(디바운스)
  useEffect(() => {
    if (!nickname) {
      setErrors((p) => ({ ...p, nickname: undefined }));
      return;
    }

    const timer = setTimeout(async () => {
      if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(nickname)) {
        setErrors((p) => ({
          ...p,
          nickname: "닉네임은 한글/영문/숫자 2~10자여야 합니다.",
        }));
        return;
      }

      setCheckingNick(true);
      const { data: exists, error } = await supabase
        .from("users")
        .select("id")
        .eq("username", nickname)
        .neq("id", userId)
        .maybeSingle();
      setCheckingNick(false);

      if (error) return;
      setErrors((p) => ({
        ...p,
        nickname: exists ? "존재하는 닉네임입니다." : undefined,
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [nickname, userId]);

  // 비밀번호 검증
  useEffect(() => {
    if (!password) {
      setErrors((p) => ({ ...p, password: undefined }));
      return;
    }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password);

    if (
      password.length < 8 ||
      password.length > 20 ||
      [hasLetter, hasNumber, hasSymbol].filter(Boolean).length < 2
    ) {
      setErrors((p) => ({
        ...p,
        password: "8~20자, 영문/숫자/특수문자 중 2가지 이상 포함",
      }));
    } else {
      setErrors((p) => ({ ...p, password: undefined }));
    }
  }, [password]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (open) return;
    setNickname("");
    setPassword("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors({});
    setCheckingNick(false);
  }, [open]);

  // 저장
  const handleSubmit = async () => {
    if (errors.nickname || errors.password) return;

    try {
      setLoading(true);
      let photo_url: string | null = null;

      if (photoFile) {
        const { data, error } = await supabase.storage
          .from("user-photo")
          .upload(`${userId}/${Date.now()}`, photoFile, { upsert: true });
        if (error) throw error;

        const { data: pub } = supabase.storage
          .from("user-photo")
          .getPublicUrl(data.path);
        photo_url = pub.publicUrl;
      }

      await supabase
        .from("users")
        .update({ username: nickname, ...(photo_url && { photo_url }) })
        .eq("id", userId);

      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;
      }

      setUser({
        username: nickname,
        photoUrl: photo_url ?? photoPreview ?? "/default-profile.svg",
      });

      return true; 
    } catch (e) {
      console.error(e);
      alert("프로필 수정 실패");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    nickname,
    setNickname,
    password,
    setPassword,
    photoPreview,
    checkingNick,
    loading,
    errors,
    handleSubmit,
    applyCroppedPhoto,
  };
}
