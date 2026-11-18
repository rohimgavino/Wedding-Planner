'use client';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  clearSessionLimit,
  getSessionExpiration,
  isSessionLimitExpired,
  SESSION_KEYS,
} from '@/lib/auth-policy';

interface AuthState {
  user: User | null;
  ready: boolean;
  configured: boolean;
  error: string;
  remainingMs: number | null;
  isSessionWarning: boolean;
  logout: (reason?: 'manual' | 'session_expired') => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isSessionWarning, setIsSessionWarning] = useState(false);
  const configured = isSupabaseConfigured();
  const version = useRef(0);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoggingOut = useRef(false);

  const logout = async (reason: 'manual' | 'session_expired' = 'manual') => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    if (expiryTimer.current) { clearTimeout(expiryTimer.current); expiryTimer.current = null; }
    if (tickInterval.current) { clearInterval(tickInterval.current); tickInterval.current = null; }
    clearSessionLimit(reason);
    ++version.current;
    setUser(null);
    setReady(true);
    setRemainingMs(null);
    setIsSessionWarning(false);
    try {
      const { error: signOutError } = await createClient().auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      const target = reason === 'session_expired' ? '/login?reason=session_expired' : '/login';
      window.location.replace(target);
    } catch {
      setError('Keluar gagal. Coba lagi sebelum menggunakan perangkat bersama.');
      isLoggingOut.current = false;
    }
  };

  const refresh = async () => {
    const epoch = ++version.current;
    if (!configured) { setReady(true); return; }
    if (isSessionLimitExpired()) {
      void logout('session_expired');
      return;
    }
    try {
      const { data, error: authError } = await createClient().auth.getUser();
      if (epoch !== version.current) return;
      if (authError || !data.user) {
        setUser(null);
        setError(authError ? 'Sesi tidak valid. Silakan masuk kembali.' : '');
        return;
      }
      if (isSessionLimitExpired(data.user.id)) {
        void logout('session_expired');
        return;
      }
      setUser(data.user);
      setError('');
    } catch {
      if (epoch === version.current) {
        setUser(null);
        setError('Tidak dapat memvalidasi sesi. Silakan coba lagi.');
      }
    } finally {
      if (epoch === version.current) setReady(true);
    }
  };

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    const client = createClient();
    if (window.location.pathname !== '/auth/callback' && window.location.pathname !== '/auth/callback/') {
      void refresh();
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return;
      ++version.current;
      setUser(null);
      setReady(false);
      if (event === 'SIGNED_OUT') { setReady(true); return; }
      setTimeout(() => void refresh(), 0);
    });
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++version.current;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  useEffect(() => {
    if (!user) {
      if (expiryTimer.current) { clearTimeout(expiryTimer.current); expiryTimer.current = null; }
      if (tickInterval.current) { clearInterval(tickInterval.current); tickInterval.current = null; }
      setRemainingMs(null);
      setIsSessionWarning(false);
      return;
    }

    isLoggingOut.current = false;

    const checkSession = () => {
      const session = getSessionExpiration(user.id);
      if (!session) return;
      if (session.isExpired) {
        void logout('session_expired');
        return;
      }
      setRemainingMs(session.remainingMs);
      setIsSessionWarning(session.isWarning);

      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      expiryTimer.current = setTimeout(() => {
        void logout('session_expired');
      }, session.remainingMs);
    };

    checkSession();
    tickInterval.current = setInterval(checkSession, 10000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    const onFocus = () => checkSession();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEYS.EXPIRES_AT || e.key === SESSION_KEYS.USER_ID) {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);

    return () => {
      if (expiryTimer.current) { clearTimeout(expiryTimer.current); expiryTimer.current = null; }
      if (tickInterval.current) { clearInterval(tickInterval.current); tickInterval.current = null; }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        configured,
        error,
        remainingMs,
        isSessionWarning,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider required');
  return value;
}
