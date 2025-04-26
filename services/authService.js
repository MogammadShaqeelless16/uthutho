import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with proper env variable checks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    Missing Supabase environment variables!
    Please check your .env file and make sure:
    VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions remain the same...
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
        last_name: lastName,
        preferred_transport: null,
      },
    },
  });
}

export async function logout() {
  return await supabase.auth.signOut();
}