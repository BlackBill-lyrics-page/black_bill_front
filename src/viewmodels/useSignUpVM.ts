import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { signupwithEmail } from '../lib/authService'

export const useSignUpVM = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)  //explicit type=string or null
    const [loading, setLoading] = useState(false)

    const validatePassword = (pw: string): boolean => { //password validifying function
      const isLengthValid = pw.length >= 8 && pw.length <= 20

      const hasLetter = /[a-zA-Z]/.test(pw)
      const hasNumber = /[0-9]/.test(pw)
      const hasSpecial = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(pw)

      const typesCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length

      return isLengthValid && typesCount >= 2
    }

    const handleSignup = async () => {
        setLoading(true)
        setError(null)

        if (!validatePassword(password)) {
          setError('비밀번호는 8~20자이며, 영문/숫자/특수문자 중 2가지 이상을 포함해야 합니다.')
          setLoading(false)
          return
        }

        const {data, error} = await signupwithEmail(email, password)

        if (error){
            setError(error.message)
        }
        else{
            if (data.user){
                const {error: inserError}=await supabase.from('users').insert({
                id :data.user.id,
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
        loading, error, handleSignup
    }
}