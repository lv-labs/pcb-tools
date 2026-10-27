import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { convertSignal, type SignalUnit } from "@/lib/signal-conversion"

const units: SignalUnit[] = ["Vpp", "Vp", "Vrms", "dBu", "dBV"]

export default function SignalConversion() {
  const [source, setSource] = useState<SignalUnit>("Vpp")
  const [input, setInput] = useState("")
  const values =
    input.trim() === "" ? null : convertSignal(source, Number(input))

  function displayedValue(unit: SignalUnit) {
    // Keep the edited field untouched so decimals and negative dB are easy to type.
    if (unit === source) return input
    if (!values) return ""
    if (values[unit] === -Infinity) return "−∞"
    return String(Number(values[unit].toPrecision(7)))
  }

  return (
    <><div>
      <div className="flex flex-row gap-4">
        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle>Signal Conversion</CardTitle>
            <CardDescription>
              Convert between Vpp, Vp, Vrms, dBu, and dBV.
            </CardDescription>
          </CardHeader>
          <CardContent>

            {units.map((unit) => (
              <div key={unit}>
                <Input
                  className="w-32 mr-2"
                  id={`signal-${unit}`}
                  type="text"
                  inputMode="decimal"
                  value={displayedValue(unit)}
                  aria-invalid={unit === source && input.trim() !== "" && !values}
                  onChange={(event) => {
                    setSource(unit)
                    setInput(event.target.value)
                  }}
                />

                <label htmlFor={`signal-${unit}`}>{unit}</label>
              </div>
            ))}
          </CardContent>
        </Card >

        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle></CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent>


          </CardContent>
        </Card>
      </div >
    </div >
    </>
  )
}
