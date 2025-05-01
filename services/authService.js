import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add these new profile-related functions
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data;
}

export async function createProfile(userId, firstName, lastName) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        selected_title: 'Newbie Explorer'
      }
    ]);
    
  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }
  return data;
}

// Update the signup function to create a profile
export async function signup(email, password, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (error) return { error };

  // Create profile after successful signup
  if (data.user) {
    await createProfile(data.user.id, firstName, lastName);
  }

  return { data };
}

// Update getSession to include profile data
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) return { data: { session: null }, error };
  
  const profile = await getProfile(session.user.id);
  return {
    data: {
      session: {
        ...session,
        user: {
          ...session.user,
          profile
        }
      }
    },
    error
  };
}

// Keep existing functions
export async function login(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
  return await supabase.auth.signOut();
}