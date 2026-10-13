# Quick presentation

Requires Node.js 22 or 24. Run `npm ci` then `npm run dev` from the project folder.

Open `/sorting-demo` on your local development server. This page uses fictional records and needs no Supabase credentials. Select appointment time and click **Apply Sort**, then **Show Steps**.

Original array: Ana 14:00, Carlo 09:00, Bea 11:00.
1. Compare Ana and Carlo; swap.
2. Compare Ana and Bea; swap.
3. Compare Carlo and Bea; keep order.
Result: Carlo 09:00, Bea 11:00, Ana 14:00. Three comparisons, two swaps.

Explain: appointments are stored in an array. Bubble Sort compares adjacent records and swaps them if out of order. Each pass moves the largest remaining value to the end. An early exit stops when a pass has no swaps. Worst/average time O(n²), best time O(n). Equal keys keep their original order. The implementation copies the array so input is unchanged; that copy costs O(n) space. The comparison trace retains only the first 60 comparisons while counts cover the entire sort.

Source: `lib/sorting.ts`. Dashboard controls: `components/Admin.tsx`. Authenticated API: `app/api/admin/appointments/route.ts`.

The admin dashboard requires existing authorized Supabase login/configuration. Its Apply Sort button sorts all matching records BEFORE 30-record pagination. Classroom Bubble Sort is limited to 1,000 matching records; narrow filters for larger datasets. No appointment is edited by sorting. Demo page does not expose or bypass admin data.

Run `npm test` for validation and sorting tests. Live authenticated database integration has not been verified in this environment because Supabase settings are missing.
