import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { signupwithEmail } from '../lib/authService'

export const useSignUpVM = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [nickname, setNickname] = useState('')

    const [error, setError] = useState<string | null>(null)  //explicit type=string or null
    const [loading, setLoading] = useState(false)

    const handleSignup = async () => {
        setLoading(true)
        setError(null)

        const {data, error} = await signupwithEmail(email, password)

        console.log("🔥 Supabase signup result")
        console.log("data:", data)
        console.log("error:", error)  // 전체 error 객체 확인 가능

        if (error){
            setError(error.message)
        }
        else{
            if (data.user){
                const {error: inserError}=await supabase.from('users').insert({
                id :data.user.id,
                username: nickname,
                email:data.user.email,
            })

            if (inserError){
                console.error('DB saving failure', inserError.message)
                setError('saving error occurs')
            }
            else{
                alert('successful signup')
            }
            } 
            else{
                setError('user information is missing')
            }

        }

        setLoading(false)
    }

    return {
        email, setEmail,
        password, setPassword,
        nickname, setNickname,
        loading, error, handleSignup
    }
}