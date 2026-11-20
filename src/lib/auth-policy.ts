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

export const TESTER_BYPASS_EMAILS = [
  'setiarama1997@gmail.com',
];

export function isTesterBypassEmail(email?: string | null): boolean {
  if (!email) return false;
  return TESTER_BYPASS_EMAILS.includes(email.trim().toLowerCase());
}

export const ADMIN_ALLOWED_EMAILS = [
  'ahmadnurrochim11@gmail.com',
  'setiarama1997@gmail.com',
  'fixture@example.test',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

// =========================================================
// SESSION LIMIT MANAGEMENT (1 Jam Auto-Logout)
// =========================================================

export const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 jam (3.600.000 ms)
export const SESSION_WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 menit sebelum batas waktu

export const SESSION_KEYS = {
  LOGIN_TIME: 'pw_session_login_time',
  EXPIRES_AT: 'pw_session_expires_at',
  USER_ID: 'pw_session_user_id',
  REASON: 'pw_session_logout_reason',
} as const;

export interface SessionLimitInfo {
  loginTime: number;
  expiresAt: number;
  remainingMs: number;
  isExpired: boolean;
  isWarning: boolean;
  userId: string;
}

export function initSessionLimit(userId: string, durationMs: number = SESSION_DURATION_MS): SessionLimitInfo {
  const now = Date.now();
  const expiresAt = now + durationMs;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(SESSION_KEYS.LOGIN_TIME, now.toString());
      localStorage.setItem(SESSION_KEYS.EXPIRES_AT, expiresAt.toString());
      localStorage.setItem(SESSION_KEYS.USER_ID, userId);
      localStorage.removeItem(SESSION_KEYS.REASON);
    } catch {
      // LocalStorage fallback for sandbox / restricted mode
    }
  }
  return {
    loginTime: now,
    expiresAt,
    remainingMs: durationMs,
    isExpired: false,
    isWarning: false,
    userId,
  };
}

export function clearSessionLimit(reason?: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(SESSION_KEYS.LOGIN_TIME);
      localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
      localStorage.removeItem(SESSION_KEYS.USER_ID);
      if (reason) {
        localStorage.setItem(SESSION_KEYS.REASON, reason);
      } else {
        localStorage.removeItem(SESSION_KEYS.REASON);
      }
    } catch {
      // LocalStorage fallback
    }
  }
}

export function getSessionExpiration(userId?: string | null, durationMs: number = SESSION_DURATION_MS): SessionLimitInfo | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const rawExpiresAt = localStorage.getItem(SESSION_KEYS.EXPIRES_AT);
    const rawLoginTime = localStorage.getItem(SESSION_KEYS.LOGIN_TIME);
    const storedUserId = localStorage.getItem(SESSION_KEYS.USER_ID);

    if (!rawExpiresAt || !storedUserId) {
      if (userId) {
        return initSessionLimit(userId, durationMs);
      }
      return null;
    }

    if (userId && storedUserId !== userId) {
      return initSessionLimit(userId, durationMs);
    }

    const expiresAt = Number(rawExpiresAt);
    const loginTime = rawLoginTime ? Number(rawLoginTime) : expiresAt - durationMs;
    const now = Date.now();
    const remainingMs = Math.max(0, expiresAt - now);
    const isExpired = now >= expiresAt;
    const isWarning = !isExpired && remainingMs <= SESSION_WARNING_BEFORE_MS;

    return {
      loginTime,
      expiresAt,
      remainingMs,
      isExpired,
      isWarning,
      userId: storedUserId,
    };
  } catch {
    return null;
  }
}

export function isSessionLimitExpired(userId?: string | null): boolean {
  const session = getSessionExpiration(userId);
  return session ? session.isExpired : false;
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  }
  return `${seconds}s`;
}

