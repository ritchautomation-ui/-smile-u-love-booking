import { UUID, type Appointment } from "@/lib/config";
import { validateReschedule } from "@/lib/reschedule";
import { database, diagnostic, json, logCode, notify, staffUser } from "@/lib/server";
export const runtime = "nodejs";
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await staffUser(req))) return json({ error: "Sign in with an approved admin account." }, 401);
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Invalid appointment." }, 400);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const checked = validateReschedule(body);
  if (!checked.data) return json({ error: checked.error }, 400);
  const d = checked.data;
  try {
    const { data, error } = await database().rpc("sul_reschedule_appointment", { p_id: id, p_date: d.date, p_time: d.time, p_expected_date: d.expected_date, p_expected_time: d.expected_time, p_expected_status: d.expected_status });
    if (error) { logCode("reschedule", error.code); return json({ error: diagnostic(error.code) }, 503); }
    if (data?.error) {
      const messages: Record<string,string> = { SLOT_TAKEN: "That time is already confirmed for another patient. Choose another slot.", STALE: "This booking has changed. Refresh the list before trying again.", NO_CHANGE: "Choose a different date or time.", INVALID_SCHEDULE: "Choose a future clinic time within the next 90 days.", NOT_FOUND: "Appointment no longer available." };
      return json({ error: messages[data.error] || "This appointment cannot be rescheduled." }, 409);
    }
    const row = data.appointment as Appointment;
    const notified = await notify("appointment.status_changed", row);
    return json({ appointment: row, notified });
  } catch { return json({ error: diagnostic() }, 503); }
}
