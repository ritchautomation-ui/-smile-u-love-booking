import type { Appointment } from "./config";
export type SortField = "date" | "name" | "newest";
export type SortStep = { left: string; right: string; swapped: boolean };
export function bubbleSortAppointments(input: Appointment[], field: SortField) {
  const rows = [...input];
  const steps: SortStep[] = [];
  let comparisons = 0, swaps = 0;
  const key = (row: Appointment) => field === "name" ? row.name : field === "newest" ? row.created_at : `${row.preferred_date} ${row.preferred_time}`;
  for (let end = rows.length - 1; end > 0; end--) {
    let changed = false;
    for (let i = 0; i < end; i++) {
      const left = rows[i], right = rows[i + 1];
      const comparison = key(left).localeCompare(key(right), "en", { sensitivity: "base" });
      const swapped = field === "newest" ? comparison < 0 : comparison > 0;
      comparisons++;
      if (steps.length < 60) steps.push({ left: `${left.name}: ${key(left)}`, right: `${right.name}: ${key(right)}`, swapped });
      if (swapped) { [rows[i], rows[i + 1]] = [right, left]; swaps++; changed = true; }
    }
    if (!changed) break;
  }
  return { rows, comparisons, swaps, steps };
}
