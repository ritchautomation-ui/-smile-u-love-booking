import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CLINIC, slotLabel, type Appointment } from "./config";

export const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
export function database() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
export async function staffUser(req: Request) {
  if (!configured()) return null;
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token || token.length > 8192) return null;
  try {
    const { data, error } = await database().auth.getUser(token);
    if (error || !data.user?.email_confirmed_at) return null;
    const email = data.user.email?.toLowerCase();
    const allowed = (process.env.STAFF_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    return email && allowed.includes(email) ? { id: data.user.id, email } : null;
  } catch { return null; }
}
export function diagnostic(code?: string) {
  if (["42P01", "PGRST205", "PGRST202"].includes(code || "")) return "Database setup is incomplete. Apply supabase/setup.sql to the connected project.";
  if (["42703", "PGRST204"].includes(code || "")) return "The appointments table has a different structure. Compare it with supabase/setup.sql.";
  if (["42501", "PGRST301", "PGRST303", "401"].includes(code || "")) return "Database access was denied. Check the server-only Supabase key and table permissions.";
  return "The database could not be reached. Check the Supabase project status and Vercel environment settings.";
}
export function logCode(action: string, code?: string) {
  // Deliberately omit exception messages, keys, request bodies, tokens and patient details.
  console.error(`[booking:${action}]`, { code: code && /^[A-Z0-9_]{1,24}$/i.test(code) ? code : "DATABASE_UNAVAILABLE" });
}
export async function notify(event: string, row: Appointment) {
  const hook = process.env.MAKE_WEBHOOK_URL;
  if (!hook) return false;
  try {
    if (new URL(hook).protocol !== "https:") return false;
    const response = await fetch(hook, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ event, reference: row.reference, name: row.name, phone: row.phone, email: row.email, service: row.service, preferred_date: row.preferred_date, preferred_time: row.preferred_time, preferred_time_label: slotLabel(row.preferred_time), status: row.status, clinic_name: CLINIC.fullName, clinic_phone: CLINIC.phone, clinic_email: process.env.CLINIC_NOTIFY_EMAIL || "", dashboard_url: `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/admin` })
    });
    return response.ok;
  } catch { return false; }
}
