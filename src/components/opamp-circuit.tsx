import { useId } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatResistance,
  type Resistor,
  type Topology,
} from "@/lib/opamp-gain"

import { formatCapacitance } from "@/lib/passive-rc-filters"

type OpampCircuitProps = {
  cf?: number | null
  topology: Topology
  r1: number | null
  rf: number | null
  locked: Resistor | null
  matchedPair?: boolean
}

function Ground({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M ${x - 12} ${y} h 24 M ${x - 8} ${y + 6} h 16 M ${x - 3} ${y + 12} h 6`}
    />
  )
}

export function OpampCircuit({
  topology,
  r1,
  rf,
  locked,
  matchedPair = false,
  cf,
}: OpampCircuitProps) {
  const id = useId()
  const inverting = topology === "inverting"
  const inputLabel = inverting ? "Rᵢₙ" : "Rg"
  const valueLabel = (value: number | null) =>
    value !== null && Number.isFinite(value) ? formatResistance(value) : "—"
  const status = (resistor: Resistor) =>
    locked === resistor
      ? "Locked"
      : matchedPair
        ? "Best match"
        : locked
          ? "Calculated"
          : ""
  const resistorStyle = (resistor: Resistor) =>
    matchedPair || (locked && locked !== resistor)
      ? "text-sky-600 dark:text-sky-400"
      : "text-foreground"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit</CardTitle>
        <CardDescription>
          Live component values · {inverting ? "Inverting" : "Non-inverting"}{" "}
          configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={cf !== undefined ? "0 -70 640 370" : "0 0 640 300"}
          className="mx-auto block w-full max-w-2xl text-foreground"
          role="img"
          aria-labelledby={`${id}-title ${id}-description`}
        >
          <title id={`${id}-title`}>
            {inverting ? "Inverting" : "Non-inverting"} op-amp circuit
          </title>
          <desc id={`${id}-description`}>
            {inverting
              ? "Vin connects through the input resistor to the inverting input. The non-inverting input is grounded."
              : "Vin connects directly to the non-inverting input. The inverting input connects through Rg to ground."}
            {` Feedback resistor Rf connects Vout to the inverting input. ${inputLabel}: ${valueLabel(r1)} ${status("r1")}. Rf: ${valueLabel(rf)} ${status("rf")}. Supply pins omitted.`}
            {cf !== undefined &&
              ` Capacitor Cf (${cf === null ? "unknown" : formatCapacitance(cf)}) is connected in parallel with Rf.`}
          </desc>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {cf !== undefined && (
              <>
                <path d="M250 65 V-20 H360 M380 -20 H500 V65 M360 -34 V-6 M380 -34 V-6" />
                <circle cx="250" cy="65" r="4" fill="currentColor" />
                <circle cx="500" cy="65" r="4" fill="currentColor" />
              </>
            )}
            {/* The feedback always returns to the negative input. */}
            <path d="M 300 115 L 430 185 L 300 255 Z M 190 150 H 300 M 250 150 V 65 H 335 M 405 65 H 500 V 185 M 430 185 H 570" />
            <path d="M 70 150 H 120" />
            {inverting ? (
              <>
                <path d="M 300 220 H 270 V 270" />
                <Ground x={270} y={270} />
              </>
            ) : (
              <>
                <path d="M 70 150 V 180 M 70 220 H 300" />
                <Ground x={70} y={180} />
              </>
            )}
            <g className={resistorStyle("r1")}>
              <rect x="120" y="140" width="70" height="20" />
            </g>
            <g className={resistorStyle("rf")}>
              <rect x="335" y="55" width="70" height="20" />
            </g>
            <g fill="currentColor" stroke="none">
              <circle cx="250" cy="150" r="4" />
              <circle cx="500" cy="185" r="4" />
            </g>
            <circle
              cx="70"
              cy={inverting ? 150 : 220}
              r="4"
              className="fill-card"
            />
            <circle cx="570" cy="185" r="4" className="fill-card" />
          </g>
          <g
            fill="currentColor"
            textAnchor="middle"
            fontSize="15"
            className="font-mono"
          >
            {cf !== undefined && (
              <text x="370" y="-45">
                Cf · {cf === null ? "—" : formatCapacitance(cf)}
              </text>
            )}
            <text x="316" y="155" fontSize="20">
              −
            </text>
            <text x="316" y="226" fontSize="20">
              +
            </text>
            <text
              x="362"
              y="191"
              className="fill-muted-foreground"
              fontSize="12"
            >
              Op-amp
            </text>
            <text x="44" y={inverting ? 155 : 225}>
              Vin
            </text>
            <text x="600" y="190">
              Vout
            </text>
            <g className={resistorStyle("r1")}>
              <text x="155" y="123">
                {inputLabel}
              </text>
              <text x="155" y="183">
                {valueLabel(r1)}
              </text>
              <text x="155" y="201" fontSize="11">
                {status("r1")}
              </text>
            </g>
            <g className={resistorStyle("rf")}>
              <text x="370" y="38">
                Rf
              </text>
              <text x="370" y="96">
                {valueLabel(rf)}
              </text>
              <text x="370" y="113" fontSize="11">
                {status("rf")}
              </text>
            </g>
          </g>
        </svg>
        <CardDescription>
          Signal ground shown. Power supply connections omitted for clarity.
        </CardDescription>
      </CardContent>
    </Card>
  )
}
