import { UUID, type Appointment } from "@/lib/config";
import { database, diagnostic, json, logCode, notify, staffUser } from "@/lib/server";
export const runtime = "nodejs";
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await staffUser(req))) return json({ error: "Sign in with an approved admin account." }, 401);
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Invalid appointment." }, 400);
  let status: unknown;
  try { status = (await req.json())?.status; } catch { return json({ error: "Invalid request." }, 400); }
  if (status !== "confirmed" && status !== "declined") return json({ error: "Choose confirm or decline." }, 400);
  try {
    const { data, error } = await database().rpc("sul_review_appointment", { p_id: id, p_status: status });
    if (error) { logCode("review", error.code); return json({ error: diagnostic(error.code) }, 503); }
    if (data?.error) return json({ error: data.error === "SLOT_TAKEN" ? "Another appointment is already confirmed at this time. Contact the patient to arrange another time." : "This request was already reviewed. Refresh the list." }, 409);
    const row = data.appointment as Appointment;
    const notified = await notify("appointment.status_changed", row);
    return json({ appointment: row, notified });
  } catch { return json({ error: diagnostic() }, 503); }
}
