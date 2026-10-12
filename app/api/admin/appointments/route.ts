import { database, diagnostic, json, logCode, staffUser } from "@/lib/server";
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
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(page * 30, page * 30 + 29);
    if (error) { logCode("list", error.code); return json({ error: diagnostic(error.code) }, 503); }
    const health = await database().rpc("sul_booking_health");
    return json({ appointments: data, total: count, email: staff.email, connection: health.error ? diagnostic(health.error.code) : "Connected to Supabase. Booking functions are ready.", ready: !health.error });
  } catch { return json({ error: diagnostic() }, 503); }
}
