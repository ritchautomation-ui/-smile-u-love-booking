export const CLINIC = {
  name: "Smile U Love", fullName: "Smile U Love Dental Clinic", branch: "Porac, Pampanga",
  phone: "0930 460 6787", phoneTel: "+639304606787",
  address: "2nd Floor, above Porac Bank (Manibaug Branch), Purok 3, National Road, Manibaug Paralaya, Porac, Pampanga",
  maps: "https://maps.app.goo.gl/TKasa7jtP8MhEty76",
  facebook: "https://www.facebook.com/share/19VJyHkHxi/"
};
export const SERVICES = [
  { name: "General dentistry", detail: "Check-ups and everyday dental care.", icon: "01" },
  { name: "Orthodontics (braces)", detail: "Talk with the dentist about braces and your options.", icon: "02" },
  { name: "Aesthetic dentistry", detail: "Explore care for the smile you have in mind.", icon: "03" },
  { name: "Oral surgery", detail: "Arrange a consultation about your dental concern.", icon: "04" },
  { name: "Tooth replacement", detail: "Ask about options for replacing a missing tooth.", icon: "05" },
  { name: "Not sure yet", detail: "Start with a visit. We’ll help you find the next step.", icon: "06" }
] as const;
export const SLOTS = Array.from({ length: 16 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
export type Status = "pending" | "confirmed" | "declined";
export type Appointment = { id: string; reference: string; name: string; phone: string; email: string; service: string; preferred_date: string; preferred_time: string; status: Status; created_at: string; notified: boolean };
export const slotLabel = (s: string) => { const [h, m] = s.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
export function manilaDate(offset = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now.getTime() + offset * 86400000));
  const part = (t: string) => parts.find(p => p.type === t)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export const dateLabel = (s: string) => new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type BookingInput = { name: string; phone: string; email: string; service: string; preferred_date: string; preferred_time: string; request_id: string };
export function validateBooking(body: unknown, now = new Date()): { data: BookingInput } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Please complete the booking form." };
  const b = body as Record<string, unknown>;
  const s = (key: string) => typeof b[key] === "string" ? (b[key] as string).trim() : "";
  const name = s("name"), email = s("email").toLowerCase();
  let phone = s("phone").replace(/[\s()-]/g, "");
  if (/^09\d{9}$/.test(phone)) phone = "+63" + phone.slice(1);
  if (/^639\d{9}$/.test(phone)) phone = "+" + phone;
  if (name.length < 2 || name.length > 80) return { error: "Enter your full name (2–80 characters)." };
  if (!/^\+639\d{9}$/.test(phone)) return { error: "Enter a Philippine mobile number, such as 09xx xxx xxxx." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return { error: "Enter a valid email address." };
  const service = s("service"), preferred_date = s("preferred_date"), preferred_time = s("preferred_time"), request_id = s("request_id");
  if (!SERVICES.some(x => x.name === service)) return { error: "Choose a service." };
  const parsed = new Date(`${preferred_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferred_date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== preferred_date) return { error: "Choose a valid date." };
  if (preferred_date < manilaDate(1, now) || preferred_date > manilaDate(90, now)) return { error: "Choose a date from tomorrow through the next 90 days." };
  if (!SLOTS.includes(preferred_time)) return { error: "Choose a time between 9:00 AM and 4:30 PM." };
  if (b.consent !== true) return { error: "Please agree to the use of your details for this appointment." };
  if (!UUID.test(request_id)) return { error: "Please reload the page and try again." };
  return { data: { name, email, phone, service, preferred_date, preferred_time, request_id } };
}
