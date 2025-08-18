// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // 개발 중 문제를 빨리 눈치채기 위한 가드 (배포에서도 조기 실패가 낫습니다)
  // 필요하면 console.warn 으로만 바꿔도 됨
  throw new Error(
    'Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  // ✅ 보강: apikey를 전역 헤더로 명시(중복되어도 문제 없음)
  global: { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } },
})
