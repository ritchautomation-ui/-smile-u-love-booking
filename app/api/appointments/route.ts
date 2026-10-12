import { configured, database, json, logCode, notify } from "@/lib/server";
import { validateBooking, type Appointment } from "@/lib/config";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Please submit from the clinic website." }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "Invalid request format." }, 415);
  let body: unknown;
  try { const raw = await req.text(); if (raw.length > 8192) return json({ error: "Request is too large." }, 413); body = JSON.parse(raw); } catch { return json({ error: "Invalid request." }, 400); }
  if (body && typeof body === "object" && "company" in body && body.company) return json({ error: "Please call the clinic to book." }, 400);
  const parsed = validateBooking(body);
  if ("error" in parsed) return json(parsed, 400);
  if (!configured()) return json({ error: "Online booking is not available yet. Please call the clinic; your request has not been saved." }, 503);
  try {
    const { request_id, ...input } = parsed.data;
    const reference = `SUL-${request_id.toUpperCase()}`;
    const { data, error } = await database().rpc("sul_submit_appointment", { p: { ...input, reference } });
    if (error) {
      logCode("save", error.code);
      return json({ error: "We could not save your request. Please call the clinic or try again later.", code: "BOOKING_UNAVAILABLE" }, 503);
    }
    if (data?.error === "RATE_LIMIT") return json({ error: "You have sent several requests recently. Please call the clinic instead." }, 429);
    if (data?.error === "REQUEST_CONFLICT") return json({ error: "This request was already saved with different details. Reload the page to start a new request." }, 409);
    if (!data?.appointment) return json({ error: "We could not save your request. Please call the clinic." }, 503);
    const row = data.appointment as Appointment;
    const notified = data.duplicate ? row.notified : await notify("appointment.requested", row);
    if (notified && !data.duplicate) await database().from("appointments").update({ notified: true }).eq("id", row.id);
    return json({ ok: true, reference: row.reference, status: row.status, notified });
  } catch { logCode("save"); return json({ error: "Booking is temporarily unavailable. Please call the clinic." }, 503); }
}
