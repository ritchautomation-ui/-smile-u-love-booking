import type { SortStep } from "@/lib/sorting";
export function SortingSteps({ result }: { result: { comparisons: number; swaps: number; steps: SortStep[] } }) {
  return <div><p role="status"><strong>{result.comparisons}</strong> comparisons · <strong>{result.swaps}</strong> swaps. Bubble Sort compares adjacent records and swaps those in the wrong order. Worst case: O(n²); already sorted: O(n).</p><details><summary>Show Steps</summary><p>First {result.steps.length} of {result.comparisons} comparisons. Each row shows the pair before its possible swap.</p><ol>{result.steps.map((step, i) => <li key={i}>{step.left} ↔ {step.right} — <strong>{step.swapped ? "Swap" : "Keep order"}</strong></li>)}</ol>{!result.steps.length && <p>No comparisons needed.</p>}</details></div>;
}
