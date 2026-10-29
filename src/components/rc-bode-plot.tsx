import { useEffect, useId, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatFrequency, rcResponse } from "@/lib/passive-rc-filters"

const left = 72
const right = 652
const width = right - left
const phaseY = (degrees: number, highPass: boolean) =>
  267 + ((highPass ? 90 - degrees : -degrees) / 90) * 120

export function RcBodePlot({
  cutoff: inputCutoff,
  highPass,
}: {
  cutoff: number | null
  highPass: boolean
}) {
  const id = useId()
  const [cursor, setCursor] = useState<number | null>(null)
  const [cutoff, setCutoff] = useState(inputCutoff)
  useEffect(() => {
    // Keep the last plot while typing, then redraw once the input settles.
    const timeout = window.setTimeout(() => setCutoff(inputCutoff), 400)
    return () => window.clearTimeout(timeout)
  }, [inputCutoff])
  const valid = cutoff !== null && Number.isFinite(cutoff) && cutoff > 0
  const maxDecade = Math.max(2, Math.log10(40000 / (valid ? cutoff : 1)))
  const span = maxDecade + 2
  const x = (decade: number) => left + ((decade + 2) / span) * width
  const decades = Array.from(
    { length: 5 },
    (_, index) => -2 + (index / 4) * span
  )
  const minorDecades = Array.from(
    { length: Math.ceil(span) },
    (_, index) => index - 2
  )
    .flatMap((decade) =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (multiplier) => decade + Math.log10(multiplier)
      )
    )
    .filter((decade) => decade <= maxDecade)
  const magnitudeFloor = Math.min(
    -45,
    Math.floor(rcResponse(10 ** maxDecade, highPass)!.magnitude / 10) * 10
  )
  const magnitudeY = (db: number) => 48 + (db / magnitudeFloor) * 155
  const magnitudeStep = Math.ceil(-magnitudeFloor / 50) * 10
  const magnitudeTicks = Array.from(
    { length: Math.floor(-magnitudeFloor / magnitudeStep) + 1 },
    (_, index) => -index * magnitudeStep
  )
  const cursorDecade = cursor === null ? null : -2 + cursor * span
  const cursorResponse =
    cursorDecade === null ? null : rcResponse(10 ** cursorDecade, highPass)
  const points = Array.from({ length: 241 }, (_, index) => {
    const decade = -2 + (index / 240) * span
    return { x: x(decade), ...rcResponse(10 ** decade, highPass)! }
  })
  const path = (phase: boolean) =>
    points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${point.x.toFixed(2)} ${(phase ? phaseY(point.phase, highPass) : magnitudeY(point.magnitude)).toFixed(2)}`
      )
      .join(" ")
  const phaseTicks = highPass ? [90, 45, 0] : [0, -45, -90]
  const cutoffPhase = highPass ? 45 : -45
  function frequencyLabel(decade: number) {
    const frequency = cutoff! * 10 ** decade
    return Number.isFinite(frequency) && frequency > 0
      ? formatFrequency(Number(frequency.toPrecision(3)))
      : `${10 ** decade} × fc`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bode plot</CardTitle>
        <CardDescription>
          Magnitude and phase from the current R and C values. Logarithmic
          frequency axis, from 0.01× cutoff to at least 40 kHz (or 100× cutoff,
          whichever is higher). Hover over either graph to inspect the response.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {valid ? (
          <>
            <div className="overflow-x-auto rounded-lg border bg-muted/20">
              <svg
                key={`${cutoff}-${highPass}`}
                viewBox="0 0 724 456"
                className="mx-auto block w-full min-w-[540px]"
                role="img"
                aria-labelledby={`${id}-title ${id}-description`}
              >
                <title id={`${id}-title`}>
                  {highPass ? "High-pass" : "Low-pass"} filter Bode plot
                </title>
                <desc id={`${id}-description`}>
                  Actual cutoff {formatFrequency(cutoff)}. Magnitude is −3.01 dB
                  and phase is {cutoffPhase} degrees at cutoff.
                  {highPass
                    ? "Magnitude rises at 20 dB per decade toward 0 dB. Phase falls from +90 to 0 degrees."
                    : "Magnitude falls from 0 dB at 20 dB per decade. Phase falls from 0 to −90 degrees."}
                </desc>
                <g fill="none" className="stroke-border" strokeWidth="1">
                  {minorDecades.map((decade) => (
                    <path
                      key={decade}
                      d={`M${x(decade)} 48V203 M${x(decade)} 267V387`}
                      opacity="0.4"
                    />
                  ))}
                  {decades.map((decade) => (
                    <path
                      key={decade}
                      d={`M${x(decade)} 48V203 M${x(decade)} 267V387`}
                    />
                  ))}
                  {magnitudeTicks.map((db) => (
                    <path key={db} d={`M${left} ${magnitudeY(db)}H${right}`} />
                  ))}
                  {phaseTicks.map((phase) => (
                    <path
                      key={phase}
                      d={`M${left} ${phaseY(phase, highPass)}H${right}`}
                    />
                  ))}
                </g>
                <g
                  fill="currentColor"
                  className="text-muted-foreground"
                  fontSize="12"
                >
                  <text x={left} y="26">
                    MAGNITUDE · dB
                  </text>
                  <text x={left} y="245">
                    PHASE · °
                  </text>
                  {magnitudeTicks.map((db) => (
                    <text
                      key={db}
                      x={left - 12}
                      y={magnitudeY(db) + 4}
                      textAnchor="end"
                    >
                      {db}
                    </text>
                  ))}
                  {phaseTicks.map((phase) => (
                    <text
                      key={phase}
                      x={left - 12}
                      y={phaseY(phase, highPass) + 4}
                      textAnchor="end"
                    >
                      {phase > 0 ? "+" : ""}
                      {phase}°
                    </text>
                  ))}
                  {decades.map((decade) => (
                    <text
                      key={decade}
                      x={x(decade)}
                      y="410"
                      textAnchor="middle"
                    >
                      {frequencyLabel(decade)}
                    </text>
                  ))}
                  <text x={(left + right) / 2} y="438" textAnchor="middle">
                    FREQUENCY · logarithmic scale
                  </text>
                </g>
                <g
                  fill="none"
                  className="stroke-muted-foreground/70"
                  strokeDasharray="4 5"
                >
                  <path d={`M${x(0)} 48V203 M${x(0)} 267V387`} />
                  <path
                    d={`M${left} ${magnitudeY(-10 * Math.log10(2))}H${right}`}
                  />
                </g>
                <path
                  d={path(false)}
                  pathLength={1}
                  fill="none"
                  className="rc-bode-trace stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d={path(true)}
                  pathLength={1}
                  fill="none"
                  className="rc-bode-trace stroke-amber-600 dark:stroke-amber-400"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx={x(0)}
                  cy={magnitudeY(-10 * Math.log10(2))}
                  r="4"
                  className="rc-bode-marker fill-sky-600 dark:fill-sky-400"
                />
                <circle
                  cx={x(0)}
                  cy={phaseY(cutoffPhase, highPass)}
                  r="4"
                  className="rc-bode-marker fill-amber-600 dark:fill-amber-400"
                />
                {cursorDecade !== null && cursorResponse && (
                  <g pointerEvents="none">
                    <path
                      d={`M${x(cursorDecade)} 48V203 M${x(cursorDecade)} 267V387`}
                      className="stroke-foreground/50"
                      strokeDasharray="3 4"
                    />
                    <circle
                      cx={x(cursorDecade)}
                      cy={magnitudeY(cursorResponse.magnitude)}
                      r="5"
                      className="fill-sky-600 stroke-background dark:fill-sky-400"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x(cursorDecade)}
                      cy={phaseY(cursorResponse.phase, highPass)}
                      r="5"
                      className="fill-amber-600 stroke-background dark:fill-amber-400"
                      strokeWidth="2"
                    />
                    <text
                      x={right}
                      y="245"
                      textAnchor="end"
                      className="fill-foreground"
                      fontSize="12"
                    >
                      {frequencyLabel(cursorDecade)} ·{" "}
                      {cursorResponse.magnitude.toFixed(2)} dB ·{" "}
                      {cursorResponse.phase.toFixed(1)}°
                    </text>
                  </g>
                )}
                {[
                  { top: 48, height: 155 },
                  { top: 267, height: 120 },
                ].map(({ top, height }) => (
                  <rect
                    key={top}
                    x={left}
                    y={top}
                    width={width}
                    height={height}
                    fill="transparent"
                    className="cursor-crosshair"
                    onPointerMove={(event) => {
                      const bounds = event.currentTarget.getBoundingClientRect()
                      setCursor(
                        Math.max(
                          0,
                          Math.min(
                            1,
                            (event.clientX - bounds.left) / bounds.width
                          )
                        )
                      )
                    }}
                    onPointerLeave={() => setCursor(null)}
                    onPointerCancel={() => setCursor(null)}
                  />
                ))}
                <text
                  x={right}
                  y="26"
                  textAnchor="end"
                  className="fill-foreground"
                  fontSize="12"
                >
                  fc = {formatFrequency(Number(cutoff.toPrecision(5)))}
                </text>
              </svg>
            </div>
            <CardDescription className="mt-4">
              At cutoff: −3.01 dB · {highPass ? "+45°" : "−45°"}. Ideal source
              and unloaded output; component tolerances are not included.
            </CardDescription>
          </>
        ) : (
          <CardDescription className="py-12 text-center">
            Enter valid R and C values to draw the frequency response.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
