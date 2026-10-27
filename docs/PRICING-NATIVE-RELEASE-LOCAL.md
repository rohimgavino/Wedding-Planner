# Paket & Harga — native/local release rehearsal

## Outcome
Local-only release slice built and exercised. No deployment, hosted connection/migration, role/customer change, commit/push, VM/backup-infrastructure operation or port4187 change. Actual customer-backup restore remains unresolved/deferred, not waived.

## Native PostgreSQL and actual runner
Runnable: `python scripts/test-pricing-native-release.py` (psycopg required; existing portable PG17 binaries). Uniquely owned trust-auth synthetic cluster, dynamically allocated loopback-only port, stripped PG/SUPABASE environment, PGPASSFILE=NUL; cluster stopped and removed in finally.

Final evidence: `docs/pricing-evidence/native-final.log` and `docs/pricing-evidence/native-release-e4eddbafde/` (results.json and exact runner output).
- Installed Supabase CLI 2.120.0 official `db push --help` inspected. Actual invocation: db push --db-url pointing exclusively to disposable 127.0.0.1 cluster, --skip-vault --yes --workdir pointing at uniquely owned temporary config. No --linked/local hosted project discovery or canonical config.
- Injected late SQL exception before pricing migration COMMIT: new pricing DDL absent, history zero, every preexisting public function definition hash unchanged. Pricing migration is additive, so no existing RPC replacements were invented merely to test replacement rollback.
- Reviewed SQL retry succeeded; second push succeeded with exactly one 202610220001 history row. This proves per-migration rollback/idempotency, not batch atomicity or production recovery.
- Eight independent CAS connections: one version2 commit, seven version conflicts, one corresponding price audit.
- Both authorization orderings: already serialized price save completes before waiting revocation; future save denied. Revocation holding lock first makes waiting save fail authorization. Lock waits proven through pg_stat_activity, not arbitrary sleeps.
- Both invoice-vs-update orderings exercised against actual durable.reserve SQL. Invoice-first preserves old version/price; update-first produces new version/price. Old snapshot immutable; notification using historical amount accepted, current price rejected for old invoice.
- Injected audit trigger failure rolls back catalog version, pointer and audit together.

## Real bug discovered and fixed tests-first
Initial native run failed in update-first reservation with `pricing unavailable`: joined locking SELECT waited for pointer update, then its old statement snapshot could not see newly inserted catalog version. Native failing trace recorded in initial tool output; partial results at native-release-45e9a98ae5. Fix in `services/doku-sandbox/durable.sql`: lock/read pointer first, read immutable catalog version in a separate statement. Repeated complete native runs green (b650315d0f and e4eddbafde). Permanent pre-edit backup: `backups/pricing-native-68193575e3/durable.sql`.

## Isolated release artifact
`D:/pocketwedding-releases/pocket-planner-pricing-local-5e0575e45c`
- Built from supplied published transparent baseline `D:/pocketwedding-releases/pocket-planner-transparent-20261022` (historical version d26a9cea-f923-406f-b49c-9283fd970c3c; no new live/provider verification was requested/performed).
- Only three UI differences: src/components/admin-release-panel.tsx integrates pricing, new admin-pricing.tsx and lib/admin-pricing.ts. NewSQL is the sole migration file: 202610220001_admin_package_pricing.sql. Durable sandbox service stays outside automatic migrations and release frontend.
- Every other src/public file hash matched baseline, including Pocket Planner transparent dark-white logos and readonly/unavailable admin panels. SOURCE-MANIFEST.json records hashes/allowlist. Original panel permanently backed up outside TS include tree at canonical backups/pricing-release-pocket-planner-pricing-local-5e0575e45c.
- Own npm ci completed (377 packages), no cross-drive junction. npm emitted existing tool deprecation notices; no dependency upgrade/audit claim.
- Isolated lint + tsc exit0. Fixture build, intercepted actual Edge pricing flows/mobile widths, and unconfigured rebuild all exit0; logs/screenshots in artifact docs/pricing-evidence. Scripts/verify-admin-pricing.py and test-admin-pricing-browser.py copied for reproduction.
- Final export deliberately UNCONFIGURED/fail-closed, NOT a deployable configured production build. No canonical private env consumed or public values printed. No actual public-config extraction/transfer performed: approved public-only configuration transfer and configured final build remain release steps.

## Canonical validation
- verify-admin-pricing.py: fixture-build0, browser0, unconfigured-build0; env filenames restored in finally. Canonical out remains unconfigured, not deployable.
- lint max-warnings0 and tsc --noEmit exit0 (native-lint.log/native-tsc.log).
- pricing SQL/client and sales SQL regression passed; DOKU protocol/security/pricing 79/79; durable 4/4.
- Native DOKU independent connections: one candidate/seven duplicate-payment; eight replay duplicates; eight permanent events. Log doku-native-final.log.
- Graphify updated once after code:1568 nodes/2060 edges/131 communities. AST only;4504 unsupported files skipped,5 labels renamed; document semantic refresh not performed. Previous graph files permanently backed up alongside durable.sql. git diff --check exit0.

## Production blockers / limits
1. Actual encrypted customer backup restoration and effective RLS/history recovery remain unresolved. No infrastructure restarted and no gate waived.
2. Hosted schema/history/role-lock definition reconciliation, approved isolated migration dry run/application and hosted authenticated operator/developer readback not done. Never push canonical dirty migrations or deploy canonical out.
3. Isolated public-only production configuration transfer, configured rebuild, independent review, deployment authorization and postdeployment hash/login/cache checks remain. Package is local only and contains no deployment config.
4. Pricing is calendar_year/one workspace; existing legacy day terms unchanged. No payment adapter exposed, DOKU production/sales/entitlement activation remains closed. Native durable SQL evidence is not a claim of workerd startup, production payment/webhook integration or calendar-year entitlement policy approval.
5. Browser tests are intercepted synthetic transport, not hosted two-account/device persistence. Unrelated dirty code remains untouched.

New canonical scripts: test-pricing-native-release.py, prepare-pricing-release.py. Modified existing production-local service: durable.sql only. New report this file; evidence and Graphify outputs as above. Existing AGENTS/docs/source were read before investigation. No questions or secret prompts required.
