# Historical Paid-without-S2 Reconciliation Design — 20261117

## 1. Executive Summary & Purpose

Before the introduction of the Stage 2 (S2) settlement schema, orders processed via DOKU were recorded directly in `public.doku_orders` with `status = 'paid'`. Under the S2 unified capability model (`03-s2-package-settlement-v2.sql` and `04-s2-settlement-integration-lockfix.sql`), workspace capability access (`has_workspace_capability_v1`) is evaluated by inspecting `public.package_settlements` and checking that valid terms exist in `public.package_order_terms`.

Consequently, pre-S2 paid orders lack backing rows in `package_order_terms` and `package_settlements`. Without an explicit reconciliation mechanism:
1. Legitimate paying customers who completed purchases prior to S2 lose access to their core and package capabilities under S2 RLS enforcement.
2. Standard S2 settlement RPCs (`s2_settle_verified` / `canonical_settle_locked`) explicitly reject these orders with `'ineligible order'` because their status is already `'paid'` (the RPCs only accept `'pending'`, `'checkout_ready'`, or `'unknown'`).
3. Standard webhook notification processing (`doku_apply_notification`) cannot settle these historical orders without new provider events.

This document establishes the architecture, invariants, concurrency contract, and execution tooling for the **Historical Paid-without-S2 Reconciliation Engine**.

---

## 2. Invariant Preservation Contract

The reconciliation engine operates under strict non-mutation guarantees:

| Invariant | Specification | Enforcement Mechanism |
|---|---|---|
| **Timestamp Fidelity** | Historical `paid_at` becomes `verified_at`. Original `expires_at` is preserved to the exact second. | Direct assignment from approved manifest; no recalculation or sliding window. |
| **Duration & Version** | `contract_version = 0`, `duration_months = NULL`, `duration_days = entry.duration_days` (365). | Database schema check `contract_version IN (0,1)` and duration constraint. |
| **Core Legacy Benefits** | Full legacy benefit set preserved: `["collaboration", "budget_expenses", "checklist", "shared_savings", "budgets", "tasks", "guests", "savings_accounts", "savings_contributions", "vendors", "vendor_installments", "vendor_payments"]`. | Deterministic benefits manifest locked in `package_order_terms.benefits`. |
| **Revocation State** | If historical order was revoked (`revoked_at IS NOT NULL`), a row is inserted into `public.package_settlement_revocations`. | RLS check `NOT EXISTS (SELECT 1 FROM package_settlement_revocations r WHERE r.invoice = s.invoice)` immediately denies access. |
| **Table Immutability** | `package_order_terms`, `package_settlements`, and `package_settlement_revocations` are append-only. | PostgreSQL triggers `s2_terms_immutable`, `s2_settlement_immutable`, and `revocations_immutable` raise `'immutable evidence'` on UPDATE/DELETE. Reconciliation uses `ON CONFLICT (invoice) DO NOTHING`. |
| **Order Identity** | No modification of `doku_orders` row columns (`invoice`, `workspace_id`, `amount_idr`, `paid_at`, etc.). | Trigger `s2_order_identity` prevents mutation. |

---

## 3. Transaction & Concurrency Boundary

Adhering to `transaction-and-concurrency-contract-20261117.md`:

1. **One Invoice per Transaction / Commit**:
   - The reconciliation runner executes each invoice within an isolated database transaction (`BEGIN ... COMMIT`).
   - Failure on any individual invoice (e.g. data mismatch) triggers a local `ROLLBACK` for that invoice only, without aborting or poisoning subsequent invoices.
2. **No Bulk Locks or Multi-Invoice Locks**:
   - At no point are multiple invoices locked simultaneously.
   - Per-invoice row locking (`SELECT ... FOR UPDATE`) is scoped solely to the active invoice being processed.
3. **Idempotence**:
   - Re-running the reconciliation against an already-reconciled database is a deterministic, error-free no-op (`ON CONFLICT (invoice) DO NOTHING`).
   - Existing settlement timestamps, terms, and revocation states remain 100% unaltered.

---

## 4. Multi-Phase Operator Lifecycle

```
[ Historical Orders Export ]
             │
             ▼
┌──────────────────────────┐
│ tests/history-plan.mjs   │ ──► Generates deterministic offline manifest (SHA256 sealed)
└──────────────────────────┘
             │
             ▼ (Manual Operator Review & Approval: operator_approved = true)
┌──────────────────────────────────────┐
│ scripts/reconcile-historical-plan.mjs│ ──► Cryptographic verification + 1:1 invoice commit execution
└──────────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│ tests/history-reconciliation.test.mjs │ ──► Automated capability & RLS verification (100% passing)
└───────────────────────────────────────┘
```

### Phase 1: Offline Plan Generation (`tests/history-plan.mjs`)
- Ingests immutable export of historical paid orders.
- Validates field presence, types, positive amounts, duration, and valid dates (`expires_at > paid_at`).
- Sorts deterministically by invoice ascending.
- Emits payload with `sha256` digest and `mode: 'offline-plan-only'`.

### Phase 2: Operator Review & Approval
- An authorized operator verifies that all invoices, amounts, and dates correspond to verified banking or DOKU settlement records.
- Operator sets `operator_approved: true` and re-computes `sha256` matching the canonical payload.

### Phase 3: Reconciliation Execution (`scripts/reconcile-historical-plan.mjs`)
- Verifies `manifest.operator_approved === true`.
- Re-hashes the manifest payload (excluding `sha256`) and asserts exact equality with `manifest.sha256`. Rejects any tampered file.
- Connects as trusted database executor.
- Iterates through entries sequentially:
  - Acquires `FOR UPDATE` on `public.doku_orders`.
  - Asserts status is `'paid'`, workspace matches, and amount matches.
  - Inserts into `public.package_order_terms` with `contract_version = 0`.
  - Inserts into `public.package_settlements` preserving historical `paid_at` and `expires_at`.
  - If `revoked_at` is set, inserts into `public.package_settlement_revocations`.
  - Commits transaction.

### Phase 4: Automated Verification (`tests/history-reconciliation.test.mjs`)
- Boots isolated PGlite database with full migration and S2 schema.
- Seeds historical paid and revoked orders.
- Executes reconciliation runner.
- Asserts active orders grant `has_workspace_capability_v1 === true`.
- Asserts revoked orders yield `has_workspace_capability_v1 === false`.
- Verifies re-run idempotence (zero duplicate errors, zero date alterations).

---

## 5. Security & Privilege Separation

- Direct DML on `package_order_terms` and `package_settlements` is revoked from `PUBLIC`, `anon`, `authenticated`, and `service_role`.
- The reconciliation executor must be run with database administrator privileges (e.g. `postgres` superuser role during maintenance window) or via a trusted `SECURITY DEFINER` operator migration.
- No public or authenticated user can invoke reconciliation endpoints or synthesize backdated settlements.
