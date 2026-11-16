import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Validates the offline historical reconciliation manifest.
 * Ensures the manifest is operator-approved and cryptographically sealed.
 *
 * @param {object} manifest - The manifest produced by history-plan.mjs and approved by operator.
 * @returns {object} The validated manifest.
 */
export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw Error('invalid manifest: expected object');
  }
  if (manifest.version !== 1) {
    throw Error(`unsupported manifest version: ${manifest.version}`);
  }
  if (manifest.operator_approved !== true) {
    throw Error('historical plan must be operator-approved (operator_approved === true) before execution');
  }
  if (!manifest.operator || typeof manifest.operator !== 'string' || !manifest.operator.trim()) {
    throw Error('missing or invalid operator in manifest');
  }
  if (!Array.isArray(manifest.entries)) {
    throw Error('invalid manifest: missing entries array');
  }

  const { sha256, ...payload } = manifest;
  const computedHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  if (computedHash !== sha256) {
    throw Error('manifest sha256 checksum mismatch: payload was modified after hash generation');
  }

  return manifest;
}

/**
 * Reconciles a single historical invoice inside an isolated transaction.
 * Strictly adheres to the 1-invoice-per-commit contract.
 *
 * @param {object} db - Database connection client (PGlite or pg client with query method).
 * @param {object} entry - An entry from manifest.entries.
 * @returns {Promise<object>} Outcome of the reconciliation for this invoice.
 */
export async function reconcileEntry(db, entry) {
  for (const key of ['invoice', 'workspace_id', 'amount_idr', 'paid_at', 'expires_at', 'duration_days', 'benefits', 'evidence']) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === '') {
      throw Error(`entry missing required field: ${key}`);
    }
  }

  await db.query('BEGIN');
  try {
    // 1. Lock and verify the order row
    const orderRes = await db.query(
      'SELECT invoice, workspace_id, package_id, price_version, amount_idr, duration_days, status, paid_at FROM public.doku_orders WHERE invoice = $1 FOR UPDATE',
      [entry.invoice]
    );

    if (orderRes.rows.length === 0) {
      throw Error(`order not found for invoice: ${entry.invoice}`);
    }

    const ord = orderRes.rows[0];
    if (ord.status !== 'paid') {
      throw Error(`order status is '${ord.status}', expected 'paid' for invoice: ${entry.invoice}`);
    }
    if (ord.workspace_id !== entry.workspace_id) {
      throw Error(`workspace mismatch for invoice ${entry.invoice}: order has ${ord.workspace_id}, entry has ${entry.workspace_id}`);
    }
    if (Number(ord.amount_idr) !== Number(entry.amount_idr)) {
      throw Error(`amount mismatch for invoice ${entry.invoice}: order has ${ord.amount_idr}, entry has ${entry.amount_idr}`);
    }

    // 2. Insert package_order_terms (contract_version = 0, duration_days = entry.duration_days, duration_months = NULL)
    await db.query(`
      INSERT INTO public.package_order_terms (
        invoice, workspace_id, tier, price_version, amount_idr, contract_version, benefits, duration_months, duration_days
      ) VALUES (
        $1, $2, $3, $4, $5, 0, $6::jsonb, NULL, $7
      )
      ON CONFLICT (invoice) DO NOTHING
    `, [
      entry.invoice,
      entry.workspace_id,
      ord.package_id,
      ord.price_version,
      entry.amount_idr,
      JSON.stringify(entry.benefits),
      entry.duration_days
    ]);

    // 3. Retrieve serialized terms JSONB
    const termsRes = await db.query(
      'SELECT to_jsonb(t) as terms FROM public.package_order_terms t WHERE invoice = $1',
      [entry.invoice]
    );
    if (termsRes.rows.length === 0) {
      throw Error(`failed to retrieve terms for invoice: ${entry.invoice}`);
    }
    const termsJson = termsRes.rows[0].terms;

    // 4. Insert package_settlements preserving historical verified_at and expires_at
    await db.query(`
      INSERT INTO public.package_settlements (
        invoice, evidence_hash, amount_idr, workspace_id, terms, verified_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz
      )
      ON CONFLICT (invoice) DO NOTHING
    `, [
      entry.invoice,
      entry.evidence,
      entry.amount_idr,
      entry.workspace_id,
      JSON.stringify(termsJson),
      entry.paid_at,
      entry.expires_at
    ]);

    // 5. If revoked_at is present, record in package_settlement_revocations
    if (entry.revoked_at) {
      await db.query(`
        INSERT INTO public.package_settlement_revocations (
          invoice, reason, revoked_at
        ) VALUES (
          $1, 'historical operator revocation reconciled', $2::timestamptz
        )
        ON CONFLICT (invoice) DO NOTHING
      `, [entry.invoice, entry.revoked_at]);
    }

    await db.query('COMMIT');
    return { invoice: entry.invoice, outcome: 'reconciled' };
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

/**
 * Reconciles all entries in an approved manifest against the target database.
 * Processes entries strictly one at a time, each committed individually.
 *
 * @param {object} db - Database connection client.
 * @param {object} manifest - Approved manifest object.
 * @returns {Promise<object>} Summary of reconciled entries.
 */
export async function reconcileManifest(db, manifest) {
  const validated = validateManifest(manifest);
  const results = [];

  for (const entry of validated.entries) {
    const res = await reconcileEntry(db, entry);
    results.push(res);
  }

  return {
    total: validated.entries.length,
    reconciled: results.length,
    results
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length < 3) {
    console.error('usage: node reconcile-historical-plan.mjs approved-manifest.json');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const validated = validateManifest(manifest);
  console.log(`PASS: manifest is valid and operator-approved (${validated.entries.length} entries). Ready for database execution.`);
}
