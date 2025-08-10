import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useUserStore } from "../store/useUserStore";

export default function ProfileModal({open, onClose, userId, provider}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  provider: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nickname?: string; password?: string }>({});
  const [checkingNick, setCheckingNick] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null); 
  const setUser = useUserStore((s) => s.setUser);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {  //HTMLInputElement {type: "file"}
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);

    if (file) {
      const newUrl = URL.createObjectURL(file);
      setPhotoPreview(newUrl);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl); // saving in newUrl and freeing memory
      }
      setObjectUrl(newUrl);
    }

    else{
      if (objectUrl) {  // cancel selecting -> URL freeing and initialization
        URL.revokeObjectURL(objectUrl); 
        setObjectUrl(null);
      }
      setPhotoPreview(null);
    }
  };

  useEffect(() => {
    return () => {  //If your effect returns a function, React will run it when it is time to clean up.  (when unmounted, or objecturl is changed)
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);


  useEffect(() => setMounted(true), []);

  // existing nickname, photo loading
  useEffect(() => {
    if (!open) return;

    const fetchUserInfo = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, photo_url")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setNickname(data.username || "");
        setPhotoPreview(data.photo_url || "/default-profile.svg"); //  public/default-profile.svg
      }
    };

    fetchUserInfo();
  }, [open]);

  // nickname
  useEffect(() => {
    if (!nickname) {
      setErrors((prev) => ({ ...prev, nickname: undefined }));
      return;
    }

    const timer = setTimeout(async () => {
      if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(nickname)) {
        setErrors((prev) => ({
          ...prev,
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

      if (error) {
        console.error(error);
        return;
      }
      if (exists) {
        setErrors((prev) => ({ ...prev, nickname: "존재하는 닉네임입니다." }));
      } else {
        setErrors((prev) => ({ ...prev, nickname: undefined }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [nickname, userId]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
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
      setErrors((prev) => ({
        ...prev,
        password: "8~20자, 영문/숫자/특수문자 중 2가지 이상 포함",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [password]);

  useEffect(() => { // reset information whenever modal is closed
      if (!open) {
        setNickname("");
        setPassword("");
        setPhotoFile(null);
        setPhotoPreview(null);
        setErrors({});
        setCheckingNick(false);
      }
    }, [open]);

  if (!mounted || !open) return null; // must be located below Hook(useEffect, useState)

  // 프로필 저장
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
        photo_url = supabase.storage
          .from("user-photo")
          .getPublicUrl(data.path).data.publicUrl;
      }

      await supabase
        .from("users")
        .update({ username: nickname, ...(photo_url && { photo_url }) })
        .eq("id", userId);

      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({
          password,
        });
        if (pwError) throw pwError;
      }

      setUser({
        username: nickname,
        photoUrl: (photo_url ?? photoPreview ?? "/default-profile.svg"),
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert("프로필 수정 실패");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white p-6 rounded-xl w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()} // prevent onClose from parent onClick
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">프로필 수정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <label className="text-sm font-medium block mb-2">프로필 사진</label>
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* 사진 미리보기 */}
            <img
              src={photoPreview || "/default-profile.svg"} // ✅ object URL은 photoPreview로만 관리
              alt="프로필 미리보기"
              className="w-24 h-24 rounded-full object-cover border"
            />

            {/* + 버튼 */}
            <label
              htmlFor="file-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-white border rounded-full flex items-center justify-center cursor-pointer shadow"
            >
              +
            </label>
          
            {/* 숨겨진 파일 입력 */}
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={onFileChange} 
              className="hidden"
            />
          </div>
        </div>


        {/* nickname */}
        <label className="text-sm font-medium">닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={`w-full border rounded px-3 py-2 mb-1 ${
            errors.nickname ? "border-red-400" : "border-gray-300"
          }`}
        />
        {/* {checkingNick && <p className="text-xs text-gray-500 mb-1">중복 확인</p>} */}
        {errors.nickname && <p className="text-sm text-red-500 mb-3">{errors.nickname}</p>}


        {/* password */}
        {provider !== "google" && (
          <>
            <label className="text-sm font-medium">비밀번호 입력</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded px-3 py-2 mb-1 ${
                errors.password ? "border-red-400" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500">
              8~20자, 영문/숫자/특수문자 중 2가지 이상 포함
            </p>
            {errors.password && <p className="text-sm text-red-500 mb-3">{errors.password}</p>}
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading || checkingNick}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
