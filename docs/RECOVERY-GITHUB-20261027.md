# Recovered snapshot: backup branch only

Recovered from the transferred old-computer source snapshot into an independent clone based on main 5e5ca368cdb909a2eabd929fac65326f75976337. Original C:/Users/MSI/program/Wedding-Planner and its package-lock modification remain untouched. No environment credentials, node_modules, build output or local runner logs are included. Production deployment and database changes are NOT part of this commit.

New-machine execution: npm ci, lint, tsc --noEmit, unconfigured Next build, tier SQL and tier client tests all exited zero (recovery-*.log retained locally outside commit). Native PG/browser evidence in older reports is historical, not rerun on this computer. Graphify CLI is unavailable here; existing transferred graph was retained, not freshly regenerated.

Independent review approved source publication to a separate backup branch only. No publish-blocking embedded secret found; synthetic DOKU test literals are fixtures. No in-repo deployment workflow or package lifecycle deployment hook found. External Cloudflare branch trigger settings were not inspected; this branch is not a production release.

Production blockers found by review:
- Legacy purchase page still follows sales_enabled/Lynk configuration; client DOKU-closed messaging does not prove hosted SQL RPC shutdown. Reconcile public copy and server gate before release.
- Tier SQL schedule parsing can accept normalized PostgreSQL times (such as 24:00:00) that the client canonical UTC roundtrip rejects. Add test-first canonical SQL validation before release.
- Hosted migration/role state and actual customer-backup restoration remain unresolved. Activation SQL was not applied. No tier entitlement/payment activation is authorized by publishing this source.

Commit excludes untracked activation SQL, environment/config credentials, build exports and generated installation/test logs. Main remains unchanged.
