'use client';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
interface AuthState { user: User | null; ready: boolean; configured: boolean; error: string; logout: () => Promise<void>; refresh: () => Promise<void> }
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({children}: {children: ReactNode}) {
 const [user,setUser] = useState<User | null>(null);
 const [ready,setReady] = useState(false);
 const [error,setError] = useState('');
 const configured = isSupabaseConfigured();
 const version = useRef(0);
 const refresh = async () => {
  const epoch = ++version.current;
  if (!configured) {setReady(true);return;}
  try {
   const {data,error:authError} = await createClient().auth.getUser();
   if (epoch !== version.current) return;
   setUser(authError ? null : data.user);
   setError(authError ? 'Sesi tidak valid. Silakan masuk kembali.' : '');
  } catch {if(epoch === version.current){setUser(null);setError('Tidak dapat memvalidasi sesi. Silakan coba lagi.');}}
  finally {if(epoch === version.current)setReady(true);}
 };
 useEffect(()=>{
  if (!configured) {setReady(true);return;}
  const client = createClient();
  // Callback explicitly exchanges PKCE code, then validates identity.
  if (window.location.pathname !== '/auth/callback' && window.location.pathname !== '/auth/callback/') void refresh();
  const {data:{subscription}} = client.auth.onAuthStateChange((event)=>{
   if (event === 'INITIAL_SESSION') return;
   ++version.current;setUser(null);setReady(false);
   if (event === 'SIGNED_OUT') {setReady(true);return;}
   // Do not call auth methods inside Supabase's locked event callback.
   setTimeout(()=>void refresh(),0);
  });
  // Cancellation counters are not DOM refs; cleanup intentionally invalidates pending async work.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return ()=>{++version.current;subscription.unsubscribe();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[configured]);
 const logout = async () => {
  ++version.current;setUser(null);setReady(true);
  try { const {error} = await createClient().auth.signOut({scope:'local'}); if(error)throw error; window.location.replace('/login'); }
  catch {setError('Keluar gagal. Coba lagi sebelum menggunakan perangkat bersama.');}
 };
 return <AuthContext.Provider value={{user,ready,configured,error,logout,refresh}}>{children}</AuthContext.Provider>;
}
export function useAuth() {const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider required');return value;}
