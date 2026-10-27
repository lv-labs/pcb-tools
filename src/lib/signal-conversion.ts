export type SignalUnit = "Vpp" | "Vp" | "Vrms" | "dBu" | "dBV"

// Peak/RMS conversions assume a sine wave with no DC offset.
// dBu references 0.775 Vrms; dBV references 1 Vrms.
export function convertSignal(unit: SignalUnit, value: number) {
  if (!Number.isFinite(value)) return null
  if (unit.startsWith("V") && value < 0) return null

  let rms: number
  switch (unit) {
    case "Vpp":
      rms = value / (2 * Math.SQRT2)
      break
    case "Vp":
      rms = value / Math.SQRT2
      break
    case "Vrms":
      rms = value
      break
    case "dBu":
      rms = 0.775 * 10 ** (value / 20)
      break
    case "dBV":
      rms = 10 ** (value / 20)
      break
  }

  if (!Number.isFinite(rms * 2 * Math.SQRT2)) return null
  if (rms === 0 && value !== 0) return null

  return {
    Vpp: rms * 2 * Math.SQRT2,
    Vp: rms * Math.SQRT2,
    Vrms: rms,
    dBu: 20 * (Math.log10(rms) - Math.log10(0.775)),
    dBV: 20 * Math.log10(rms),
  }
}
