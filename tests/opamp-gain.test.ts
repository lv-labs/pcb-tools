import assert from "node:assert/strict"
import test from "node:test"
import {
  closestMatches,
  closestPairs,
  gain,
  positiveNumber,
  preferredValues,
  solveResistor,
} from "../src/lib/opamp-gain.ts"

test("pair search finds exact ratios and prefers a 10 kΩ input resistor", () => {
  for (const series of ["E24", "E48", "E96"] as const) {
    for (const topology of ["inverting", "non-inverting"] as const) {
      const rows = closestPairs(
        topology,
        topology === "inverting" ? 10 : 11,
        series
      )
      assert.equal(rows.length, 6)
      assert.equal(rows[0].r1, 10000)
      assert.equal(rows[0].rf, 100000)
      assert.equal(rows[0].error, 0)
    }
  }
})

test("pair search finds the globally closest ratio and obeys series and range", () => {
  for (const topology of ["inverting", "non-inverting"] as const) {
    const target = 3.14159
    const rows = closestPairs(topology, target, "E24")
    const allowed = new Set([
      1000000,
      ...[10, 100, 1000].flatMap((scale) =>
        preferredValues.E24.map((base) => base * scale)
      ),
    ])
    for (const r1 of allowed)
      for (const rf of allowed) {
        const error =
          Math.abs(Math.abs(gain(topology, r1, rf)) / target - 1) * 100
        assert.ok(Math.abs(rows[0].error) <= error + 1e-12)
      }
    rows.forEach((row, index) => {
      assert.ok(allowed.has(row.r1) && allowed.has(row.rf))
      assert.equal(row.gain, gain(topology, row.r1, row.rf))
      if (index)
        assert.ok(
          Math.abs(row.error) >= Math.abs(rows[index - 1].error) - 1e-12
        )
    })
  }
  assert.equal(closestPairs("inverting", 0.001, "E24")[0].error, 0)
  assert.equal(closestPairs("inverting", 10000, "E24")[0].error, -90)
  for (const invalid of [0, -1, NaN, Infinity])
    assert.deepEqual(closestPairs("inverting", invalid, "E96"), [])
  assert.deepEqual(closestPairs("non-inverting", 1, "E24"), [])
})

test("gain and inverse calculations work for either fixed resistor and topology", () => {
  assert.equal(gain("inverting", 10000, 100000), -10)
  assert.equal(gain("non-inverting", 10000, 100000), 11)
  for (const topology of ["inverting", "non-inverting"] as const) {
    for (const locked of ["r1", "rf"] as const) {
      for (const target of [1.01, 2, 10, 100]) {
        const result = solveResistor(topology, locked, 10000, target)!
        const actual = Math.abs(
          gain(
            topology,
            locked === "r1" ? 10000 : result,
            locked === "rf" ? 10000 : result
          )
        )
        assert.ok(Math.abs(actual - target) < 1e-10)
      }
    }
  }
  assert.equal(solveResistor("inverting", "r1", 10000, 0.5), 5000)
})

test("invalid and unsupported values produce no result", () => {
  for (const value of ["", " ", "0", "-1", "abc", "Infinity", "1e999"])
    assert.equal(positiveNumber(value), null)
  assert.equal(positiveNumber("0.001"), 0.001)
  assert.equal(solveResistor("non-inverting", "r1", 10000, 1), null)
  assert.equal(solveResistor("non-inverting", "rf", 10000, 0.5), null)
  assert.equal(solveResistor("inverting", "r1", 1e300, 1e300), null)
  assert.deepEqual(closestMatches("non-inverting", "r1", 10000, 1, "E24"), [])
})

test("preferred series contain the correct counts and exact standard matches", () => {
  for (const series of ["E24", "E48", "E96"] as const) {
    assert.equal(preferredValues[series].length, Number(series.slice(1)))
    const matches = closestMatches("inverting", "r1", 10000, 10, series)
    assert.equal(matches.length, 6)
    assert.equal(matches[0].resistance, 100000)
    assert.equal(matches[0].gain, -10)
    assert.equal(matches[0].error, 0)
  }
})

test("matches span decade boundaries and rank by gain error for either lock", () => {
  const matches = closestMatches("inverting", "r1", 10000, 9.9, "E24")
  assert.equal(matches[0].resistance, 100000)
  assert.ok(matches.some((row) => row.resistance === 91000))
  for (const locked of ["r1", "rf"] as const) {
    const rows = closestMatches("non-inverting", locked, 10000, 3.7, "E96")
    rows.forEach((row, index) => {
      if (index)
        assert.ok(Math.abs(row.error) >= Math.abs(rows[index - 1].error))
      assert.equal(
        row.gain,
        gain(
          "non-inverting",
          locked === "r1" ? 10000 : row.resistance,
          locked === "rf" ? 10000 : row.resistance
        )
      )
    })
  }
})
