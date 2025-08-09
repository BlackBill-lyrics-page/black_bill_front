import { supabase } from '../lib/supabaseClient'

const SignUpPage = () => {
  const handleOAuthLogin = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,  //window.location.origin -> return current web page's protocol, host, port
      },   
    })
    if (error) console.error(`${provider} 로그인 실패:`, error.message)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">logo</div>

      <button
        onClick={() => window.location.href = '/sign-up_email'}
        className="border p-2 w-60 rounded"
      >
        이메일 회원가입
      </button>

      <button
        onClick={() => handleOAuthLogin('google')}
        className="border p-2 w-60 rounded bg-red-500 text-white text-3xl"
      >
        구글 회원가입
      </button>
    </div>
  )
}

export default SignUpPage
