import { useState, type ReactNode } from 'react';
import { Activity, ArrowDownUp, ArrowRight, Check, ChevronRight, CircuitBoard, Copy, ExternalLink, Info, Lightbulb, Menu, Radio, RotateCcw, Search, SlidersHorizontal, Waves, X, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { levels, divider, resistors, opamp, filter, fmt, type LevelUnit } from '@/lib/calculators';

const tools = [
  { id: 'levels', name: 'Signal levels', description: 'Vrms, dBu, dBV & peak voltage', icon: Waves, group: 'SIGNAL & AUDIO' },
  { id: 'gain', name: 'Op-amp gain', description: 'Inverting & non-inverting amplifiers', icon: SlidersHorizontal, group: 'SIGNAL & AUDIO' },
  { id: 'active', name: 'Active filter', description: 'First-order low-pass with gain', icon: Activity, group: 'SIGNAL & AUDIO' },
  { id: 'rc', name: 'RC filter', description: 'Passive low-pass & high-pass filters', icon: Radio, group: 'PASSIVE COMPONENTS' },
  { id: 'divider', name: 'Voltage divider', description: 'Two resistors, one output voltage', icon: ArrowDownUp, group: 'PASSIVE COMPONENTS' },
  { id: 'resistors', name: 'Resistor networks', description: 'Series & parallel resistance', icon: CircuitBoard, group: 'PASSIVE COMPONENTS' },
  { id: 'ohm', name: 'Ohm’s law', description: 'Voltage, current, resistance & power', icon: Zap, group: 'EVERYDAY ESSENTIALS' },
  { id: 'led', name: 'LED resistor', description: 'Current limiting, made simple', icon: Lightbulb, group: 'EVERYDAY ESSENTIALS' },
];
const initial: Record<string, string> = { r: '10', c: '10', f: '1000', rin: '10', rf: '100', vin: '5', r1: '10', r2: '10', voltage: '5', resistance: '1000', vf: '2', current: '10' };
const initialUnits: Record<string, string> = { r: '1000', c: '1e-9', f: '1', rin: '1000', rf: '1000', r1: '1000', r2: '1000' };
const resistanceUnits = [['1', 'Ω'], ['1000', 'kΩ'], ['1000000', 'MΩ']];
const capacitanceUnits = [['1e-12', 'pF'], ['1e-9', 'nF'], ['1e-6', 'µF']];
const levelLabels: [LevelUnit, string, string][] = [['vrms', 'RMS voltage', 'Vrms'], ['dbu', 'Audio level', 'dBu'], ['dbv', 'Voltage level', 'dBV'], ['vpp', 'Peak-to-peak voltage', 'Vpp'], ['vpeak', 'Peak voltage', 'Vp']];

export default function Workbench() {
  const [selected, setSelected] = useState('levels');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [values, setValues] = useState(initial);
  const [units, setUnits] = useState(initialUnits);
  const [mode, setMode] = useState('non-inverting');
  const [highpass, setHighpass] = useState(false);
  const [levelInput, setLevelInput] = useState({ unit: 'vrms' as LevelUnit, value: '1' });
  const [copied, setCopied] = useState(false);
  const tool = tools.find(t => t.id === selected)!;
  const Icon = tool.icon;
  const num = (key: string) => values[key]?.trim() === '' ? NaN : Number(values[key]) * Number(units[key] || 1);
  const valid = (...keys: string[]) => keys.every(k => Number.isFinite(num(k)) && num(k) > 0);
  const converted = levels(Number(levelInput.value), levelInput.unit);
  const levelValid = levelInput.value.trim() !== '' && Number.isFinite(Number(levelInput.value)) && (levelInput.unit.startsWith('db') || Number(levelInput.value) >= 0) && Object.values(converted).every(v => Number.isFinite(v) || v === -Infinity);
  const gain = opamp(num('rin'), num('rf'), mode === 'inverting');
  const response = filter(num('r'), num('c'), num('f'), selected === 'rc' && highpass, selected === 'active' ? opamp(num('rin'), num('rf'), false).gain : 1);
  const filterValid = valid('r', 'c', 'f') && (selected !== 'active' || valid('rin', 'rf'));
  let results: [string, string][] = [];
  let error = false;
  let formula = '';
  let note = '';
  if (selected === 'gain') {
    error = !valid('rin', 'rf'); results = [['Voltage gain', fmt(gain.gain, '×')], ['Gain in decibels', fmt(gain.db, 'dB')], ['Polarity', mode === 'inverting' ? 'Inverted' : 'In phase']];
    formula = mode === 'inverting' ? 'Aᵥ = −Rƒ / Rᵢₙ' : 'Aᵥ = 1 + Rƒ / Rᵢₙ'; note = 'Ideal op-amp, negative feedback. Real output swing and bandwidth are limited by your device and supply rails.';
  } else if (selected === 'rc' || selected === 'active') {
    error = !filterValid; results = [['Cutoff frequency', fmt(response.cutoff, 'Hz')], ['Gain at test frequency', fmt(response.db, 'dB')], ['Phase at test frequency', fmt(response.phase, '°')], ['Time constant', fmt(response.tau, 's')]];
    formula = 'ƒc = 1 / (2πRC)'; note = selected === 'active' ? 'RC low-pass feeding a non-inverting amplifier. Passband gain = 1 + Rƒ/Rg. Assumes adequate op-amp bandwidth and no clipping.' : 'Unloaded, first-order RC network with an ideal source. Cutoff is −3.01 dB; roll-off is 20 dB per decade.';
  } else if (selected === 'divider') {
    const d = divider(num('vin'), num('r1'), num('r2')); error = !valid('r1', 'r2') || !Number.isFinite(num('vin')); results = [['Output voltage', fmt(d.voltage, 'V')], ['Divider current', fmt(d.current, 'A')], ['Output impedance', fmt(d.impedance, 'Ω')]];
    formula = 'Vout = Vin × R₂ / (R₁ + R₂)'; note = 'Assumes no load on the output. A connected load appears in parallel with R₂ and changes the output voltage.';
  } else if (selected === 'resistors') {
    const r = resistors(num('r1'), num('r2')); error = !valid('r1', 'r2'); results = [['Series resistance', fmt(r.series, 'Ω')], ['Parallel resistance', fmt(r.parallel, 'Ω')]];
    formula = 'Rseries = R₁ + R₂ · Rparallel = R₁R₂ / (R₁ + R₂)'; note = 'Nominal, ideal resistance values. Component tolerances and temperature affect real-world results.';
  } else if (selected === 'ohm') {
    error = !valid('resistance') || !Number.isFinite(num('voltage')); const i = num('voltage') / num('resistance'); results = [['Current', fmt(i, 'A')], ['Power dissipation', fmt(i * num('voltage'), 'W')]];
    formula = 'I = V / R · P = V² / R'; note = 'For a resistive DC load. Choose a resistor power rating with appropriate headroom above the calculated dissipation.';
  } else if (selected === 'led') {
    error = !valid('vin', 'vf', 'current') || num('vin') <= num('vf'); const r = (num('vin') - num('vf')) / (num('current') / 1000); results = [['Required resistance', fmt(r, 'Ω')], ['Resistor dissipation', fmt((num('vin') - num('vf')) ** 2 / r, 'W')]];
    formula = 'R = (Vsupply − Vforward) / ILED'; note = 'Supply voltage must exceed forward voltage. Round resistance up to an available value and allow power-rating headroom.';
  }
  const selectTool = (id: string) => { setSelected(id); setMenu(false); setCopied(false); };
  const reset = () => { setValues(initial); setUnits(initialUnits); setMode('non-inverting'); setHighpass(false); setLevelInput({ unit: 'vrms', value: '1' }); setCopied(false); };
  function field(key: string, label: string, unit = 'V', options?: string[][]) {
    return <div className="field" key={key}><label htmlFor={key}>{label}</label><div className="input-wrap"><Input id={key} type="number" step="any" value={values[key]} onChange={e => setValues({ ...values, [key]: e.target.value })} />{options ? <select aria-label={`${label} unit`} value={units[key]} onChange={e => setUnits({ ...units, [key]: e.target.value })}>{options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select> : <span className="unit">{unit}</span>}</div></div>;
  }
  async function copyResults() {
    const output = selected === 'levels' ? levelLabels.map(([key, label, unit]) => `${label}: ${fmt(converted[key], unit)}`) : results.map(([label, value]) => `${label}: ${value}`);
    try { await navigator.clipboard.writeText(`${tool.name}\n${output.join('\n')}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
      <a href="https://lv-labs.com" className="brand"><span className="brand-symbol"><Activity size={21}/></span><span>lv<span className="brand-dot">.</span>labs <span className="brand-tools">/ tools</span></span></a>
      <div className="sidebar-caption">THE ELECTRONICS WORKBENCH</div>
      <div className="search"><Search size={15}/><input aria-label="Search calculators" placeholder="Find a calculator…" value={query} onChange={e => setQuery(e.target.value)}/><span>8</span></div>
      <nav aria-label="Calculators">{['SIGNAL & AUDIO', 'PASSIVE COMPONENTS', 'EVERYDAY ESSENTIALS'].map(group => {
        const entries = tools.filter(t => t.group === group && `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()));
        return entries.length ? <div className="nav-group" key={group}><div className="nav-heading">{group}</div>{entries.map(t => <button key={t.id} className={`nav-item ${selected === t.id ? 'active' : ''}`} onClick={() => selectTool(t.id)} aria-current={selected === t.id ? 'page' : undefined}><t.icon size={17}/><span>{t.name}</span>{selected === t.id && <ChevronRight size={14}/>}</button>)}</div> : null;
      })}{!tools.some(t => `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase())) && <p className="no-results">No calculators found.</p>}</nav>
      <div className="sidebar-bottom"><span className="status-dot"/> Runs in your browser<p>A little less maths.<br/>A little more making.</p><a href="https://lv-labs.com">Back to LV Labs <ExternalLink size={12}/></a></div>
    </aside>
    {menu && <button className="menu-overlay" aria-label="Close navigation" onClick={() => setMenu(false)}/>}
    <div className="main-shell">
      <header className="topbar"><div><Button className="mobile-menu" variant="ghost" size="icon" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X size={18}/> : <Menu size={18}/>}</Button><span className="breadcrumb">Workbench <ChevronRight size={13}/> <strong>{tool.name}</strong></span></div><span className="topbar-note"><span className="status-dot"/> All systems nominal</span></header>
      <main>
        <div className="eyebrow"><span/> SMALL TOOLS. USEFUL ANSWERS.</div>
        <div className="page-heading"><div><h1>Electronics workbench<span>.</span></h1><p>From a quick check to your next circuit. Make the numbers work.</p></div><span className="edition">LV—008<br/><span>DESIGN UTILITIES</span></span></div>
        <div className="tool-heading"><div className="tool-title"><span className="tool-icon"><Icon size={23}/></span><div><h2>{tool.name}</h2><p>{tool.description}</p></div></div><Button variant="outline" size="sm" onClick={reset}><RotateCcw size={13}/> Reset</Button></div>
        <div className="workspace">
          <section className="calculator-card" aria-label={`${tool.name} calculator`}>
            <div className="card-top"><h3>{selected === 'levels' ? 'One value. Every level.' : 'Circuit values'}</h3><span className="live-badge"><span/> LIVE</span></div>
            <p className="card-description">{selected === 'levels' ? 'Edit any field. The rest follow automatically.' : 'Adjust the values to see your results instantly.'}</p>
            {selected === 'levels' ? <>
              <div className="level-fields">{levelLabels.map(([key, label, unit], index) => <div className={`level-field ${levelInput.unit === key ? 'editing' : ''}`} key={key}><label htmlFor={key}><span className="field-index">0{index + 1}</span>{label}{levelInput.unit === key && <span className="input-tag">INPUT</span>}</label><div className="level-input-wrap"><input id={key} type="number" step="any" value={levelInput.unit === key ? levelInput.value : levelValid && Number.isFinite(converted[key]) ? Number(converted[key].toPrecision(7)) : ''} placeholder={levelValid && converted[key] === -Infinity ? '−∞' : '—'} onChange={e => setLevelInput({ unit: key, value: e.target.value })}/><span>{unit}</span></div></div>)}</div>
              {!levelValid && <p className="validation" role="status">Enter a finite value. Voltage amplitudes must be zero or greater.</p>}
              <div className="inline-note"><Info size={15}/><span>Peak conversions assume a sine wave.</span></div>
            </> : <>
              {selected === 'gain' && <div className="segmented" aria-label="Amplifier topology">{['non-inverting', 'inverting'].map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? 'chosen' : ''} onClick={() => setMode(m)}>{m === 'inverting' ? 'Inverting' : 'Non-inverting'}</button>)}</div>}
              {selected === 'rc' && <div className="segmented" aria-label="Filter topology">{[false, true].map(h => <button key={String(h)} aria-pressed={highpass === h} className={highpass === h ? 'chosen' : ''} onClick={() => setHighpass(h)}>{h ? 'High-pass' : 'Low-pass'}</button>)}</div>}
              <div className="fields-grid">
                {(selected === 'rc' || selected === 'active') && <>{field('r', 'Resistance · R', '', resistanceUnits)}{field('c', 'Capacitance · C', '', capacitanceUnits)}{field('f', 'Test frequency', '', [['1', 'Hz'], ['1000', 'kHz']])}</>}
                {(selected === 'gain' || selected === 'active') && <>{field('rin', selected === 'active' ? 'Gain resistor · Rg' : 'Input resistor · Rᵢₙ', '', resistanceUnits)}{field('rf', 'Feedback resistor · Rƒ', '', resistanceUnits)}</>}
                {selected === 'divider' && field('vin', 'Input voltage · Vin')}
                {(selected === 'divider' || selected === 'resistors') && <>{field('r1', 'Resistor · R₁', '', resistanceUnits)}{field('r2', 'Resistor · R₂', '', resistanceUnits)}</>}
                {selected === 'ohm' && <>{field('voltage', 'Voltage · V')}{field('resistance', 'Resistance · R', 'Ω')}</>}
                {selected === 'led' && <>{field('vin', 'Supply voltage')}{field('vf', 'LED forward voltage')}{field('current', 'LED current', 'mA')}</>}
              </div>
              {error && <p className="validation" role="status">{selected === 'led' ? 'Use positive values and a supply above the LED forward voltage.' : 'Enter finite values. Resistances, capacitance and frequency must be greater than zero.'}</p>}
              <div className="results" aria-live="polite">{results.map(([label, value], i) => <div className={i === 0 ? 'primary-result' : ''} key={label}><span>{label}</span><strong>{error ? '—' : value}</strong></div>)}</div>
            </>}
            <div className="card-footer"><span><span className="status-dot"/> Calculated locally</span><Button variant="ghost" size="sm" onClick={copyResults} disabled={selected === 'levels' ? !levelValid : error}>{copied ? <Check size={14}/> : <Copy size={14}/>}<span aria-live="polite">{copied ? 'Copied' : 'Copy results'}</span></Button></div>
          </section>
          <div className="reference-column">
            <section className="visual-card"><div className="visual-heading"><h3>{selected === 'levels' ? 'The shape of a signal' : 'Circuit at a glance'}</h3><span>{selected === 'levels' ? 'SINE WAVE' : 'IDEAL MODEL'}</span></div><Schematic kind={selected} highpass={highpass} inverting={mode === 'inverting'}/><div className="diagram-caption">{selected === 'levels' ? 'One waveform. Three ways to measure it.' : 'A quick reference for your bench.'}</div></section>
            {(selected === 'rc' || selected === 'active') && <ResponsePlot cutoff={response.cutoff} highpass={selected === 'rc' && highpass} gain={selected === 'active' ? opamp(num('rin'), num('rf'), false).gain : 1} valid={filterValid}/>}
            <section className="reference-card"><span className="section-label">{selected === 'levels' ? 'THE RELATIONSHIPS' : 'THE MATHS'}</span>{selected === 'levels' ? <div className="equations"><p>Vpp <span>=</span> Vrms × 2√2</p><p>dBu <span>=</span> 20 log₁₀(Vrms / √0.6)</p><p>dBV <span>=</span> 20 log₁₀(Vrms / 1 V)</p></div> : <div className="formula">{formula}</div>}<p className="reference-note">{selected === 'levels' ? '0 dBu = √0.6 V ≈ 0.7746 Vrms. 0 dBV = 1 Vrms. RMS-to-peak relationships depend on waveform shape.' : note}</p></section>
          </div>
        </div>
        <section className="next-tools"><div className="next-heading"><h3>A few more things for your bench</h3><span>KEEP EXPLORING</span></div><div className="next-grid">{tools.filter(t => t.id !== selected).slice(0, 3).map(t => <button key={t.id} onClick={() => selectTool(t.id)}><t.icon size={20}/><div><strong>{t.name}</strong><span>{t.description}</span></div><ArrowRight size={16}/></button>)}</div></section>
        <footer><span>Made for the bench. Built by <a href="https://lv-labs.com">LV Labs ↗</a></span><span>Ideal calculations. Real-world curiosity.</span></footer>
      </main>
    </div>
  </div>;
}

function Schematic({ kind, highpass, inverting }: { kind: string; highpass: boolean; inverting: boolean }) {
  const resistor = (x: number, y: number, vertical = false) => <g transform={`translate(${x} ${y})${vertical ? ' rotate(90)' : ''}`}><path d="M-28 0h10v-7h36V7h-36V0M18 0h10"/></g>;
  const cap = (x: number, y: number, vertical = false) => <g transform={`translate(${x} ${y})${vertical ? ' rotate(90)' : ''}`}><path d="M-24 0h20M-4-12v24M4-12v24M4 0h20"/></g>;
  const ground = (x: number, y: number) => <path d={`M${x} ${y}v10m-10 0h20m-16 5h12m-8 5h4`}/>;
  let drawing: ReactNode;
  if (kind === 'levels') drawing = <><path className="grid-line" d="M30 60h280M30 110h280M30 160h280M70 35v150M120 35v150M170 35v150M220 35v150M270 35v150"/><path className="wave-line" d="M30 110C47 110 48 55 65 55S83 110 100 110S118 165 135 165S153 110 170 110S188 55 205 55S223 110 240 110S258 165 275 165S293 110 310 110"/><path className="rms-line" d="M30 71h280"/><text x="30" y="64" className="green-label">Vrms</text><path className="measurement" d="M319 55v110m-4-110h8m-8 110h8"/><text x="293" y="102">Vpp</text><text x="14" y="115">0</text></>;
  else if (kind === 'gain') drawing = <><path d="M155 85l65 35-65 35ZM220 120h90M130 135h25M130 55v50h25M130 55h35M221 55h34v65"/>{resistor(193, 55)}<text x="183" y="38">Rƒ</text><text x="160" y="109">−</text><text x="160" y="141">+</text>{inverting ? <><path d="M30 105h42M128 105h2"/>{resistor(100, 105)}<text x="85" y="87">Rᵢₙ</text><path d="M130 135v50"/>{ground(130, 185)}</> : <><path d="M30 135h100M130 105H90v15M90 176v9"/>{resistor(90, 148, true)}<text x="54" y="152">Rᵢₙ</text>{ground(90, 185)}</>}<text x="20" y={inverting ? 87 : 118}>Vin</text><text x="275" y="104">Vout</text></>;
  else if (kind === 'rc' || kind === 'active') drawing = <><path d="M30 80h42M128 80h107M175 80v26M175 154v26"/>{highpass ? cap(100, 80) : resistor(100, 80)}{highpass ? resistor(175, 130, true) : cap(175, 130, true)}{ground(175, 180)}<circle cx="175" cy="80" r="3" fill="currentColor"/><text x="85" y="58">{highpass ? 'C' : 'R'}</text><text x="195" y="135">{highpass ? 'R' : 'C'}</text><text x="25" y="65">Vin</text>{kind === 'active' ? <><rect x="235" y="58" width="69" height="44" rx="3"/><path d="M304 80h22"/><text x="245" y="84">1+Rƒ/Rg</text><text x="231" y="130">Non-inverting</text><text x="231" y="145">gain stage</text></> : <><path d="M235 80h65"/><text x="265" y="64">Vout</text></>}</>;
  else if (kind === 'resistors') drawing = <><text x="35" y="49">SERIES</text><path d="M35 80h32M123 80h34M213 80h70"/>{resistor(95, 80)}{resistor(185, 80)}<text x="35" y="127">PARALLEL</text><path d="M35 162h32v-17h75m-75 17v23h75m56-40h50v40h-50m50-23h35"/>{resistor(170, 145)}{resistor(170, 185)}</>;
  else if (kind === 'divider') drawing = <><path d="M160 30v22M160 108v24M160 132h120M160 132v16M160 204v4"/>{resistor(160, 80, true)}{resistor(160, 176, true)}{ground(160, 208)}<text x="177" y="83">R₁</text><text x="177" y="180">R₂</text><text x="177" y="32">Vin</text><text x="251" y="118">Vout</text><circle cx="160" cy="132" r="3" fill="currentColor"/></>;
  else drawing = <><path d="M45 100h40M141 100h59M245 100h45v85H45v-85"/>{resistor(113, 100)}<text x="106" y="77">R</text>{kind === 'led' ? <><path d="M200 85l25 15-25 15ZM226 85v30M229 78l15-14m-7 0h7v7M243 89l15-14m-7 0h7v7"/><text x="199" y="142">LED</text></> : <><circle cx="222" cy="100" r="22"/><text x="216" y="105">V</text></>}<text x="61" y="174">I →</text>{ground(45, 185)}</>;
  return <svg className="schematic" viewBox="0 0 340 245" role="img" aria-label={kind === 'levels' ? 'Sine wave showing RMS and peak-to-peak voltage' : `${kind} circuit diagram${kind === 'active' ? ', simplified gain stage' : ''}`}><g stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{drawing}</g></svg>;
}
function ResponsePlot({ cutoff, highpass, gain, valid }: { cutoff: number; highpass: boolean; gain: number; valid: boolean }) {
  const points = Array.from({ length: 101 }, (_, i) => { const ratio = 10 ** (-2 + i * .04); const db = 20 * Math.log10((highpass ? ratio : 1) / Math.hypot(1, ratio)); return `${36 + i * 2.65},${29 - db * 2.1}`; }).join(' ');
  return <section className="response-card"><div className="visual-heading"><h3>Frequency response</h3><span>MAGNITUDE</span></div>{valid ? <><svg viewBox="0 0 340 155" role="img" aria-label="Filter magnitude response relative to passband"><g className="plot-grid"><path d="M36 29h265M36 71h265M36 113h265M36 20v100M168 20v100M301 20v100"/></g><g className="plot-labels"><text x="4" y="32">0 dB</text><text x="0" y="74">−20</text><text x="0" y="116">−40</text><text x="29" y="140">0.01ƒc</text><text x="160" y="140">ƒc</text><text x="275" y="140">100ƒc</text></g><polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2"/><circle cx="168.5" cy="35.32" r="3.5" fill="var(--primary)"/></svg><div className="response-caption">ƒc {fmt(cutoff, 'Hz')} <span>Passband {fmt(20 * Math.log10(gain), 'dB')}</span></div></> : <p className="reference-note">Enter valid circuit values to view the response.</p>}</section>;
}
