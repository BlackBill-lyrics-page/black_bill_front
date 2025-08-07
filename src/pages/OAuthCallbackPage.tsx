import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user

      if (!user) {
        console.error('login information failure')
        return
      }

      navigate('/') //추후에 홈화면 경로로 변경 
    }

    checkUser()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>로그인 확인...</p>
    </div>
  )
}

export default OAuthCallbackPage
