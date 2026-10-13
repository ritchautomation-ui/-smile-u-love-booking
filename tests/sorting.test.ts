import test from 'node:test';
import assert from 'node:assert/strict';
import { bubbleSortAppointments } from '../lib/sorting';
import type { Appointment } from '../lib/config';
const row = (name: string, time: string, created = time): Appointment => ({ id: name, name, preferred_date: '2026-10-15', preferred_time: time, created_at: created, reference: '', phone: '', email: '', service: '', status: 'pending', notified: false });
test('sorts appointment times without mutating input and records swaps', () => {
 const input = [row('Ana','14:00'),row('Carlo','09:00'),row('Bea','11:00')];
 const result = bubbleSortAppointments(input,'date');
 assert.deepEqual(result.rows.map(r=>r.name),['Carlo','Bea','Ana']);
 assert.deepEqual(input.map(r=>r.name),['Ana','Carlo','Bea']);
 assert.equal(result.swaps,2); assert.equal(result.comparisons,3);
 assert.deepEqual(result.steps.map(s=>s.swapped),[true,true,false]);
});
test('name sorting is stable for equal names and handles empty and sorted input', () => {
 const a=row('ana','14:00'), b=row('Ana','09:00');
 assert.deepEqual(bubbleSortAppointments([a,b],'name').rows,[a,b]);
 assert.equal(bubbleSortAppointments([],'date').comparisons,0);
 assert.equal(bubbleSortAppointments([row('A','09:00'),row('B','10:00'),row('C','11:00')],'date').comparisons,2);
});
test('newest requests descend; sorting precedes page slicing; trace is bounded', () => {
 const input = Array.from({length:35},(_,i)=>row(String(i),String(35-i).padStart(2,'0')));
 const result = bubbleSortAppointments(input,'date');
 assert.equal(result.rows.slice(0,30)[0].id,'34'); assert.equal(result.rows.slice(30)[4].id,'0');
 assert.equal(result.steps.length,60);
 assert.deepEqual(bubbleSortAppointments([row('A','09:00','2026-10-12'),row('B','10:00','2026-10-13')],'newest').rows.map(r=>r.id),['B','A']);
});
