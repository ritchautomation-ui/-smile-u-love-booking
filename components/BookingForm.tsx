"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { SERVICES, SLOTS, slotLabel, dateLabel, CLINIC } from "@/lib/config";
type Receipt = { reference: string; status: string; notified: boolean };
export function BookingForm({ minDate, maxDate }: { minDate: string; maxDate: string }) {
  const [service, setService] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [visit, setVisit] = useState({ date: "", time: "" });
  const requestId = useRef("");
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { requestId.current = crypto.randomUUID(); const requested = new URLSearchParams(window.location.search).get("service"); if (SERVICES.some(s => s.name === requested)) setService(requested!); }, []);
  useEffect(() => { if (receipt || error) resultRef.current?.focus(); }, [receipt, error]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const f = new FormData(e.currentTarget); setError(""); setBusy(true);
    const date = String(f.get("preferred_date")), time = String(f.get("preferred_time"));
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(f), consent: f.get("consent") === "on", request_id: requestId.current || (requestId.current = crypto.randomUUID()) }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to save. Please try again."); return; }
      setVisit({ date, time }); setReceipt(data);
    } catch { setError("Connection interrupted. Try again with the same details; we’ll check for an existing request before saving another."); }
    finally { setBusy(false); }
  }
  if (receipt) return <div className="booking-card receipt" ref={resultRef} tabIndex={-1} role="status"><span className="receipt-check" aria-hidden="true">✓</span><p className="eyebrow">REQUEST SAVED</p><h2>{receipt.status === "confirmed" ? "Your visit is confirmed." : receipt.status === "declined" ? "This request was declined." : "You’re on our request list."}</h2><p>{receipt.status === "pending" ? "Your preferred time is awaiting confirmation. Our team will contact you to arrange your visit." : "Contact the clinic if you need to change your plans."}</p><div className="receipt-details"><strong>{service}</strong><span>{dateLabel(visit.date)} · {slotLabel(visit.time)}</span><small>Philippine time (UTC+8)</small></div><p className="reference">Reference <strong>{receipt.reference}</strong></p><p className="muted">{receipt.notified ? "Your request was also sent to the clinic’s notification service." : "Keep this reference. Automatic email is not available for this request; the clinic can contact you directly."}</p><a className="button secondary" href={`tel:${CLINIC.phoneTel}`}>Call the clinic</a><button className="text-link new-request" onClick={() => { setReceipt(null); requestId.current = crypto.randomUUID(); }}>Send another request</button></div>;
  return <form className="booking-card" onSubmit={submit}><div className="form-title"><span className="eyebrow">APPOINTMENT REQUEST</span><span className="form-time">About 2 minutes</span></div><h3>Let’s find a time for you.</h3><p className="muted">All fields are required. Times are in the Philippines.</p>
    <fieldset disabled={busy}><legend>Your visit</legend><label htmlFor="service">What can we help with?</label><select id="service" name="service" required value={service} onChange={e => setService(e.target.value)}><option value="">Choose a service</option>{SERVICES.map(s => <option key={s.name}>{s.name}</option>)}</select><div className="field-grid"><div><label htmlFor="date">Preferred date</label><input id="date" name="preferred_date" type="date" required min={minDate} max={maxDate} /></div><div><label htmlFor="time">Preferred time</label><select id="time" name="preferred_time" required defaultValue=""><option value="">Choose a time</option>{SLOTS.map(t => <option key={t} value={t}>{slotLabel(t)}</option>)}</select></div></div><p className="field-help">This is a preferred time, subject to the clinic’s confirmation.</p></fieldset>
    <fieldset disabled={busy}><legend>Your details</legend><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Your full name" /><div className="field-grid"><div><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required maxLength={24} placeholder="09xx xxx xxxx" /></div><div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={120} placeholder="you@example.com" /></div></div></fieldset>
    <div className="honeypot" aria-hidden="true"><label htmlFor="company">Company</label><input id="company" name="company" tabIndex={-1} autoComplete="off" /></div><label className="consent"><input type="checkbox" name="consent" required disabled={busy} /><span>I agree that the clinic may use my contact details to arrange this appointment. <Link href="/privacy">Read the privacy notice.</Link></span></label><p className="field-help">Please don’t include medical information in this form.</p>{error && <div className="alert error" role="alert" ref={resultRef} tabIndex={-1}>{error}</div>}<button className="button submit" disabled={busy}>{busy ? "Saving your request…" : "Request appointment"}<span aria-hidden="true">↗</span></button><p className="form-bottom">No payment is collected online.</p></form>;
}
