import { database, diagnostic, json, logCode, staffUser } from "@/lib/server";
import { bubbleSortAppointments, type SortField } from "@/lib/sorting";
import type { Appointment } from "@/lib/config";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const staff = await staffUser(req);
  if (!staff) return json({ error: "Sign in with an approved admin account." }, 401);
  const url = new URL(req.url);
  const page = Math.floor(Math.min(10000, Math.max(0, Number(url.searchParams.get("page")) || 0)));
  const filter = url.searchParams.get("status");
  const date = url.searchParams.get("date");
  const search = (url.searchParams.get("search") || "").replace(/[^\p{L}\p{N} @.+-]/gu, "").slice(0, 80);
  try {
    let query = database().from("appointments").select("id,reference,name,phone,email,service,preferred_date,preferred_time,status,created_at,notified", { count: "exact" });
    if (["pending", "confirmed", "declined"].includes(filter || "")) query = query.eq("status", filter!);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) query = query.eq("preferred_date", date);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,reference.ilike.%${search}%`);
    const sort = url.searchParams.get("sort");
    const sorting = ["date", "name", "newest"].includes(sort || "");
    const { data, error, count } = await (sorting
      ? query.order("id", { ascending: true }).range(0, 999)
      : query.order("created_at", { ascending: false }).range(page * 30, page * 30 + 29));
    if (error) { logCode("list", error.code); return json({ error: diagnostic(error.code) }, 503); }
    if (sorting && (count || 0) > 1000) return json({ error: "Bubble Sort demonstration supports up to 1,000 matching appointments. Narrow the status, date, or search filter." }, 422);
    if (sorting && data && data.length !== count) return json({ error: "The database returned an incomplete list. Narrow the filters before sorting." }, 503);
    const sorted = sorting ? bubbleSortAppointments((data || []) as Appointment[], sort as SortField) : null;
    const health = await database().rpc("sul_booking_health");
    return json({ appointments: sorted ? sorted.rows.slice(page * 30, page * 30 + 30) : data, sorting: sorted ? { comparisons: sorted.comparisons, swaps: sorted.swaps, steps: sorted.steps } : null, total: count, email: staff.email, connection: health.error ? diagnostic(health.error.code) : "Connected to Supabase. Booking functions are ready.", ready: !health.error });
  } catch { return json({ error: diagnostic() }, 503); }
}
