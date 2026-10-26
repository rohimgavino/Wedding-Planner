import type { SavingsContribution, WorkspaceEntitlement } from '@/types';
export function savingsSummary(rows: Pick<SavingsContribution,'amount'|'contributor_id'>[], target: number) {
 const byPartner: Record<string,number> = {};
 let total=0;
 for(const row of rows){const amount=Number(row.amount);total+=amount;byPartner[row.contributor_id]=(byPartner[row.contributor_id]||0)+amount;}
 return {total,remaining:Math.max(0,target-total),progress:target>0?Math.min(100,Math.round(total/target*100)):0,byPartner};
}
export function entitlementActive(rows: WorkspaceEntitlement[],feature: WorkspaceEntitlement['feature']) {
 return rows.some(row=>row.feature===feature && !row.revoked_at && (!row.expires_at || Date.parse(row.expires_at)>Date.now()));
}
