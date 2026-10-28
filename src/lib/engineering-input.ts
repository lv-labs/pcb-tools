export type ComponentField = "r" | "c"
export type EngineeringInput = { text: string; unit: string; scale: number }

export const defaultUnits = {
  r: { unit: "Ω", scale: 1 },
  c: { unit: "nF", scale: 1e-9 },
}
const suffixes: Record<
  ComponentField,
  Record<string, { unit: string; scale: number }>
> = {
  r: {
    r: { unit: "Ω", scale: 1 },
    R: { unit: "Ω", scale: 1 },
    Ω: { unit: "Ω", scale: 1 },
    k: { unit: "kΩ", scale: 1e3 },
    K: { unit: "kΩ", scale: 1e3 },
    M: { unit: "MΩ", scale: 1e6 },
  },
  c: {
    p: { unit: "pF", scale: 1e-12 },
    n: { unit: "nF", scale: 1e-9 },
    u: { unit: "µF", scale: 1e-6 },
    µ: { unit: "µF", scale: 1e-6 },
    μ: { unit: "µF", scale: 1e-6 },
    m: { unit: "mF", scale: 1e-3 },
    F: { unit: "F", scale: 1 },
  },
}

// A suffix replaces the current unit. Clearing or replacing the entire entry
// starts in base ohms / default nF; incremental edits keep the displayed unit.
export function parseEngineeringInput(
  text: string,
  field: ComponentField,
  current = defaultUnits[field],
  replace = false
): EngineeringInput {
  const fallback = replace || !text.trim() ? defaultUnits[field] : current
  const match = text
    .trim()
    .match(/^((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([a-zA-ZµμΩ]+)$/)
  if (match) {
    const suffix =
      field === "r"
        ? match[2].replace(/Ω$/, "") || "Ω"
        : match[2] === "F"
          ? "F"
          : match[2].replace(/F$/, "")
    const unit = suffixes[field][suffix]
    if (unit) return { text: match[1], ...unit }
  }
  return { text, ...fallback }
}

// Group only the integer portion, preserving partially typed decimal values.
export function groupFrequencyInput(text: string) {
  const raw = text.replaceAll(",", "")
  if (!/^\d*(?:\.\d*)?$/.test(raw)) return text
  const [integer, fraction] = raw.split(".")
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}
