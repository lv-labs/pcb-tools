import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, divider, resistors, opamp, filter, fmt, DBU_REFERENCE } from './calculators.ts';
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);
test('signal levels round-trip through every editable unit', () => {
  const reference = levels(1, 'vrms');
  for (const unit of ['vrms', 'vpp', 'vpeak', 'dbu', 'dbv'] as const) close(levels(reference[unit], unit).vrms, 1);
  close(levels(0, 'dbu').vrms, DBU_REFERENCE);
  close(reference.vpp, 2 * Math.SQRT2);
  assert.equal(levels(0, 'vrms').dbu, -Infinity);
});
test('resistor networks and unloaded divider', () => {
  assert.deepEqual(resistors(10000, 10000), { series: 20000, parallel: 5000 });
  assert.deepEqual(divider(5, 10000, 10000), { voltage: 2.5, current: .00025, impedance: 5000 });
});
test('amplifier gain preserves polarity', () => {
  close(opamp(10000, 100000, false).gain, 11);
  close(opamp(10000, 100000, true).gain, -10);
  close(opamp(10000, 100000, true).db, 20);
});
test('filter cutoff, phase and passband gain', () => {
  const fc = 1 / (2 * Math.PI * 10000 * 10e-9);
  const lp = filter(10000, 10e-9, fc, false);
  close(lp.magnitude, 1 / Math.SQRT2); close(lp.phase, -45);
  close(filter(10000, 10e-9, fc, true).phase, 45);
  close(filter(10000, 10e-9, fc, false, 11).magnitude, 11 / Math.SQRT2);
});
test('engineering formatting covers zero, negative and small values', () => {
  assert.equal(fmt(0, 'V'), '0 V'); assert.equal(fmt(.00001, 'A'), '10 µA');
  assert.equal(fmt(-10, '×'), '-10 ×'); assert.equal(fmt(NaN, 'V'), '—');
});
