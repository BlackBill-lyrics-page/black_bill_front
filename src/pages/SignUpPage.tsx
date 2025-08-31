import AuthShell from "../components/login/AuthShell";
import AuthCard from "../components/login/AuthCard";
import AuthHeader from "../components/login/AuthHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function SignUpPage() {
  const navigate = useNavigate();

  const handleOAuthLogin = async (provider: "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/oauth/callback` },
    });
    if (error) console.error(`${provider} 로그인 실패:`, error.message);
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader title="BlackBill" />

        <div className="flex-1 px-6">
          {/* <div className="pt-12" /> */}
          {/* <div className="flex-1" /> */}

          <div className="w-full space-y-3 pb-6 mt-40">
            <button
              onClick={() => navigate("/sign-up_email")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 text-sm font-medium "
            >
              이메일 회원가입
            </button>

            <button
              onClick={() => handleOAuthLogin("google")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 text-sm font-medium "
            >
              구글 회원가입
            </button>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
