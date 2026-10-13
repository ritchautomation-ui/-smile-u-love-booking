"use client";
import { useState } from "react";
import Link from "next/link";
import { bubbleSortAppointments, type SortField } from "@/lib/sorting";
import type { Appointment } from "@/lib/config";
import { SortingSteps } from "@/components/SortingSteps";
const samples: Appointment[] = [
  { name: "Ana (sample)", preferred_time: "14:00" },
  { name: "Carlo (sample)", preferred_time: "09:00" },
  { name: "Bea (sample)", preferred_time: "11:00" }
].map((row, i) => ({ ...row, id: String(i), reference: `SAMPLE-${i}`, phone: "", email: "", service: "Classroom sample", preferred_date: "2026-10-15", status: "pending", created_at: `2026-10-13T0${i + 1}:00:00Z`, notified: false }));
export default function SortingDemo() {
  const [field, setField] = useState<SortField>("date");
  const [result, setResult] = useState<ReturnType<typeof bubbleSortAppointments> | null>(null);
  return <main className="admin-main"><p className="eyebrow">DATA STRUCTURES · SAMPLE DATA ONLY</p><h1>Bubble Sort demonstration</h1><p>This demo uses three fictional appointments. No login or database required; nothing is saved.</p><p>Original: Ana — 14:00 → Carlo — 09:00 → Bea — 11:00</p><div className="hero-actions"><label>Sort by <select value={field} onChange={e => { setField(e.target.value as SortField); setResult(null); }}><option value="date">Appointment date / time</option><option value="name">Name A–Z</option><option value="newest">Newest request</option></select></label><button className="button" onClick={() => setResult(bubbleSortAppointments(samples, field))}>Apply Sort</button><button className="button secondary" onClick={() => setResult(null)}>Reset</button></div><ol>{(result?.rows || samples).map(row => <li key={row.id}>{row.name} — {row.preferred_time}</li>)}</ol>{result && <SortingSteps result={result} />}<p><Link href="/admin">Go to admin dashboard →</Link></p></main>;
}
