import type { SupabaseClient } from '@supabase/supabase-js';
/** Only existing role discovery is allowed in this release. No tenant or commerce reads. */
export async function readAdminRole(client: SupabaseClient): Promise<'developer' | 'operator' | null> {
  const { data, error } = await client.rpc('site_role');
  if (error || (data !== null && data !== 'developer' && data !== 'operator')) {
    throw new Error('Hak admin tidak dapat divalidasi.');
  }
  return data;
}
