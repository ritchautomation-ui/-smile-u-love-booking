# Ilagay online ang standalone booking site

## 1. Bagong Vercel project

Sa Vercel, Add New → Project → piliin ang bagong booking repository. Framework: Next.js. Root Directory: `./`. Project name: `smile-u-love-booking` (o ibang available na pangalan). Hindi kailangang pareho ang project name at repository name.

## 2. Existing Supabase settings

Existing project: **smile-u-love-demo**.
Dashboard: https://supabase.com/dashboard/project/clcxlgycaihynaahgiiy

Nagawa at na-verify na ang `supabase/setup.sql` sa project na ito. Nandoon na ang appointments table at server-only booking functions. Hindi kailangang mag-delete o gumawa ng panibagong table. May isang confirmed Auth user na nakita sa setup; gamitin ang sarili mong existing admin credentials.

Sa bagong Vercel project, idagdag ang mga ito sa **Environment Variables → Production** (at Preview kung ite-test doon):

| Name | Ilalagay |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://clcxlgycaihynaahgiiy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon / publishable key ng same Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service_role / secret key ng same project |
| `STAFF_EMAILS` | Exact email ng existing confirmed admin sa Supabase Authentication → Users |

Kopyahin ang key values direkta mula sa Supabase o existing Vercel settings papunta sa bagong Vercel project. Huwag ilagay sa GitHub, chat, screenshots, o `.env.example`. Huwag palitan ang public key ng secret key.

Kapag ang existing save error ay galing sa maling key, huwag kopyahin ang maling value mula sa TapSpot. Kunin ang tamang public at server keys mula sa **same project** sa Supabase. Hindi kailangan ng database password para sa app.

## 3. Deploy

Click Deploy. Hintaying **Ready** at **Current Production**. Buksan ang bagong domain. May **Admin login** sa header; ang route ay `/admin`. Hindi Supabase dashboard password ang login dito: gamitin ang email/password ng user sa Supabase Authentication.

Kapag may binagong environment variable pagkatapos mag-deploy, gumawa ng bagong deployment para maisama iyon. Ang public variables ay kasama sa build.

## 4. Verify

1. Mag-log in sa `/admin`. Dapat lumabas ang `Connected to Supabase. Booking functions are ready.`
2. Kung unauthorized: tiyaking exact ang email sa `STAFF_EMAILS`, confirmed ang Auth user, at na-redeploy matapos baguhin ang settings.
3. Mag-submit ng isang test booking gamit ang sarili mong test contact details. Dapat may reference at `Request saved`.
4. Sa admin, Refresh → Waiting → Confirm. Makikita ang status sa Confirmed filter.
5. Ang pag-submit ay hindi automatic confirmation. Contact the patient to confirm.

## 5. Optional email notifications

Kung mayroon nang Make scenario, ilagay ang `MAKE_WEBHOOK_URL`, `CLINIC_NOTIFY_EMAIL`, at `NEXT_PUBLIC_SITE_URL` sa Vercel. Site URL ang bagong booking domain, walang trailing slash. Redeploy.

Supported events: `appointment.requested` at `appointment.status_changed`. Fields: reference, name, phone, email, service, preferred_date, preferred_time, preferred_time_label, status, clinic_name, clinic_phone, clinic_email, dashboard_url. Ang admin link sa payload ay `/admin` ng bagong site.

Kung walang Make, saved pa rin ang requests. Walang claim na na-email ang patient. Contact them manually.

## 6. TapSpot link pagkatapos mag-live

Kapag na-verify na ang bagong booking site, palitan ang Book button sa TapSpot para magbukas ng bagong booking URL. Sa bagong site na mag-manage ng requests, para iisa ang confirm/decline workflow. Ibigay ang bagong Vercel URL para maitama ang link.

## Ano ang verified, at ano ang hindi pa?

Verified ang source build, local booking/admin UI with synthetic data, input validation, database permissions, at real database functions using rollback tests. Hindi pa na-verify ang bagong Vercel deployment, live browser login, o actual email delivery hangga't hindi nalalagay ang environment settings at nade-deploy.
