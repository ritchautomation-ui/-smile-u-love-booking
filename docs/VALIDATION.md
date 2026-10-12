# Validation evidence

Date: 11 October 2026 (Asia/Manila).

- TypeScript check and Next.js production build passed.
- Eight input-validation tests passed: Philippine date boundary, phone/email normalization, malformed payloads, invalid calendar dates, date horizon/time bounds, consent/idempotency, invalid service/contact/name, time formatting.
- Existing Supabase `smile-u-love-demo` was ACTIVE_HEALTHY, with the compatible `appointments` schema and a confirmed Auth user.
- Additive booking functions applied successfully. Checked that anonymous and ordinary authenticated roles cannot execute them, while service_role can.
- Transactional database tests passed for insert, retry idempotency, changed-payload conflict, confirm, conflicting confirmation, decline, stale update, and contact rate limit. Test changes were rolled back; no test patients were retained.
- Unauthenticated admin API requests return 401. Invalid public payloads return 400.
- Desktop browser tests passed for request submission, saved receipt, admin login, loading the request, confirmation, and the Confirmed filter. The decline confirmation prompt rendered correctly.
- Mobile visual QA and the final browser decline click were blocked by an automatic approval-review usage limit; they were not completed. The decline operation itself passed its database transaction test.
- Supabase security advisor: the no-RLS-policy INFO is intentional for this server-only table (public roles have no grants). It also reported an existing Auth setting, leaked-password protection disabled. Review that project setting: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No authentication settings were changed automatically.

Local browser tests use a separate synthetic Supabase substitute, never production credentials. Fixtures and `.env.local` are excluded from source delivery. Live authentication and email delivery still require Vercel configuration and a deployed smoke test.

The original TapSpot save error was traced to its database-insert failure branch. The existing table and server-role table privileges were verified. Exact failing production credentials/logs were not accessible, so no claim is made that the old deployment’s runtime error has been fixed.
