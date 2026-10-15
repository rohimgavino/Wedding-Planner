'use client';
import { useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PlannerDialog } from './planner-dialog';
import './logout-button.css';

export function LogoutButton() {
 const { logout } = useAuth();
 const [open,setOpen] = useState(false);
 const [pending,setPending] = useState(false);
 const [error,setError] = useState('');
 const locked = useRef(false);
 const close = () => { if (!locked.current) setOpen(false); };
 const confirm = async () => {
  if (locked.current) return;
  locked.current = true;setPending(true);setError('');
  try { await logout(); }
  catch { setError('Keluar gagal. Silakan coba lagi sebelum menggunakan perangkat bersama.'); }
  finally { locked.current = false;setPending(false); }
 };
 return <div className="account-toolbar">
  <button type="button" className="account-logout" onClick={()=>{setError('');setOpen(true);}} aria-haspopup="dialog"><LogOut size={17} aria-hidden="true"/><span>Keluar</span></button>
  {open && <PlannerDialog title="Keluar dari akun?" onClose={close}>
   <div className="logout-confirm">
    <div className="logout-symbol"><LogOut size={24} aria-hidden="true"/></div>
    <h2>Keluar dari akun?</h2>
    <p>Data yang sudah tersimpan di cloud tetap aman. Masuk kembali untuk melanjutkan rencana pernikahanmu.</p>
    {error && <p role="alert" className="logout-error">{error}</p>}
    <div className="logout-actions" aria-busy={pending}>
     <button type="button" disabled={pending} onClick={close}>Batal</button>
     <button type="button" className="logout-confirm-action" disabled={pending} onClick={()=>void confirm()}>{pending ? 'Sedang keluar…' : 'Keluar'}</button>
    </div>
   </div>
  </PlannerDialog>}
 </div>;
}
