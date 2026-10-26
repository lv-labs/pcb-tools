export const DBU_REFERENCE = Math.sqrt(0.6);
export type LevelUnit = 'vrms' | 'vpp' | 'vpeak' | 'dbu' | 'dbv';
export function levels(value: number, unit: LevelUnit) {
  const rms = unit === 'dbu' ? DBU_REFERENCE * 10 ** (value / 20) : unit === 'dbv' ? 10 ** (value / 20) : unit === 'vpp' ? value / (2 * Math.SQRT2) : unit === 'vpeak' ? value / Math.SQRT2 : value;
  return { vrms: rms, vpp: rms * 2 * Math.SQRT2, vpeak: rms * Math.SQRT2, dbu: 20 * Math.log10(rms / DBU_REFERENCE), dbv: 20 * Math.log10(rms) };
}
export const divider = (vin: number, r1: number, r2: number) => ({ voltage: vin * r2 / (r1 + r2), current: vin / (r1 + r2), impedance: r1 * r2 / (r1 + r2) });
export const resistors = (r1: number, r2: number) => ({ series: r1 + r2, parallel: r1 * r2 / (r1 + r2) });
export const opamp = (rin: number, rf: number, inverting: boolean) => { const gain = inverting ? -rf / rin : 1 + rf / rin; return { gain, db: 20 * Math.log10(Math.abs(gain)) }; };
export function filter(r: number, c: number, frequency: number, highpass: boolean, gain = 1) {
  const cutoff = 1 / (2 * Math.PI * r * c), ratio = frequency / cutoff;
  const magnitude = gain * (highpass ? ratio : 1) / Math.hypot(1, ratio);
  return { cutoff, tau: r * c, magnitude, db: 20 * Math.log10(magnitude), phase: (highpass ? Math.PI / 2 - Math.atan(ratio) : -Math.atan(ratio)) * 180 / Math.PI };
}
export function fmt(value: number, unit = '') {
  if (Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return `${value < 0 ? '−' : ''}∞${unit ? ' ' + unit : ''}`;
  if (unit === 'dB' || unit === 'dBu' || unit === 'dBV' || unit === '°' || unit === '×') return `${Number(value.toPrecision(5))} ${unit}`;
  const prefixes: [number, string][] = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  const [scale, prefix] = prefixes.find(([scale]) => Math.abs(value) >= scale) || [1e-12, 'p'];
  return `${Number((value === 0 ? 0 : value / scale).toPrecision(5))}${unit ? ' ' + (value === 0 ? '' : prefix) + unit : ''}`;
}
