// Supabase client — single instance shared across the app. Reads
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env (see .env.example).
//
// The anon key is safe to ship in the client bundle: Row-Level Security
// policies enforce per-user isolation server-side. Never put the SERVICE
// ROLE key here; it would bypass RLS.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly so a misconfigured deploy doesn't silently hand users an
  // app that can't auth. The login screen surfaces this for end-users.
  // eslint-disable-next-line no-console
  console.error(
    'Supabase env vars missing. Copy .env.example to .env and fill in ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.'
  );
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for OAuth redirect flow
  },
});

export const isSupabaseConfigured = () => Boolean(url && anonKey);
