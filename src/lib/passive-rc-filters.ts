import { preferredValues, type ESeries } from "./opamp-gain.ts"

export type RcField = "r" | "c" | "f"
export type MatchMode = "resistor" | "capacitor" | "pair"
export type ResistorSeries = "E12" | ESeries
export type CapacitorSeries = "E6" | "E12" | "E24"
export type RcValues = Record<RcField, number | null>

const e6 = [100, 150, 220, 330, 470, 680]
const e12 = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820]
const seriesValues = { ...preferredValues, E6: e6, E12: e12 }
const valid = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && value > 0

// R in ohms, C in farads, f in hertz. All three inverse solutions share
// the same expression, using the two independent values.
export function solveRc(a: number | null, b: number | null) {
  if (!valid(a) || !valid(b)) return null
  const result = 1 / (2 * Math.PI) / a / b
  return valid(result) ? result : null
}

// Frequency normalized to the actual RC cutoff: ratio = f / fc.
export function rcResponse(ratio: number, highPass: boolean) {
  if (!valid(ratio)) return null
  return {
    magnitude: -20 * Math.log10(Math.hypot(1, highPass ? 1 / ratio : ratio)),
    phase: highPass
      ? (Math.atan(1 / ratio) * 180) / Math.PI
      : (-Math.atan(ratio) * 180) / Math.PI,
  }
}

export function nextRcSolve(
  edited: RcField,
  locked: RcField | null,
  previous: RcField | "pair"
): RcField | "pair" {
  if (!locked) return edited === "f" ? "pair" : "f"
  if (edited !== locked)
    return (["r", "c", "f"] as const).find(
      (field) => field !== locked && field !== edited
    )!
  return previous !== "pair" && previous !== locked
    ? previous
    : locked === "c"
      ? "r"
      : "c"
}

export function standardValues(
  series: ResistorSeries | CapacitorSeries,
  min: number,
  max: number
) {
  const values: number[] = []
  for (
    let decade = Math.floor(Math.log10(min));
    decade <= Math.ceil(Math.log10(max));
    decade++
  ) {
    for (const base of seriesValues[series]) {
      const value = Number(((base / 100) * 10 ** decade).toPrecision(12))
      if (value >= min && value <= max) values.push(value)
    }
  }
  return values
}

export function rcMatches(
  values: RcValues,
  mode: MatchMode,
  resistors: ResistorSeries,
  capacitors: CapacitorSeries
) {
  if (!valid(values.f)) return []
  const target = values.f
  const rs =
    mode === "capacitor"
      ? valid(values.r)
        ? [values.r]
        : []
      : standardValues(resistors, 10, 1e6)
  const cs =
    mode === "resistor"
      ? valid(values.c)
        ? [values.c]
        : []
      : standardValues(capacitors, 1e-12, 1e-3)
  return rs
    .flatMap((r) =>
      cs.map((c) => {
        const cutoff = solveRc(r, c)
        return {
          r,
          c,
          cutoff: cutoff ?? NaN,
          error: cutoff === null ? NaN : (cutoff / target - 1) * 100,
        }
      })
    )
    .filter((row) => Number.isFinite(row.error))
    .sort((a, b) => {
      const difference = Math.abs(a.error) - Math.abs(b.error)
      return Math.abs(difference) > 1e-10
        ? difference
        : Math.abs(Math.log10(a.r / 10000)) -
            Math.abs(Math.log10(b.r / 10000)) ||
            a.r - b.r ||
            a.c - b.c
    })
    .slice(0, 6)
}

export function formatCapacitance(value: number) {
  if (value >= 1e-6) return `${Number((value * 1e6).toPrecision(8))} µF`
  if (value >= 1e-9) return `${Number((value * 1e9).toPrecision(8))} nF`
  return `${Number((value * 1e12).toPrecision(8))} pF`
}

export function formatFrequency(value: number) {
  return `${value.toLocaleString("en-GB", { maximumSignificantDigits: 8 })} Hz`
}
