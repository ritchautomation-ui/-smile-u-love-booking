"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { dateLabel, manilaDate, SLOTS, slotLabel, type Appointment } from "@/lib/config";
import { validateReschedule } from "@/lib/reschedule";
import { adminFetch } from "@/lib/browser";
export function RescheduleForm({ row, onClose, onSaved }: { row: Appointment; onClose: () => void; onSaved: (notified: boolean) => void }) {
  const [date, setDate] = useState(row.preferred_date), [time, setTime] = useState(row.preferred_time);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, []);
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    const payload = { preferred_date: date, preferred_time: time, expected_date: row.preferred_date, expected_time: row.preferred_time, expected_status: row.status };
    const check = validateReschedule(payload);
    if (!check.data) { setError(check.error || "Check the schedule."); return; }
    setBusy(true); setError("");
    try {
      const response = await adminFetch(`/api/admin/appointments/${row.id}/reschedule`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Could not save this schedule."); return; }
      onSaved(data.notified);
    } catch { setError("Connection interrupted. Close this panel and refresh the list to check whether the schedule was saved before retrying."); }
    finally { setBusy(false); }
  }
  return <section className="review-panel" ref={ref} tabIndex={-1} aria-label="Change appointment schedule">
    <h2>{row.status === "confirmed" ? "Reschedule confirmed appointment" : "Change schedule & confirm"}</h2>
    <p><strong>{row.name}</strong> · Current: {dateLabel(row.preferred_date)} · {slotLabel(row.preferred_time)}</p>
    <p>Choose the date and time agreed with the patient. Saving confirms this schedule and requests a confirmation email to {row.email}.</p>
    <form onSubmit={save}><div className="hero-actions">
      <label htmlFor="reschedule-date">New date<input id="reschedule-date" type="date" required min={manilaDate()} max={manilaDate(90)} value={date} disabled={busy} onChange={e => setDate(e.target.value)} /></label>
      <label htmlFor="reschedule-time">New time<select id="reschedule-time" required value={time} disabled={busy} onChange={e => setTime(e.target.value)}>{SLOTS.map(s => <option key={s} value={s}>{slotLabel(s)}</option>)}</select></label>
    </div><p className="field-help">Philippine time. Occupied slots cannot be confirmed. The previous schedule is replaced only when saving succeeds.</p>
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="hero-actions"><button className="button" disabled={busy}>{busy ? "Saving…" : "Save & confirm new schedule"}</button><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancel</button></div></form>
  </section>;
}
