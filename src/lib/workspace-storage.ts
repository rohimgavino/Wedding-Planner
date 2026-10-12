import type { Workspace, BudgetItem, TaskItem, GuestItem } from '@/types';
export const STORAGE_KEY = 'everrae_workspace_v1';
export const LEGACY_KEY = 'wedding_planner_workspace_clean_v2';
export interface SavedWorkspace { workspace: Workspace | null; budgets: BudgetItem[]; tasks: TaskItem[]; guests: GuestItem[]; inviteToken: string }
const empty = (): SavedWorkspace => ({workspace:null,budgets:[],tasks:[],guests:[],inviteToken:''});
type RecordValue = Record<string, unknown>;
const object = (v: unknown): v is RecordValue => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown) => typeof v === 'string';
const money = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const optional = (v: unknown) => v === undefined || text(v);
function valid(v: unknown): v is SavedWorkspace {
  if (!object(v) || !text(v.inviteToken)) return false;
  const w = v.workspace;
  if (w !== null && (!object(w) || !['id','title','wedding_date','created_at'].every(k=>text(w[k])) || !money(w.target_budget) || !money(w.target_savings))) return false;
  const base = (r: unknown): r is RecordValue => object(r) && text(r.id) && text(r.workspace_id) && object(w) && r.workspace_id === w.id;
  const rows = (key: string, check: (r: unknown)=>boolean) => Array.isArray(v[key]) && v[key].length <= 10000 && v[key].every(check);
  return rows('budgets', r=>base(r) && text(r.category) && text(r.title) && money(r.allocated_amount) && money(r.spent_amount) && ['unpaid','dp','paid'].includes(String(r.payment_status)) && optional(r.notes))
    && rows('tasks', r=>base(r) && text(r.title) && ['H-6 Bulan','H-3 Bulan','H-1 Bulan','H-1 Minggu','Hari H','Dokumen KUA'].includes(String(r.phase)) && ['groom','bride','both'].includes(String(r.pic)) && typeof r.is_completed === 'boolean' && optional(r.due_date))
    && rows('guests', r=>base(r) && text(r.name) && ['keluarga_pria','keluarga_wanita','teman_kantor','sahabat','vip','lainnya'].includes(String(r.category)) && typeof r.pax === 'number' && Number.isInteger(r.pax) && r.pax > 0 && ['uncontacted','sent','attending','declined'].includes(String(r.rsvp_status)) && optional(r.phone) && optional(r.notes));
}
/** Never overwrite unsupported data or delete the old key. */
export function loadWorkspace(storage: Pick<Storage, 'getItem' | 'setItem'>): {data: SavedWorkspace; canSave: boolean} {
  try {
    const current = storage.getItem(STORAGE_KEY);
    const legacy = current === null ? storage.getItem(LEGACY_KEY) : null;
    const raw = current ?? legacy;
    if (raw === null) return {data:empty(),canSave:true};
    if (raw.length > 5000000) return {data:empty(),canSave:false};
    const data: unknown = JSON.parse(raw);
    if (!valid(data)) return {data:empty(),canSave:false};
    if (current === null) storage.setItem(STORAGE_KEY, raw);
    return {data,canSave:true};
  } catch { return {data:empty(),canSave:false}; }
}
