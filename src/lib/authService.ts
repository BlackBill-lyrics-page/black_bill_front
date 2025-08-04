import { supabase } from './supabaseClient'

export async function signupwithEmail(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  })
}