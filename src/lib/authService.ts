import { supabase } from './supabaseClient'

export async function signupwithEmail(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  })
}

export async function signinwithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signinwithGoogle(){
  const { data, error}=await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error){
    console.error('google login failure', error.message)
    return null
  }

  return data
}