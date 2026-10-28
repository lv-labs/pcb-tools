import { useId, useState } from "react"
import { Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { convertSignal } from "@/lib/signal-conversion"

function voltage(value: number) {
  return `${Number(value.toPrecision(5))} V`
}

// Three periods: two visible, one extra for a seamless scrolling trace.
const sinePath = Array.from({ length: 601 }, (_, i) => {
  const x = i * 1.05
  return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${(-90 * Math.sin((x / 210) * 2 * Math.PI)).toFixed(2)}`
}).join(" ")

export function SignalWaveform({
  values,
}: {
  values: ReturnType<typeof convertSignal>
}) {
  const id = useId()
  const [paused, setPaused] = useState(false)
  const hasSignal = values !== null && values.Vp > 0
  const rmsY = 160 - 90 / Math.SQRT2

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oscilloscope</CardTitle>

        <CardAction>
          <Button
            variant="outline"
            aria-label={
              paused ? "Resume waveform animation" : "Pause waveform animation"
            }
            aria-pressed={paused}
            disabled={!hasSignal}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border bg-muted/20">
          <svg
            viewBox="0 0 720 320"
            className="mx-auto block w-full max-w-4xl min-w-[540px]"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
          >
            <title id={`${id}-title`}>Signal voltage waveform</title>
            <desc id={`${id}-description`}>
              {values
                ? `Sine wave: ${voltage(values.Vpp)} peak to peak, ${voltage(values.Vp)} peak, ${voltage(values.Vrms)} RMS. Amplitude is auto-scaled. Motion is illustrative, not a measured frequency.`
                : "Enter a valid signal level to display the waveform."}
            </desc>
            <defs>
              <pattern
                id={`${id}-grid`}
                x="100"
                y="40"
                width="35"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M35 0H0V30"
                  fill="none"
                  className="stroke-border"
                  strokeWidth="1"
                />
              </pattern>
              <clipPath id={`${id}-clip`}>
                <rect x="100" y="40" width="420" height="240" />
              </clipPath>
            </defs>
            <rect
              x="100"
              y="40"
              width="420"
              height="240"
              fill={`url(#${id}-grid)`}
              className="stroke-border"
            />
            <g
              className="text-muted-foreground"
              fill="currentColor"
              fontSize="12"
            >
              <text x="100" y="25">
                VOLTAGE
              </text>
              {/* <text x="520" y="303" textAnchor="end">
                TIME →
              </text> */}
              <text x="88" y="164" textAnchor="end">
                0 V
              </text>
            </g>
            <path
              d="M100 160H520"
              className="stroke-muted-foreground/50"
              strokeWidth="1"
            />
            {hasSignal && (
              <>
                <g
                  fill="none"
                  className="stroke-muted-foreground/60"
                  strokeDasharray="4 5"
                >
                  <path d="M100 70H520 M100 250H520" />
                </g>
                <g
                  fill="currentColor"
                  className="text-muted-foreground"
                  fontSize="12"
                  textAnchor="end"
                >
                  <text x="88" y="58">
                    +Vp
                  </text>
                  <text x="88" y="75">
                    {voltage(values.Vp)}
                  </text>
                  <text x="88" y="272">
                    −Vp
                  </text>
                  <text x="88" y="255">
                    −{voltage(values.Vp)}
                  </text>
                </g>
                <g
                  className="text-amber-600 dark:text-amber-400"
                  fill="currentColor"
                  fontSize="12"
                >
                  <path
                    d={`M100 ${rmsY}H520`}
                    stroke="currentColor"
                    strokeDasharray="7 5"
                    fill="none"
                  />
                  <text x="110" y={rmsY + 18}>
                    RMS {voltage(values.Vrms)}
                  </text>
                </g>
                <g
                  className="text-sky-600 dark:text-sky-400"
                  fill="currentColor"
                  fontSize="13"
                >
                  <path
                    d="M535 70H551 M543 70V250 M535 250H551"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                  />
                  <text x="563" y="153">
                    Vpp
                  </text>
                  <text x="563" y="174">
                    {voltage(values.Vpp)}
                  </text>
                </g>
              </>
            )}
            <g clipPath={`url(#${id}-clip)`}>
              {values && (
                <g transform="translate(100 160)">
                  <g
                    className={hasSignal ? "signal-waveform-trace" : undefined}
                    style={{
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  >
                    <path
                      d={hasSignal ? sinePath : "M0 0H420"}
                      fill="none"
                      className="stroke-sky-600 dark:stroke-sky-400"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              )}
            </g>
            {!hasSignal && (
              <text
                x="310"
                y="125"
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="13"
              >
                {values ? "0 V · No signal" : "Enter a valid signal level"}
              </text>
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
