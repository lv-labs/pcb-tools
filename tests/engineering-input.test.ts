import assert from "node:assert/strict"
import test from "node:test"
import {
  defaultUnits,
  groupFrequencyInput,
  parseEngineeringInput,
} from "../src/lib/engineering-input.ts"
import { formatFrequency, solveRc } from "../src/lib/passive-rc-filters.ts"

test("plain resistance is ohms and suffixes normalize without changing the value", () => {
  for (const [text, expectedText, scale, unit] of [
    ["100", "100", 1, "Ω"],
    ["100r", "100", 1, "Ω"],
    ["100k", "100", 1000, "kΩ"],
    ["4.7k", "4.7", 1000, "kΩ"],
    ["1M", "1", 1e6, "MΩ"],
    [" 100 kΩ ", "100", 1000, "kΩ"],
  ] as const) {
    assert.deepEqual(parseEngineeringInput(text, "r"), {
      text: expectedText,
      scale,
      unit,
    })
  }
})

test("capacitor entry supports pico, nano and micro suffixes", () => {
  for (const [text, expectedText, scale, unit] of [
    ["100p", "100", 1e-12, "pF"],
    ["100n", "100", 1e-9, "nF"],
    ["1u", "1", 1e-6, "µF"],
    ["10u", "10", 1e-6, "µF"],
    ["2.2µF", "2.2", 1e-6, "µF"],
    [".1μ", ".1", 1e-6, "µF"],
    ["100", "100", 1e-9, "nF"],
  ] as const) {
    assert.deepEqual(parseEngineeringInput(text, "c"), {
      text: expectedText,
      scale,
      unit,
    })
  }
})

test("incremental edits keep units; clearing and full replacement restore defaults", () => {
  const kilo = { unit: "kΩ", scale: 1000 }
  assert.deepEqual(parseEngineeringInput("120", "r", kilo), {
    text: "120",
    ...kilo,
  })
  assert.deepEqual(parseEngineeringInput("100", "r", kilo, true), {
    text: "100",
    ...defaultUnits.r,
  })
  assert.deepEqual(parseEngineeringInput("", "r", kilo), {
    text: "",
    ...defaultUnits.r,
  })
  assert.deepEqual(
    parseEngineeringInput("100p", "c", { unit: "µF", scale: 1e-6 }),
    { text: "100", unit: "pF", scale: 1e-12 }
  )
  assert.equal(parseEngineeringInput("100x", "r").text, "100x")
})

test("frequency grouping preserves decimal entry and existing separators", () => {
  for (const [input, output] of [
    ["1250", "1,250"],
    ["10150", "10,150"],
    ["1000000", "1,000,000"],
    ["1,250", "1,250"],
    ["1250.", "1,250."],
    ["1250.05", "1,250.05"],
    ["", ""],
    [".", "."],
    ["12x", "12x"],
  ])
    assert.equal(groupFrequencyInput(input), output)
  assert.equal(formatFrequency(1250), "1,250 Hz")
  assert.equal(formatFrequency(10150), "10,150 Hz")
})

test("normalized component entries preserve the actual RC cutoff", () => {
  const r = parseEngineeringInput("100k", "r")
  const c = parseEngineeringInput("100p", "c")
  const cutoff = solveRc(Number(r.text) * r.scale, Number(c.text) * c.scale)!
  assert.ok(Math.abs(cutoff - 15915.494309189535) < 1e-8)
})
