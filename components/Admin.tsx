"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Brand } from "./Brand";
import { adminFetch, authClient, authConfigured } from "@/lib/browser";
import { dateLabel, slotLabel, type Appointment } from "@/lib/config";
import { RescheduleForm } from "./RescheduleForm";


export function Admin() {
  const [signedIn, setSignedIn] = useState(false), [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Appointment[]>([]), [total, setTotal] = useState(0);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [email, setEmail] = useState(""), [connection, setConnection] = useState(""), [ready, setReady] = useState(false);
  const [status, setStatus] = useState("pending"), [search, setSearch] = useState(""), [searchDraft, setSearchDraft] = useState("");
  const [date, setDate] = useState(""), [page, setPage] = useState(0), [busyId, setBusyId] = useState("");
  const [action, setAction] = useState<{ row: Appointment; status: "confirmed" | "declined" } | null>(null);
  const [loginBusy, setLoginBusy] = useState(false), [showPassword, setShowPassword] = useState(false);
  const [sortChoice, setSortChoice] = useState("date"), [sort, setSort] = useState("");

  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  useEffect(() => { if (action) { reviewRef.current?.focus(); reviewRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); } }, [action]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams({ status, search, date, page: String(page), sort });
      const response = await adminFetch(`/api/admin/appointments?${q}`); const data = await response.json();
      if (!response.ok) { setRows([]); setTotal(0); setError(data.error || "Could not load appointments."); return; }
      setRows(data.appointments); setTotal(data.total); setEmail(data.email); setConnection(data.connection); setReady(data.ready);
    } catch { setError("Unable to connect. Check your connection and retry."); }
    finally { setLoading(false); }
  }, [status, search, date, page, sort]);
  useEffect(() => {
    if (!authConfigured()) { setLoading(false); return; }
    let active = true;
    authClient().auth.getSession().then(({ data }) => { if (active) { setSignedIn(Boolean(data.session)); setLoading(false); } }).catch(() => { if (active) { setError("Could not restore your login. Please sign in again."); setLoading(false); } });
    const { data } = authClient().auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); if (!session) { setRows([]); setEmail(""); setConnection(""); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (signedIn) void load(); }, [signedIn, load]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setLoginBusy(true); setError("");
    try { const { error } = await authClient().auth.signInWithPassword({ email: String(f.get("email")).trim(), password: String(f.get("password")) }); if (error) setError("Could not sign in. Check your email and password, then try again."); }
    catch { setError("Unable to reach sign-in. Check your connection and try again."); } finally { setLoginBusy(false); }
  }
  async function logout() {
    setError("");
    try { const { error } = await authClient().auth.signOut(); if (error) throw error; setRows([]); setReschedule(null); setSignedIn(false); setNotice(""); setAction(null); }
    catch { setError("Sign-out did not complete. Please try again."); }
  }
  async function review() {
    if (!action) return; setBusyId(action.row.id); setError(""); setNotice("");
    try {
      const response = await adminFetch(`/api/admin/appointments/${action.row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: action.status }) });
      const data = await response.json(); if (!response.ok) { setError(data.error || "Could not update this request."); setAction(null); return; }
      setNotice(data.notified ? "Status saved. The notification service accepted the update; email delivery is not verified here." : "Status saved. Please contact the patient directly; no automatic notification was sent."); setAction(null); await load();
    } catch { setError("Connection interrupted. Refresh the list to check whether the update was saved before retrying."); setAction(null); }
    finally { setBusyId(""); }
  }
  if (!signedIn) return <div className="admin-login"><header className="header-inner"><Brand /><Link className="text-link" href="/">← Public website</Link></header><main id="main" className="login-layout"><div className="login-photo"><img src="/images/smile-treatment-room.jpg" width="720" height="960" alt="Treatment room at Smile U Love" /><div><p className="eyebrow">SMILE U LOVE · CLINIC TEAM</p><h1>A good day starts<br />with a little care.</h1></div></div><div className="login-panel"><p className="eyebrow">ADMIN ACCESS</p><h2>Welcome back.</h2><p className="muted">Sign in to review appointment requests and plan the clinic’s day.</p>{!authConfigured() ? <div className="alert">Admin login is not configured yet. Add the Supabase project URL and public key in this Vercel project’s environment settings, then redeploy.</div> : loading ? <p role="status">Checking your session…</p> : <form onSubmit={login}><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="username" required /><label htmlFor="admin-password">Password</label><div className="password-field"><input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div>{error && <div className="alert error" role="alert">{error}</div>}<button className="button submit" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span></button><p className="field-help">For authorized clinic staff. Need access or a password reset? Contact the project owner.</p></form>}</div></main></div>;
  return <div className="admin-app"><aside className="admin-sidebar"><Brand /><p className="eyebrow">CLINIC WORKSPACE</p><a href="/admin" className="sidebar-active">Appointment requests <span>↗</span></a><div className="sidebar-bottom"><Link href="/">View public website ↗</Link><button onClick={logout}>Sign out</button></div></aside><main id="main" className="admin-main"><div className="admin-top"><p>Smile U Love <span>/</span> Appointment requests</p><span className="admin-avatar" aria-label="Admin">SU</span></div><div className="dashboard-heading"><div><p className="eyebrow">YOUR CLINIC, ORGANIZED</p><h1>Appointment requests</h1><p className="muted">Review preferred times. Contact each patient to confirm their visit.</p></div><button className="button secondary" onClick={() => void load()} disabled={loading}>↻ Refresh</button></div><div className={`connection ${ready ? "ok" : ""}`} role="status"><span className="small-dot" />{connection || "Checking your admin access…"}{email && <small>{email}</small>}</div>
    <div className="dashboard-tools"><div className="filters" role="group" aria-label="Appointment status">{["pending","confirmed","declined","all"].map(s => <button key={s} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(0); setAction(null); setReschedule(null); }}>{s === "pending" ? "Waiting" : s === "all" ? "All requests" : s[0].toUpperCase() + s.slice(1)}</button>)}</div><form className="search-form" onSubmit={e => { e.preventDefault(); setSearch(searchDraft); setPage(0); }}><label className="sr-only" htmlFor="search">Search name, email or reference</label><input id="search" value={searchDraft} onChange={e => setSearchDraft(e.target.value)} placeholder="Name, email or reference" /><button className="button secondary">Search</button></form><label className="date-filter">Visit date<input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(0); }} /></label>{(search || date) && <button className="text-link" onClick={() => { setSearch(""); setSearchDraft(""); setDate(""); setPage(0); }}>Clear filters</button>}</div>
    <section className="review-panel" aria-label="Sort appointments"><h2>Sort appointments</h2><div className="hero-actions"><label>Sort by <select value={sortChoice} onChange={e => setSortChoice(e.target.value)}><option value="date">Appointment date / time (earliest first)</option><option value="name">Patient name (A–Z)</option><option value="newest">Request date (newest first)</option></select></label><button className="button" disabled={loading} onClick={() => { setPage(0); if (sort === sortChoice && page === 0) void load(); else setSort(sortChoice); }}>Apply Sort</button><button className="button secondary" disabled={loading || !sort} onClick={() => { setSort(""); setPage(0); }}>Reset</button></div></section>
    {error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert" role="status">{notice}</div>}
    {reschedule && <RescheduleForm key={reschedule.id} row={reschedule} onClose={() => setReschedule(null)} onSaved={notified => { setReschedule(null); setNotice(notified ? "New schedule confirmed. Confirmation email requested; delivery is not verified here." : "New schedule confirmed, but the email request failed. Please contact the patient directly."); void load(); }} />}
    {action && <section className="review-panel" aria-label="Review appointment" ref={reviewRef} tabIndex={-1}><h2>{action.status === "confirmed" ? "Confirm this appointment?" : "Decline this requested time?"}</h2><p><strong>{action.row.name}</strong> · {dateLabel(action.row.preferred_date)} · {slotLabel(action.row.preferred_time)}</p><p>{action.status === "confirmed" ? "Check that the clinic can accommodate this visit." : "Contact the patient to explain and arrange another time."}</p><div className="hero-actions"><button className="button" disabled={Boolean(busyId)} onClick={review}>{busyId ? "Saving…" : action.status === "confirmed" ? "Confirm appointment" : "Decline request"}</button><button className="button secondary" disabled={Boolean(busyId)} onClick={() => setAction(null)}>Cancel</button></div></section>}
    <section aria-label="Appointment list" aria-busy={loading}><div className="list-caption"><h2>{status === "pending" ? "Waiting for your review" : "Your appointments"}</h2><span>{total} {total === 1 ? "request" : "requests"}</span></div>{loading ? <div className="empty" role="status">Loading appointments…</div> : rows.length === 0 ? <div className="empty"><span aria-hidden="true">✓</span><h3>{error ? "Appointments unavailable" : "Nothing here just yet."}</h3><p>{error ? "Resolve the connection issue above, then refresh." : "New requests will appear here. Try another filter or check back after a patient books."}</p></div> : <div className="appointments">{rows.map(row => <article key={row.id} className="appointment"><div className="appointment-date"><strong>{new Date(`${row.preferred_date}T00:00:00Z`).getUTCDate()}</strong><span>{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${row.preferred_date}T00:00:00Z`))}</span></div><div className="appointment-person"><h3>{row.name}</h3><p>{row.service}</p><small>{row.reference}</small><div className="contact-links"><a href={`tel:${row.phone}`}>{row.phone}</a><a href={`mailto:${row.email}`}>{row.email}</a></div></div><div className="appointment-time"><strong>{slotLabel(row.preferred_time)}</strong><span>{dateLabel(row.preferred_date)}</span><span className={`badge ${row.status}`}>{row.status === "pending" ? "Waiting" : row.status}</span></div><div className="appointment-actions">{row.status === "pending" ? <><button className="button compact" onClick={() => { setReschedule(null); setAction({ row, status: "confirmed" }); }} disabled={Boolean(busyId)}>Confirm</button><button className="text-link" onClick={() => { setReschedule(null); setAction({ row, status: "declined" }); }} disabled={Boolean(busyId)}>Decline</button><button className="text-link" disabled={Boolean(busyId)} onClick={() => { setAction(null); setReschedule(row); }}>Change schedule</button></> : row.status === "confirmed" ? <button className="button secondary compact" disabled={Boolean(busyId)} onClick={() => { setAction(null); setReschedule(row); }}>Reschedule</button> : <span className="muted">Reviewed</span>}</div></article>)}</div>}<div className="pagination"><button className="button secondary" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page + 1} of {Math.max(1, Math.ceil(total / 30))}</span><button className="button secondary" disabled={(page + 1) * 30 >= total || loading} onClick={() => setPage(page + 1)}>Next →</button></div></section>
  </main></div>;
}
