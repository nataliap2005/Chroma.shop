import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase no está configurado. Completa .env.local y reinicia Vite.');
  return supabase;
}
