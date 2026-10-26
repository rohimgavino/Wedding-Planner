import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { validConfig } from '@/lib/auth-policy';
let client: SupabaseClient | null = null;
export function isSupabaseConfigured() {
  return validConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
export function createClient() {
  if (!isSupabaseConfigured()) throw new Error('Login cloud belum dikonfigurasi. Akses workspace dinonaktifkan.');
  if (!client) client = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
