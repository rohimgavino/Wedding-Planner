import type { SupabaseClient } from '@supabase/supabase-js';
export function validConfig(url?: string, key?: string) {
  if (!url || !key || /placeholder/i.test(url + key)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false;
    if (key.startsWith('sb_secret_')) return false;
    if (key.startsWith('sb_publishable_')) return true;
    const payload = JSON.parse(atob(key.split('.')[1] || ''));
    return payload.role === 'anon';
  } catch { return false; }
}
export function safeNext(value: string | null) {
  if (value === '/onboarding' || value === '/dashboard' || value === '/admin' || value === '/purchase') return value;
  if (value && /^\/invite\?token=[a-f0-9]{64}$/.test(value)) return value;
  return '/dashboard';
}
export async function completeCallback(auth: SupabaseClient['auth'], url: URL) {
  if (url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error')) throw new Error('Login dibatalkan atau gagal. Silakan coba lagi.');
  const code = url.searchParams.get('code');
  if (code) { const { error } = await auth.exchangeCodeForSession(code); if (error) throw new Error('Login gagal. Silakan ulangi dari perangkat yang sama.'); }
  const { data, error } = await auth.getUser();
  if (error || !data.user) throw new Error('Sesi tidak valid. Silakan masuk kembali.');
  return data.user;
}
