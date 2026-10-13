import { SLOTS, manilaDate } from "./config";
export function validateReschedule(body: unknown, now = new Date()) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Choose a new date and time." };
  const b = body as Record<string, unknown>;
  const date = b.preferred_date, time = b.preferred_time;
  if (typeof date !== "string" || typeof time !== "string") return { error: "Choose a new date and time." };
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return { error: "Choose a valid date." };
  if (date < manilaDate(0, now) || date > manilaDate(90, now) || new Date(`${date}T${time}:00+08:00`).getTime() <= now.getTime()) return { error: "Choose a future time within the next 90 days." };
  if (!SLOTS.includes(time)) return { error: "Choose a time between 9:00 AM and 4:30 PM." };
  if (typeof b.expected_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.expected_date) || typeof b.expected_time !== "string" || !SLOTS.includes(b.expected_time) || !["pending", "confirmed"].includes(String(b.expected_status))) return { error: "Refresh the appointment list before changing the schedule." };
  if (date === b.expected_date && time === b.expected_time) return { error: "Choose a different date or time." };
  return { data: { date, time, expected_date: b.expected_date, expected_time: b.expected_time, expected_status: b.expected_status as string } };
}
