import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const SignUpPage = () => {
  const navigate = useNavigate()

  const handleOAuthLogin = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/oauth/callback` },
    })
    if (error) console.error(`${provider} 로그인 실패:`, error.message)
  }

  return (
    // 배경은 회색으로, 카드를 가운데 배치 (EmailSignUpForm와 동일 느낌)
    <div className="min-h-screen px-6 bg-gray-100 flex items-center">
      {/* ✅ EmailSignUpForm의 카드와 동일한 컨테이너 */}
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl shadow-md bg-white transition-all duration-300 h-[620px] overflow-hidden flex flex-col">
        {/* 상단 좌측 로고 + 타이틀 (위치 동일) */}
        <div>
          <img src="/logo.png" alt="logo" className="w-12 h-12" />
          <div className="mt-2 text-2xl font-semibold">BlackBill</div>
        </div>

        {/* EmailSignUpForm에서 인풋 전까지 주던 여백 감(예: pt-12)과 유사한 공간 확보 */}
        <div className="pt-12" />

        {/* 본문 버튼 영역: 아래로 내리기 위해 flex-1로 공간 확보 후 하단에 배치 */}
        <div className="flex-1" />

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/sign-up_email')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 text-sm font-medium rounded-full"
          >
            이메일 회원가입
          </button>

          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 text-sm font-medium rounded-full"
          >
            구글 회원가입
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
