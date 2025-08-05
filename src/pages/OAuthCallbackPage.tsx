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

      const { data, error } = await supabase //checking DB for duplicated signup
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {  //no rows found
        navigate('/complete-profile') //***complete로할지 추후 수정
      } else {
        navigate('/')
      }
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
