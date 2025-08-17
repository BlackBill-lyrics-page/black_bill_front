import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signinwithEmail, signinwithGoogle } from '../lib/authService'

const SignInPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const redirect = params.get("redirect")||"/" //home 경로 추후 구현 '/'아님

  const handleEmailSignIn = async () => {
    const { error } = await signinwithEmail(email, password)
    if (error) {
      alert('로그인 실패: ' + error.message)
    } else {
      navigate(redirect)
    }
  }

  const handleOAuthLogin = async () => {
    const result = await signinwithGoogle();
    if (!result) {
        console.error('구글 로그인 실패');
    }
    else{
      navigate(redirect)
    }
};

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-white">
      <div className="mb-12">
        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-sm">logo</div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-100 p-3 rounded-full text-sm"
        />

        <input
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-100 p-3 rounded-full text-sm"
        />

        <button
          onClick={handleEmailSignIn}
          className="bg-gray-300 text-black py-3 rounded-full font-semibold"
        >
          로그인하기
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        처음 오셨나요?{' '}
        <button onClick={() => navigate('/sign-up')} className="text-black underline">
          회원가입하기
        </button>
      </div>

      <div className="w-full max-w-xs my-6 flex items-center">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-4 text-sm text-gray-400">또는</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleOAuthLogin}
          className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"
        >
          구글
        </button>

      </div>
    </div>
  )
}

export default SignInPage
