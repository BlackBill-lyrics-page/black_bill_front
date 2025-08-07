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

      const { data: existingUser, error: fetchError } = await supabase
        .from('users') 
        .select('*')
        .eq('email', user.email) //email 중복 확인
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking user:', fetchError.message)
        return
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          username: user.email, //소셜로그인 처음엔 이메일
          email: user.email,
          role: 'user',
          photo_url: user.user_metadata?.avatar_url || null,
        })

        if (insertError) {
          console.error('Error inserting user:', insertError.message)
          return
        }
      }

      navigate('/') // 홈으로 이동 추후 구현
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
