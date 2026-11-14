import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// REVIEW/TEST RECONSTRUCTION ONLY. Never a historical migration or deployment entrypoint.
// No rows, network, credentials or migration-ledger replay. Existing local migrations
// provide uncaptured prerequisites. Captured definitions are used verbatim, not guessed.
export const captured = JSON.parse(readFileSync('docs/release/production-schema-drift-20261114.json','utf8'));
export const plannerNames = ['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'];
const ident = s => `"${s.replaceAll('"','""')}"`;
export async function installHostedPlannerFixture(db, { preserveExistingPlanner = false } = {}) {
  await db.exec('CREATE SCHEMA starter_private; REVOKE ALL ON SCHEMA starter_private FROM PUBLIC;');
  // Reconstruct the eight captured tables, including constraints, policies and user
  // triggers. PostgreSQL regenerates internal FK triggers (OID names are not stable).
  if (!preserveExistingPlanner) await db.exec(`DROP TABLE ${plannerNames.slice(0,5).map(n=>'public.'+ident(n)).join(',')} CASCADE`);
  const names = [...(preserveExistingPlanner ? plannerNames.slice(5) : plannerNames), 'applied','requests'];
  const tables = names.map(name => captured.tables.find(t=>t.name===name));
  for (const t of tables) {
    const q = `${ident(t.schema)}.${ident(t.name)}`;
    await db.exec(`CREATE TABLE ${q} (${t.columns.map(c=>`${ident(c.name)} ${c.type}${c.default?' DEFAULT '+c.default:''}${c.not_null?' NOT NULL':''}`).join(',')})`);
    for (const c of t.constraints.filter(c=>c.type!=='f')) await db.exec(`ALTER TABLE ${q} ADD CONSTRAINT ${ident(c.name)} ${c.definition}`);
  }
  for (const t of tables) {
    const q = `${ident(t.schema)}.${ident(t.name)}`;
    for (const c of t.constraints.filter(c=>c.type==='f')) await db.exec(`ALTER TABLE ${q} ADD CONSTRAINT ${ident(c.name)} ${c.definition}`);
    for (const idx of t.indexes) await db.exec(idx.definition.replace('CREATE INDEX ','CREATE INDEX IF NOT EXISTS ').replace('CREATE UNIQUE INDEX ','CREATE UNIQUE INDEX IF NOT EXISTS '));
    if(t.rls) await db.exec(`ALTER TABLE ${q} ENABLE ROW LEVEL SECURITY`);
    if(t.force_rls) await db.exec(`ALTER TABLE ${q} FORCE ROW LEVEL SECURITY`);
    if(t.schema==='public') await db.exec(`GRANT SELECT,INSERT,UPDATE,DELETE ON ${q} TO authenticated; GRANT ALL ON ${q} TO service_role`);
    for (const p of t.policies) await db.exec(`CREATE POLICY ${ident(p.policyname)} ON ${q} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(ident).join(',')} USING (${p.qual}) WITH CHECK (${p.with_check})`);
  }
  // wa_template validator definition is NOT captured: do not invent it. Settings
  // column available for paid-policy noninterference tests; full validator is a gap.
  await db.exec('ALTER TABLE public.workspaces ADD COLUMN wa_template jsonb');
  for (const f of captured.functions.filter(f => !preserveExistingPlanner || f.name === 'vendor_immutable_scope')) {
    await db.exec(f.definition);
    const signature = `${ident(f.schema)}.${ident(f.name)}(${f.identity_arguments})`;
    await db.exec(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC,anon,authenticated`);
    if(f.authenticated_execute) await db.exec(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated`);
    if(f.anon_execute) await db.exec(`GRANT EXECUTE ON FUNCTION ${signature} TO anon`);
  }
  for(const t of tables) for(const tr of t.triggers.filter(tr=>!tr.internal)) await db.exec(tr.definition);
  // Verify all eight actual shapes against the metadata, not just vendor stubs.
  for(const t of tables) {
    const cols=(await db.query(`SELECT attname name,format_type(atttypid,atttypmod) type,attnotnull not_null,pg_get_expr(adbin,adrelid) AS "default" FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=$1::regclass AND attnum>0 AND NOT attisdropped ORDER BY attnum`,[`${t.schema}.${t.name}`])).rows;
    assert.deepEqual(cols,t.columns.map(({name,type,not_null,default: def})=>({name,type,not_null,default:def})));
    const constraints=(await db.query('SELECT conname name,pg_get_constraintdef(oid,true) definition FROM pg_constraint WHERE conrelid=$1::regclass ORDER BY conname',[`${t.schema}.${t.name}`])).rows;
    // PGlite PostgreSQL 17+ adds NOT NULL constraints and deparses text arrays
    // differently from the captured server. Definitions above are replayed exact;
    // compare names here, while column nullability is checked independently.
    assert.deepEqual(constraints.filter(c=>!c.definition.startsWith('NOT NULL ')).map(c=>c.name),t.constraints.map(c=>c.name));
  }
}
