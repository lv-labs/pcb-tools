import { useState } from "react"

import { SignalWaveform } from "@/components/signal-waveform"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { convertSignal, type SignalUnit } from "@/lib/signal-conversion"
import { Separator } from "@/components/ui/separator"

const units: SignalUnit[] = ["Vrms", "Vpp", "Vp", "dBu", "dBV"]
const descriptions: Record<SignalUnit, string> = {
  Vrms: "RMS Voltage",
  Vpp: "Peak-to-Peak Voltage",
  Vp: "Peak Voltage",
  dBu: "Decibels relative to 0.775 Vrms",
  dBV: "Decibels relative to 1 Vrms",
}

export default function SignalConversion() {
  const [source, setSource] = useState<SignalUnit>("Vrms")
  const [input, setInput] = useState("1")
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
    <FieldGroup className="mx-auto max-w-4xl">
      <Field>
        <h2 className="text-xl font-semibold">Signal Conversion</h2>
        <FieldDescription>
          Convert common audio levels.
        </FieldDescription>
      </Field>
      <Card>
        <CardContent>
          {units.map((unit) => (
            <Field key={unit}>
              <FieldLabel className="" htmlFor={`signal-${unit}`}>
                {descriptions[unit]}
              </FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  className="text-lg md:text-lg"
                  id={`signal-${unit}`}
                  type="text"
                  inputMode="decimal"
                  value={displayedValue(unit)}
                  aria-invalid={
                    unit === source && input.trim() !== "" && !values
                  }
                  onChange={(event) => {
                    setSource(unit)
                    setInput(event.target.value)
                  }}
                  placeholder={`Enter ${descriptions[unit]}`}
                />
                <InputGroupAddon align="inline-end" className="w-16">
                  <Separator orientation="vertical" className="mx-2" />
                  {unit}
                </InputGroupAddon>
              </InputGroup>
            </Field>
          ))}
        </CardContent>
      </Card>

      <SignalWaveform values={values} />
    </FieldGroup>
  )
}
