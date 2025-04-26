import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSession() {
  return await supabase.auth.getSession();
}

export async function login(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signup(email, password, firstName, lastName) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });
}

export async function logout() {
  return await supabase.auth.signOut();
}