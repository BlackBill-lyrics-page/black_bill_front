import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signinwithEmail, signinwithGoogle } from '../lib/authService'
import AuthShell from "../components/login/AuthShell";
import AuthCard from "../components/login/AuthCard";
import AuthHeader from "../components/login/AuthHeader";


const SignInPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const params = new URLSearchParams(window.location.search); // window.location 권장
  const rawRedirect = params.get("redirect");
  const redirect = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/sign-in";

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.")
      return
    }
  
    const { error } = await signinwithEmail(email, password)
    if (error) {
      let msg = "로그인 실패"
      if (error.message.includes("Invalid login credentials")) {
        msg = "이메일 또는 비밀번호가 올바르지 않습니다."
      }
      alert(msg)
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
    <AuthShell>
      <AuthCard>
        <AuthHeader title="BlackBill"/>
        <div className='flex flex-1 flex-col justify-center items-center'>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleEmailSignIn()
            }}
            className="w-full px-4 flex flex-col gap-3 mt-40"
          >
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
              type="submit"   
              className="bg-gray-200 text-black py-3 font-semibold cursor-pointer"
            >
              로그인하기
            </button>
          </form>

           <div className='mt-4 justify-between flex items-center w-full max-w-xs'>
             <div className=" text-sm text-gray-500">
               처음 오셨나요?{' '}  
             </div>
             <button onClick={() => navigate('/sign-up')} className="text-black cursor-pointer text-sm">
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
               className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"
             >
               구글
             </button>

           </div>
        </div>      
      </AuthCard>
    </AuthShell>
    
  )
}

export default SignInPage
