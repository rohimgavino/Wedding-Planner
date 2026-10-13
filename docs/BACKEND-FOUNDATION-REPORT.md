# Backend foundation — local SQL verification, not a release

## Scope and artifacts

- `supabase/migrations/202610120001_secure_foundation.sql`: transactional baseline supporting an empty Supabase database or the inherited seven-table schema. No hosted database was changed.
- `supabase/schema.sql`: deprecated pointer, removing the dangerous standalone schema path.
- `scripts/test-backend.mjs`: executes actual PostgreSQL SQL in fresh in-memory PGlite, including role switching, RLS, triggers and RPC calls.
- `package.json` / `package-lock.json`: PGlite dev dependency and `npm run test:backend`.

Inspected repo Graphify first, inherited schema, backend-stage doc and team architecture doc. Existing unrelated graph/security evidence and Supabase link metadata were preserved. No deploy, push or commit.

## Security and RPC contracts

- `create_workspace(p_title text, p_wedding_date date) -> uuid`: authenticated identity comes from `auth.uid()`, never a supplied owner ID. Inserts workspace and sole owner in the same transaction. No seeded demo records. Validates nonempty bounded title/date.
- `create_partner_invitation(p_workspace_id uuid) -> text`: owner only; workspace row lock; rejects full workspace. Returns a 64-character bearer token once, stores only SHA-256, expires after 24 hours. Reissuing invalidates pending previous tokens.
- `accept_partner_invitation(p_token text) -> uuid`: authenticated users only, bearer possession required. Locks workspace then invitation, checks token format/status/expiry/existing membership/capacity, inserts partner and consumes token atomically. Failure rolls back both changes.
- Tokens use two PostgreSQL cryptographically random UUIDv4 values (244 random bits); hashing uses PostgreSQL SHA-256 built-in, no extension search-path dependency. Never log the returned bearer. These are partner pairing invitations, NOT public wedding/RSVP links.
- Capacity trigger serializes membership inserts/moves on workspace row and rejects a third member. Unique partial index limits owners to one.
- All seven tables enable RLS; authenticated membership SELECT only; workspace SELECT/UPDATE only; planning tables member CRUD with explicit USING/WITH CHECK; invitations have no client policy or table grant.
- Direct workspace insert, membership mutations, invitation mutations and anonymous access denied. Every security-definer function pins empty `search_path`, references qualified tables, revokes default PUBLIC/anon execution; trigger function has no client EXECUTE grant.
- Migration removes all inherited policies on the seven target tables, invalidates/hashes legacy tokens before dropping plaintext, rejects pre-existing over-capacity memberships. Null roles, duplicate owners or non-partner legacy invites will fail migration rather than silently repair historical data. Audit existing data before any approved application. Service-role/database-owner privileges remain trusted administrative powers.

## Actual TDD and verification

Command: `node scripts/test-backend.mjs` (also `npm run test:backend`).

Observed RED checkpoints before implementation:
1. Inherited policy allowed stranger self-enrollment: `AssertionError: Missing expected rejection`.
2. Atomic workspace RPC missing: `function public.create_workspace(unknown, unknown) does not exist`.
3. Invitation RPC missing: `function public.create_partner_invitation(unknown) does not exist`.
4. Privileged third-member insert succeeded: `AssertionError: Missing expected rejection`.

Each checkpoint was followed by implementation and passing SQL execution. Supplemental adversarial regression coverage was added after the feature slices; not every regression test independently had a RED checkpoint.

Latest verified suite output: **20 backend SQL tests passed**:
- self-enrollment blocked; atomic owner creation; unauthenticated creation blocked;
- hashed token storage; owner-only issuance; atomic partner acceptance; reuse rejected; full-workspace issuance blocked; capacity trigger;
- expired token rejected without membership change; token rotation/self-accept rejection; malformed/missing/unauthenticated tokens;
- real member CRUD and outsider SELECT/INSERT/UPDATE/DELETE isolation for budgets/tasks/guests/savings_accounts, including tenant-changing UPDATE rejection;
- workspace/member tenant isolation; actual catalog RLS and pinned definer configuration;
- invitations fail closed even after deliberately widened test-only table grants;
- original migration grants restored and tested: anon tables/RPCs denied; authenticated control-plane writes denied.

PGlite is real PostgreSQL compiled to WASM, not SQL-string assertions. Harness creates minimal `auth.users`, `auth.uid()` and roles locally; it does NOT exercise Supabase GoTrue, JWT validation or PostgREST. Broad grants temporarily added only inside the disposable database prove RLS independently, then the actual migration grant block is restored/tested.

Additional regression commands passed: `node scripts/test-guest-csv.cjs` and `node scripts/test-workspace-storage.cjs` (CSV roundtrip/validation and retained local-storage migration). `graphify update .` completed: 298 nodes, 401 edges, 33 communities. It performed AST-only extraction; changed Markdown is not semantically indexed, 31 unsupported files were skipped and community labels need refresh. `git diff --check` initially caught a trailing blank line in the deprecated schema pointer; that whitespace was corrected.

## Remaining blockers / explicit limits

- Docker CLI exists but Docker engine unavailable (`dockerDesktopLinuxEngine` pipe not found). No system `psql` found. PGlite fallback used successfully.
- True simultaneous multi-session acceptance/rotation and isolation-level races are **not verified**: PGlite is single-session. Workspace locking is implemented but a native PostgreSQL/Supabase local multi-connection stress test is required before deployment. Do not substitute queued Promise calls for concurrency evidence.
- Fresh-database migration execution verified; upgrade with populated legacy data requires a separate fixture rehearsal/audit. Migration is ordered/one-time, not intended for repeated execution.
- Supabase hosted migration/auth/two-browser-account pairing, persistence after reload and realtime sync are not tested. React/demo login/localStorage remain untouched. No claim that UI authentication or pairing now works.
- Entitlements/payment enforcement, profile CRUD, local-data import/export, rate limits, deletion/owner transfer, invite delivery and public RSVP are outside this foundation.
- `npm install` reported 7 high-severity dependency vulnerabilities; no unrelated forced audit fix performed. Dependency/security remediation is a release gate.
- Parent must review and obtain approval before any hosted migration. No production database operations performed.
