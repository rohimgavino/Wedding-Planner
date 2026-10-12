# Backend next stage — not implemented

1. Create a NEW isolated Supabase project for EverRae, never reuse source-project credentials/database. Public env placeholders only in .env.example; service role stays server-side.
2. Review inherited SQL before any migration. Model profiles, weddings, wedding_members, tasks, expenses/budget_categories, vendors, guests, invitation_templates/invitations, subscriptions, payment_events. Foreign keys include wedding_id; membership roles couple/organizer/read-only.
3. RLS on every private table: authenticated user must be wedding member; invitation tokens can only read published public fields. Test unauthorized reads and writes with two independent accounts before UI wiring.
4. Server validation for money, dates, names, limits and membership, plus rate limits/idempotency for RSVP. Build safe local-data export/import before migrating existing storage; never silently discard local workspaces.
5. Authentication callbacks/session expiry/error handling, OAuth provider setup, protected routes and actual cross-device CRUD. Current static export can host frontend but server APIs require a separately hosted backend or deliberate architecture change.
6. Invitation publishing requires revocable tokens, publish states, per-event RSVP, spam controls and guest privacy. UI concepts must remain marked planned until end-to-end tested.
7. Payment gateway chosen with user approval. Signed webhook verification, idempotent payment_events, server entitlements; never activate subscriptions from browser query parameters. No card storage.
8. Privacy/legal/company/support review, data retention and deletion/export, backup and recovery, observability, dependency security audit, accessibility and browser QA before approved deployment.

Do not activate inherited OAuth/database logic merely by inserting credentials: local WorkspaceContext is not connected to that backend. Pricing concepts are not enforced business plans.
