import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { signupwithEmail } from '../lib/authService'

function translateSupabaseError(message: string): string {
  if (message.includes("Unable to validate email address")) {
    return "이메일 주소 형식이 올바르지 않습니다."
  }
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일입니다."
  }
  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다."
  }
  return "알 수 없는 오류가 발생했습니다."
}

export const validatePassword = (pw: string): boolean => { //password validifying function
      const isLengthValid = pw.length >= 8 && pw.length <= 20

      const hasLetter = /[a-zA-Z]/.test(pw)
      const hasNumber = /[0-9]/.test(pw)
      const hasSpecial = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(pw)

      const typesCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length

      return isLengthValid && typesCount >= 2
    }


export const useSignUpVM = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)  //explicit type=string or null
    const [passwordError, setPasswordError] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    
    const handleSignup = async (): Promise<boolean>=> {
        setLoading(true)
        setError(null)

         if (!email || email.trim() === "") {
          alert("이메일을 입력해주세요.")
          setLoading(false)
          return false
        }

        if (!validatePassword(password)) {
          setPasswordError(true)
          setLoading(false)
          return false
        }
        setPasswordError(false)

        const {data, error} = await signupwithEmail(email, password)

        if (error){
            alert(translateSupabaseError(error.message))
            setLoading(false)
            return false
        }
        else{
            if (data.user){
                const {error: inserError}=await supabase.from('users').insert({
                id :data.user.id,
                email:data.user.email,
            })

                if (inserError){
                    console.error('DB saving failure', inserError.message)
                    alert(translateSupabaseError(inserError.message))
                    setLoading(false)
                    return false
                }
                else{
                    setLoading(false)
                    return true
                } 
            }
            else{
                alert("회원가입 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.")
                setLoading(false)
                return false
            }

        }

    }

    return {
        email, setEmail,
        password, setPassword,
        loading, error, handleSignup,
        passwordError, setPasswordError,
    }
}