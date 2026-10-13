"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { BudgetItem, TaskItem, GuestItem } from '@/types';
import { CloudWorkspace, CloudSnapshot, WorkspaceParams } from '@/lib/cloud-workspace';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { STORAGE_KEY, LEGACY_KEY } from '@/lib/workspace-storage';
type NewGuest = Omit<GuestItem,'id'|'workspace_id'>;
interface WorkspaceContextType extends CloudSnapshot {
 inviteToken: string; isLoaded: boolean; error: string; busy: boolean;
 createWorkspace: (params: WorkspaceParams) => Promise<boolean>;
 addBudget: (item: Omit<BudgetItem,'id'|'workspace_id'>) => Promise<boolean>;
 updateBudget: (id: string, updates: Partial<BudgetItem>) => Promise<boolean>;
 deleteBudget: (id: string) => Promise<boolean>;
 toggleTask: (id: string) => Promise<boolean>;
 addTask: (item: Omit<TaskItem,'id'|'workspace_id'|'is_completed'>) => Promise<boolean>;
 deleteTask: (id: string) => Promise<boolean>;
 addGuest: (item: NewGuest) => Promise<boolean>;
 addGuests: (items: NewGuest[]) => Promise<boolean>;
 updateGuest: (id: string, updates: Partial<GuestItem>) => Promise<boolean>;
 deleteGuest: (id: string) => Promise<boolean>;
 issueInvite: () => Promise<boolean>;
 acceptInvite: (token: string) => Promise<boolean>;
 reload: () => Promise<boolean>;
}
const empty = (): CloudSnapshot => ({workspace:null,budgets:[],tasks:[],guests:[],members:[]});
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
export function WorkspaceProvider({children}: {children: React.ReactNode}) {
 const {user,ready,configured} = useAuth();
 const [snapshot,setSnapshot] = useState<CloudSnapshot>(empty);
 const [loaded,setLoaded] = useState(false), [error,setError] = useState(''), [busy,setBusy] = useState(false);
 const [inviteToken,setInviteToken] = useState(''), [legacy,setLegacy] = useState(false);
 const identity = useRef(user?.id); identity.current = user?.id;
 const lock = useRef(false), generation = useRef(0), owner = useRef<string>(), activeId = useRef<string>();
 const visible = owner.current === user?.id && !!user ? snapshot : empty();
 const reload = async () => {
  const uid = identity.current, epoch = ++generation.current;
  if (!uid || !configured) return false;
  try {
   const data = await new CloudWorkspace(createClient()).load(activeId.current);
   if (uid !== identity.current || epoch !== generation.current) return false;
   owner.current = uid;setSnapshot(data);setError('');setLoaded(true);return true;
  } catch {if(uid === identity.current && epoch === generation.current){setError('Workspace cloud tidak dapat dimuat. Tidak ada fallback ke data lokal. Coba muat ulang.');setLoaded(true);}return false;}
 };
 useEffect(()=>{try {setLegacy(localStorage.getItem(STORAGE_KEY)!==null || localStorage.getItem(LEGACY_KEY)!==null);} catch {setLegacy(true);}},[]);
 useEffect(()=>{
  ++generation.current;owner.current=undefined;activeId.current=undefined;
  setSnapshot(empty());setInviteToken('');setError('');setLoaded(false);
  if (ready && user && configured) void reload(); else if (ready) setLoaded(true);
  if (!user) return;
  const timer = window.setInterval(()=>{if(!lock.current)void reload();},30000);
  const focus = ()=>{if(!lock.current)void reload();};window.addEventListener('focus',focus);
  // Cancellation counters are not DOM refs; cleanup intentionally invalidates pending async work.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return ()=>{++generation.current;window.clearInterval(timer);window.removeEventListener('focus',focus);};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user?.id,ready,configured]);
 const run = async (action: (cloud: CloudWorkspace, id: string) => Promise<unknown>, requireWorkspace = true) => {
  if (lock.current) return false;
  const uid=identity.current;
  if (!uid || !configured || (requireWorkspace && !visible.workspace)) {setError('Login dan workspace cloud diperlukan.');return false;}
  lock.current=true;setBusy(true);setError('');
  try {await action(new CloudWorkspace(createClient()),visible.workspace?.id || '');if(uid !== identity.current)return false;return await reload();}
  catch (err) {if(uid === identity.current)setError(err instanceof Error ? err.message : 'Operasi cloud gagal. Silakan coba lagi.');return false;}
  finally {lock.current=false;setBusy(false);}
 };
 const value: WorkspaceContextType = {
  ...visible,inviteToken: user && owner.current===user.id ? inviteToken : '',isLoaded:ready && loaded,error,busy,reload,
  createWorkspace: params=>run(async cloud=>{activeId.current=await cloud.create(params);},false),
  addBudget: item=>run((cloud,id)=>cloud.insert('budgets',id,{...item})),
  updateBudget: (key,item)=>run((cloud,id)=>cloud.update('budgets',id,key,{...item})),
  deleteBudget: key=>run((cloud,id)=>cloud.remove('budgets',id,key)),
  addTask: item=>run((cloud,id)=>cloud.insert('tasks',id,{...item,is_completed:false})),
  toggleTask: key=>run((cloud,id)=>{const task=visible.tasks.find(t=>t.id===key);if(!task)throw new Error('Tugas tidak ditemukan.');return cloud.update('tasks',id,key,{is_completed:!task.is_completed});}),
  deleteTask: key=>run((cloud,id)=>cloud.remove('tasks',id,key)),
  addGuest: item=>run((cloud,id)=>cloud.insert('guests',id,{...item})),
  addGuests: items=>run((cloud,id)=>cloud.insertGuests(id,items.map(item=>({...item})))),
  updateGuest: (key,item)=>run((cloud,id)=>cloud.update('guests',id,key,{...item})),
  deleteGuest: key=>run((cloud,id)=>cloud.remove('guests',id,key)),
  issueInvite: ()=>run(async (cloud,id)=>{const token=await cloud.issue(id);if(user && identity.current===user.id)setInviteToken(token);}),
  acceptInvite: token=>run(async cloud=>{activeId.current=await cloud.accept(token);setInviteToken('');},false),
 };
 return <WorkspaceContext.Provider value={value}>
  {legacy && user && <div role="status" className="p-3 bg-amber-50 text-amber-950 text-sm">Data rencana lama tetap disimpan di browser ini, tidak digunakan sebagai workspace cloud dan tidak diunggah otomatis. Cadangkan data situs sebelum menghapusnya.</div>}
  {error && user && <div role="alert" className="p-3 bg-rose-50 text-rose-900 text-sm">{error} <button onClick={()=>void reload()} className="underline">Muat ulang</button></div>}
  {busy && user && <div role="status" className="p-2 text-sm">Menyimpan ke cloud…</div>}{children}
 </WorkspaceContext.Provider>;
}
export function useWorkspace(){const value=useContext(WorkspaceContext);if(!value)throw new Error('WorkspaceProvider required');return value;}
