import { supabase } from "./supabaseClient";

export async function getUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.clear();            
  sessionStorage.clear();          
  window.location.reload();
}