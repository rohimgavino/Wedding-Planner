import type { SupabaseClient } from '@supabase/supabase-js';

export interface TierPackage {
  id: string;
  name: string;
  description: string;
  base_amount_idr?: number | null;
  price_idr: number;
  duration_days: number;
  features: string[];
  checkout_eligible: boolean;
}

export interface PaymentCatalog {
  salesEnabled: boolean;
  supportEmail: string | null;
  serverNow: string;
  packages: TierPackage[];
  dokuConfigured: boolean;
}

export interface DokuOrderSummary {
  invoice: string;
  package_id: string;
  amount_idr: number;
  duration_days: number;
  status: string;
  checkout_url: string | null;
  payment_channel: string | null;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface WorkspaceEntitlement {
  feature: string;
  payment_provider: string | null;
  payment_reference: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface WorkspaceBillingStatus {
  orders: DokuOrderSummary[];
  entitlements: WorkspaceEntitlement[];
}

export interface CheckoutResult {
  status: 'checkout_ready' | 'already_active';
  invoice?: string;
  packageId?: string;
  amountIdr?: number;
  checkoutUrl?: string;
  expiresAt?: string | null;
  reused?: boolean;
  message?: string;
}

export interface AdminDokuOrder {
  invoice: string;
  workspace_id: string;
  payer_id: string;
  package_id: string;
  amount_idr: number;
  duration_days: number;
  status: string;
  payment_channel: string | null;
  doku_http_status: number | null;
  error_code: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface AuditEntry {
  id: string;
  actor_id: string;
  action: string;
  subject_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface SiteAdminEntry {
  user_id: string;
  role: 'developer' | 'operator';
  created_at: string;
}

export function isValidSupportEmail(value: string): boolean {
  const email = value.trim();
  return (
    email.length > 0 &&
    email.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$/.test(email)
  );
}

export function parsePositiveInt(value: string, max: number): number {
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed) || !Number.isSafeInteger(Number(trimmed)) || Number(trimmed) < 1 || Number(trimmed) > max) {
    throw new Error('Angka harus bilangan bulat positif dalam batas aman.');
  }
  return Number(trimmed);
}

export function parseSalesActivation(
  enabled: boolean,
  supportEmail: string,
  reason: string,
  confirmed: boolean
): { p_enabled: boolean; p_support_email: string | null; p_reason: string; p_confirmed: boolean } {
  const email = supportEmail.trim();
  const cleanReason = reason.trim();
  if (!confirmed) {
    throw new Error('Centang konfirmasi sebelum memperbarui status penjualan.');
  }
  if (!cleanReason || cleanReason.length > 500) {
    throw new Error('Alasan perubahan wajib diisi (maksimal 500 karakter).');
  }
  if (email && !isValidSupportEmail(email)) {
    throw new Error('Email dukungan tidak valid.');
  }
  return {
    p_enabled: Boolean(enabled),
    p_support_email: email || null,
    p_reason: cleanReason,
    p_confirmed: true,
  };
}

export function formatOrderStatus(status: string): {
  label: string;
  tone: 'neutral' | 'amber' | 'green' | 'rose';
} {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', tone: 'green' };
    case 'checkout_ready':
      return { label: 'Menunggu pembayaran', tone: 'amber' };
    case 'pending':
      return { label: 'Memproses checkout', tone: 'amber' };
    case 'unknown':
      return { label: 'Menunggu konfirmasi gateway', tone: 'amber' };
    case 'expired':
      return { label: 'Kedaluwarsa', tone: 'neutral' };
    case 'failed':
      return { label: 'Gagal', tone: 'rose' };
    default:
      return { label: status || 'Tidak diketahui', tone: 'neutral' };
  }
}

export function isOrderCheckoutActive(
  order: Pick<DokuOrderSummary, 'status' | 'checkout_url' | 'expires_at'>,
  nowMs = Date.now()
): boolean {
  if (order.status !== 'checkout_ready' || !order.checkout_url) return false;
  if (!order.expires_at) return true;
  const expiresMs = Date.parse(order.expires_at);
  return Number.isFinite(expiresMs) && expiresMs > nowMs;
}

async function parseApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Abaikan body non-JSON
  }
  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const message =
      body && typeof body.message === 'string' && body.message
        ? body.message
        : body && typeof body.error === 'string' && body.error
          ? body.error
          : fallbackMessage;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchPaymentCatalog(): Promise<PaymentCatalog> {
  const response = await fetch('/api/payments/catalog', { cache: 'no-store' });
  return parseApiJson<PaymentCatalog>(response, 'Katalog pembayaran belum dapat dimuat.');
}

export async function fetchWorkspaceBilling(accessToken: string, workspaceId: string): Promise<WorkspaceBillingStatus> {
  const response = await fetch(`/api/payments/status?workspace_id=${encodeURIComponent(workspaceId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  return parseApiJson<WorkspaceBillingStatus>(response, 'Status pembayaran workspace gagal dimuat.');
}

export async function startDokuCheckout(
  accessToken: string,
  workspaceId: string,
  packageId: string
): Promise<CheckoutResult> {
  const response = await fetch('/api/payments/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ workspaceId, packageId }),
  });
  return parseApiJson<CheckoutResult>(response, 'Gagal membuat sesi pembayaran DOKU.');
}

function checked<T>(data: T, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data;
}

export class Commerce {
  constructor(private client: SupabaseClient) {}

  async role(): Promise<'developer' | 'operator' | null> {
    const { data, error } = await this.client.rpc('site_role');
    const role = checked(data, error);
    if (role !== null && role !== 'developer' && role !== 'operator') {
      throw new Error('Role tidak dapat divalidasi.');
    }
    return role;
  }

  async admin(): Promise<boolean> {
    const { data, error } = await this.client.rpc('is_site_admin');
    return checked(data, error) === true;
  }

  async admins(): Promise<SiteAdminEntry[]> {
    const { data, error } = await this.client.rpc('list_site_admins');
    return checked(data || [], error);
  }

  async setAdmin(id: string, role: 'developer' | 'operator' | null, reason: string) {
    if (!reason.trim()) throw new Error('Alasan wajib.');
    const { data, error } = await this.client.rpc('set_site_admin', {
      p_user_id: id,
      p_role: role,
      p_reason: reason.trim(),
    });
    return checked(data, error);
  }

  async testAccess(workspace: string, days: string, reason: string) {
    if (!reason.trim()) throw new Error('Alasan wajib.');
    const { data, error } = await this.client.rpc('grant_developer_test_access', {
      p_workspace_id: workspace,
      p_days: parsePositiveInt(days, 30),
      p_reason: reason.trim(),
    });
    return checked(data, error);
  }

  async revokeTestAccess(workspace: string, reason: string) {
    if (!reason.trim()) throw new Error('Alasan wajib.');
    const { data, error } = await this.client.rpc('revoke_developer_test_access', {
      p_workspace_id: workspace,
      p_reason: reason.trim(),
    });
    return checked(data, error);
  }

  async setSalesActivation(enabled: boolean, supportEmail: string, reason: string, confirmed: boolean) {
    const args = parseSalesActivation(enabled, supportEmail, reason, confirmed);
    const { data, error } = await this.client.rpc('admin_set_sales_activation', args);
    return checked(data, error);
  }

  async dokuOrders(): Promise<AdminDokuOrder[]> {
    const { data, error } = await this.client.rpc('admin_doku_orders');
    return checked((data as AdminDokuOrder[] | null) || [], error);
  }

  async resolveDokuOrder(invoice: string, targetStatus: 'failed' | 'expired', reason: string) {
    const trimmed = reason.trim();
    if (trimmed.length < 8 || trimmed.length > 240) {
      throw new Error('Alasan resolusi wajib 8–240 karakter.');
    }
    const { data, error } = await this.client.rpc('admin_resolve_doku_order', {
      p_invoice: invoice,
      p_target_status: targetStatus,
      p_reason: trimmed,
    });
    return checked(data, error);
  }

  async audit(): Promise<AuditEntry[]> {
    const { data, error } = await this.client
      .from('admin_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    return checked(data || [], error);
  }
}
