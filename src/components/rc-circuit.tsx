import { useId } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatResistance } from "@/lib/opamp-gain"
import { formatCapacitance } from "@/lib/passive-rc-filters"

export function RcCircuit({
  highPass,
  resistance,
  capacitance,
}: {
  highPass: boolean
  resistance: number | null
  capacitance: number | null
}) {
  const id = useId()
  const r = resistance === null ? "—" : formatResistance(resistance)
  const c = capacitance === null ? "—" : formatCapacitance(capacitance)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit</CardTitle>
        <CardDescription>
          {highPass
            ? "Passes frequencies above cutoff; attenuates lower frequencies."
            : "Passes frequencies below cutoff; attenuates higher frequencies."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox="0 0 640 250"
          className="mx-auto block w-full max-w-2xl text-foreground"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>
            {highPass ? "High-pass" : "Low-pass"} RC circuit
          </title>
          <desc id={`${id}-desc`}>
            {highPass
              ? "Vin connects through C to Vout. R connects Vout to ground."
              : "Vin connects through R to Vout. C connects Vout to ground."}{" "}
            R: {r}. C: {c}.
          </desc>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 70 85 H 200 M 280 85 H 560 M 390 85 V 130 M 390 180 V 215 M 375 215 H 405 M 380 222 H 400 M 386 229 H 394" />
            {highPass ? (
              <>
                <path d="M 200 85 H 234 M 234 63 V 107 M 246 63 V 107 M 246 85 H 280" />
                <rect x="380" y="130" width="20" height="50" />
              </>
            ) : (
              <>
                <rect x="200" y="75" width="80" height="20" />
                <path d="M 390 130 V 149 M 368 149 H 412 M 368 161 H 412 M 390 161 V 180" />
              </>
            )}
            <circle cx="390" cy="85" r="4" fill="currentColor" />
            <circle cx="70" cy="85" r="4" className="fill-card" />
            <circle cx="560" cy="85" r="4" className="fill-card" />
          </g>
          <g
            fill="currentColor"
            textAnchor="middle"
            fontSize="15"
            className="font-mono"
          >
            <text x="70" y="62">
              Vin
            </text>
            <text x="560" y="62">
              Vout
            </text>
            <text x="240" y="45">
              {highPass ? "C" : "R"}
            </text>
            <text x="240" y="132">
              {highPass ? c : r}
            </text>
            <text x="460" y="151">
              {highPass ? "R" : "C"}
            </text>
            <text x="460" y="176">
              {highPass ? r : c}
            </text>
          </g>
        </svg>
        <CardDescription>
          Ideal source and unloaded output. Both configurations use the same
          cutoff equation.
        </CardDescription>
      </CardContent>
    </Card>
  )
}
