import assert from "node:assert/strict"
import test from "node:test"
import {
  nextRcSolve,
  rcResponse,
  rcMatches,
  solveRc,
  standardValues,
} from "../src/lib/passive-rc-filters.ts"

test("RC equation solves cutoff, resistance and capacitance", () => {
  const r = 10000,
    c = 100e-9
  const f = solveRc(r, c)!
  assert.ok(Math.abs(f - 159.15494309189535) < 1e-10)
  assert.ok(Math.abs(solveRc(f, c)! / r - 1) < 1e-12)
  assert.ok(Math.abs(solveRc(r, f)! / c - 1) < 1e-12)
  for (const bad of [null, 0, -1, NaN, Infinity]) {
    assert.equal(solveRc(bad, c), null)
    assert.equal(solveRc(r, bad), null)
  }
  assert.equal(solveRc(1e-300, 1e-300), null)
  assert.equal(solveRc(1e300, 1e300), null)
})

test("editing any unlocked field solves the third without changing the lock", () => {
  for (const locked of ["r", "c", "f"] as const) {
    for (const edited of ["r", "c", "f"] as const) {
      const result = nextRcSolve(edited, locked, "pair")
      assert.notEqual(result, locked)
      assert.notEqual(result, "pair")
      if (edited !== locked) assert.notEqual(result, edited)
    }
  }
  assert.equal(nextRcSolve("f", null, "c"), "pair")
  assert.equal(nextRcSolve("r", null, "pair"), "f")
  assert.equal(nextRcSolve("c", null, "pair"), "f")
  assert.equal(nextRcSolve("f", "f", "r"), "r")
})

test("standard series have exact values and inclusive search bounds", () => {
  assert.deepEqual(
    standardValues("E6", 1e-9, 1e-8),
    [1e-9, 1.5e-9, 2.2e-9, 3.3e-9, 4.7e-9, 6.8e-9, 1e-8]
  )
  for (const series of ["E12", "E24", "E48", "E96"] as const) {
    const values = standardValues(series, 10, 1e6)
    assert.equal(values[0], 10)
    assert.equal(values.at(-1), 1e6)
    assert.equal(values.length, Number(series.slice(1)) * 5 + 1)
  }
})

test("matches preserve fixed components, compute signed error and rank correctly", () => {
  for (const mode of ["resistor", "capacitor", "pair"] as const) {
    const input = { r: 12345, c: 17e-9, f: 1234 }
    const rows = rcMatches(input, mode, "E96", "E12")
    assert.equal(rows.length, 6)
    for (const [index, row] of rows.entries()) {
      if (mode === "resistor") assert.equal(row.c, input.c)
      if (mode === "capacitor") assert.equal(row.r, input.r)
      assert.equal(row.cutoff, solveRc(row.r, row.c))
      assert.equal(row.error, (row.cutoff / input.f - 1) * 100)
      if (index)
        assert.ok(
          Math.abs(row.error) >= Math.abs(rows[index - 1].error) - 1e-10
        )
    }
  }
})

test("pair search finds the global best and exact matches prefer 10 kΩ", () => {
  const target = 1234
  const best = rcMatches(
    { r: null, c: null, f: target },
    "pair",
    "E24",
    "E6"
  )[0]
  for (const r of standardValues("E24", 10, 1e6))
    for (const c of standardValues("E6", 1e-12, 1e-3))
      assert.ok(
        Math.abs(best.error) <=
          Math.abs((solveRc(r, c)! / target - 1) * 100) + 1e-10
      )
  const exact = rcMatches(
    { r: null, c: null, f: solveRc(10000, 100e-9) },
    "pair",
    "E24",
    "E12"
  )[0]
  assert.equal(exact.r, 10000)
  assert.equal(exact.c, 100e-9)
  assert.ok(Math.abs(exact.error) < 1e-10)
})

test("invalid inputs do not produce matches, while target alone can find a pair", () => {
  for (const f of [null, 0, -1, Infinity, NaN])
    assert.deepEqual(
      rcMatches({ r: 10000, c: 1e-9, f }, "pair", "E24", "E12"),
      []
    )
  assert.deepEqual(
    rcMatches({ r: null, c: null, f: 1000 }, "capacitor", "E24", "E12"),
    []
  )
  assert.equal(
    rcMatches({ r: null, c: null, f: 1000 }, "pair", "E24", "E12").length,
    6
  )
})

test("Bode response has the correct cutoff, phase and asymptotes", () => {
  for (const highPass of [false, true]) {
    const cutoff = rcResponse(1, highPass)!
    assert.ok(Math.abs(cutoff.magnitude + 3.01029995664) < 1e-10)
    assert.equal(cutoff.phase, highPass ? 45 : -45)
    const passband = rcResponse(highPass ? 100 : 0.01, highPass)!
    const stopband = rcResponse(highPass ? 0.01 : 100, highPass)!
    assert.ok(Math.abs(passband.magnitude) < 0.001)
    assert.ok(Math.abs(passband.phase) < 0.6)
    assert.ok(Math.abs(stopband.magnitude + 40) < 0.001)
    assert.ok(Math.abs(Math.abs(stopband.phase) - 90) < 0.6)
    const farther = rcResponse(highPass ? 0.001 : 1000, highPass)!
    assert.ok(Math.abs(farther.magnitude - stopband.magnitude + 20) < 0.001)
  }
  for (const invalid of [0, -1, NaN, Infinity])
    assert.equal(rcResponse(invalid, false), null)
})
