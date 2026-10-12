# Smile U Love · Appointment Booking

Standalone appointment website for Smile U Love Dental Clinic, Porac. Built with Next.js and the existing Supabase project, separate from the TapSpot storefront.

- `/` — services, appointment request form, contact and directions.
- `/admin` — Supabase email/password login, staff allowlist, appointment filters/search, confirm and decline.
- `/privacy` — appointment data notice.

## Run locally

Use Node.js 22 or 24. Run `npm ci`, copy `.env.example` to `.env.local`, fill in settings privately, then `npm run dev`.

Commands: `npm test`, `npm run typecheck`, `npm run build`, `npm start`.

## Deploy on Vercel

See [SETUP-TAGLISH.md](docs/SETUP-TAGLISH.md). Import this repository as a **new Vercel project**, using Next.js and root directory `./`. Do not import it over the TapSpot project.

The source works with `smile-u-love-demo` (`clcxlgycaihynaahgiiy`). Its `appointments` table is shared with the old TapSpot sample. `supabase/setup.sql` is additive and was applied to this project during setup. No existing records were deleted.

## Environment variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_EMAILS`. Use a public publishable/anon key for the first key and the project's service role/secret key only for the server setting. Never put the server key in a `NEXT_PUBLIC_` variable.

Optional: `MAKE_WEBHOOK_URL`, `CLINIC_NOTIFY_EMAIL`, `NEXT_PUBLIC_SITE_URL`. Without Make, appointments still save; staff must contact patients directly. An accepted webhook is not proof an email was delivered.

No passwords, keys, production patient data, or local QA fixtures are included in this repository.

## Behavior and access

Appointments are requests, not live reservations. Dates range from tomorrow to 90 days ahead in Asia/Manila; times range from 09:00 to 16:30. Clinic days and actual availability must be confirmed by staff. A service list is not a diagnosis or recommendation.

All administrative endpoints verify the Supabase user through `auth.getUser(token)` and check a server-only email allowlist. Public and authenticated Supabase roles have no direct access to appointment data or booking functions. Only the server role can execute the functions. Requests are not stored in browser local storage; the admin's Supabase session is stored in the browser by its SDK.

Database functions provide idempotent retries, a contact-based request rate limit, pending-only transitions, and collision checks when confirming appointments through this app. The old TapSpot sample can still write directly, so move its booking button to the new site after launch to keep all confirmations on this workflow. This is not a full anti-bot service: before a high-traffic public launch, add provider-level rate limiting/CAPTCHA if needed.

## Troubleshooting

The authenticated admin dashboard reports a safe database diagnostic. Server logs record operation names and database error codes only, not request contents or credentials. Missing configuration returns an explicit unavailable response: it never claims a request was saved in demo mode.

See [VALIDATION.md](docs/VALIDATION.md) for verification evidence and deployment limitations.
