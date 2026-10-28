export type Topology = "inverting" | "non-inverting"
export type Resistor = "r1" | "rf"
export type ESeries = "E24" | "E48" | "E96"

// Published preferred numbers, normalized to one decade (not logarithmic approximations).
export const preferredValues: Record<ESeries, number[]> = {
  E24: [
    100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 330, 360, 390,
    430, 470, 510, 560, 620, 680, 750, 820, 910,
  ],
  E48: [
    100, 105, 110, 115, 121, 127, 133, 140, 147, 154, 162, 169, 178, 187, 196,
    205, 215, 226, 237, 249, 261, 274, 287, 301, 316, 332, 348, 365, 383, 402,
    422, 442, 464, 487, 511, 536, 562, 590, 619, 649, 681, 715, 750, 787, 825,
    866, 909, 953,
  ],
  E96: [
    100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140,
    143, 147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200,
    205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287,
    294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412,
    422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590,
    604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845,
    866, 887, 909, 931, 953, 976,
  ],
}

export function positiveNumber(value: string) {
  const number = Number(value)
  return value.trim() && Number.isFinite(number) && number > 0 ? number : null
}

export function gain(topology: Topology, r1: number, rf: number) {
  return topology === "inverting" ? -rf / r1 : 1 + rf / r1
}

// Target is the positive magnitude; inverting polarity is applied to the result.
export function solveResistor(
  topology: Topology,
  locked: Resistor,
  resistance: number,
  target: number
) {
  const ratio = topology === "inverting" ? target : target - 1
  if (!(ratio > 0) || !(resistance > 0)) return null
  const result = locked === "r1" ? resistance * ratio : resistance / ratio
  return Number.isFinite(result) && result > 0 ? result : null
}

export function closestMatches(
  topology: Topology,
  locked: Resistor,
  resistance: number,
  target: number,
  series: ESeries
) {
  const ideal = solveResistor(topology, locked, resistance, target)
  if (ideal === null) return []
  const decade = Math.floor(Math.log10(ideal))
  return [-1, 0, 1]
    .flatMap((offset) =>
      preferredValues[series].map((base) =>
        Number(((base / 100) * 10 ** (decade + offset)).toPrecision(12))
      )
    )
    .filter((value) => value > 0 && Number.isFinite(value))
    .map((value) => {
      const actual = gain(
        topology,
        locked === "r1" ? resistance : value,
        locked === "rf" ? resistance : value
      )
      return {
        resistance: value,
        gain: actual,
        error: (Math.abs(actual) / target - 1) * 100,
      }
    })
    .filter((row) => Number.isFinite(row.error))
    .sort(
      (a, b) =>
        Math.abs(a.error) - Math.abs(b.error) || a.resistance - b.resistance
    )
    .slice(0, 6)
}

export function formatNumber(value: number) {
  return Number(value.toPrecision(8)).toString()
}

// Search both resistors over 1 kΩ–1 MΩ. Equivalent ratios prefer R1 near 10 kΩ.
export function closestPairs(
  topology: Topology,
  target: number,
  series: ESeries
) {
  if (!Number.isFinite(target) || target <= (topology === "inverting" ? 0 : 1))
    return []
  const values = [1, 10, 100].flatMap((scale) =>
    preferredValues[series].map((base) => base * 10 * scale)
  )
  values.push(1e6)
  return values
    .flatMap((r1) =>
      values.map((rf) => {
        const actual = gain(topology, r1, rf)
        return {
          r1,
          rf,
          gain: actual,
          error: (Math.abs(actual) / target - 1) * 100,
        }
      })
    )
    .filter((row) => Number.isFinite(row.error))
    .sort((a, b) => {
      const difference = Math.abs(a.error) - Math.abs(b.error)
      return Math.abs(difference) > 1e-12
        ? difference
        : Math.abs(Math.log10(a.r1 / 10000)) -
            Math.abs(Math.log10(b.r1 / 10000)) ||
            a.r1 - b.r1 ||
            a.rf - b.rf
    })
    .slice(0, 6)
}

export function formatResistance(value: number) {
  if (value >= 1e6) return `${formatNumber(value / 1e6)} MΩ`
  if (value >= 1e3) return `${formatNumber(value / 1e3)} kΩ`
  return `${formatNumber(value)} Ω`
}
