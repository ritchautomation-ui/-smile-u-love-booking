import test from "node:test";
import assert from "node:assert/strict";
import { validateReschedule } from "../lib/reschedule";
const now = new Date("2026-10-13T01:00:00Z");
const input = { preferred_date: "2026-10-14", preferred_time: "10:00", expected_date: "2026-10-14", expected_time: "09:00", expected_status: "pending" };
test("allows pending and confirmed schedule changes", () => {
  assert.ok(validateReschedule(input, now).data);
  assert.ok(validateReschedule({ ...input, expected_status: "confirmed" }, now).data);
});
test("rejects invalid, occupied-independent input before database calls", () => {
  for (const changes of [{preferred_date:"2026-02-30"}, {preferred_time:"18:00"}, {expected_status:"declined"}, {preferred_time:"09:00"}, {preferred_date:"2026-10-12"}, {preferred_date:"2027-12-01"}]) assert.ok(validateReschedule({...input,...changes},now).error);
  assert.ok(validateReschedule(null, now).error);
});
test("same-day admin reschedule must be in the future in Manila", () => {
  assert.ok(validateReschedule({...input,preferred_date:"2026-10-13",preferred_time:"09:00"},now).error);
  assert.ok(validateReschedule({...input,preferred_date:"2026-10-13",preferred_time:"09:30"},now).data);
});
