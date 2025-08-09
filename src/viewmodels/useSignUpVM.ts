import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { signupwithEmail } from '../lib/authService'


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

        if (!validatePassword(password)) {
          setPasswordError(true)
          setLoading(false)
          return false
        }
        setPasswordError(false)

        const {data, error} = await signupwithEmail(email, password)

        if (error){
            setError(error.message)
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
                    setError('saving error occurs')
                    setLoading(false)
                    return false
                }
                else{
                    setLoading(false)
                    return true
                } 
            }
            else{
                setError('user information is missing')
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