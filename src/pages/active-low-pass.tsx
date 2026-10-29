import { useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { OpampCircuit } from "@/components/opamp-circuit"
import { RcBodePlot } from "@/components/rc-bode-plot"
import {
  defaultUnits,
  groupFrequencyInput,
  parseEngineeringInput,
} from "@/lib/engineering-input"
import { formatNumber, positiveNumber } from "@/lib/opamp-gain"
import { solveRc } from "@/lib/passive-rc-filters"

const fields = ["rin", "rf", "c", "f"] as const
const labels = {
  rin: "Input resistor · Rin",
  rf: "Feedback resistor · Rf",
  c: "Feedback capacitor · Cf",
  f: "Cutoff frequency · fc",
}

export default function ActiveLowPass() {
  const [inputs, setInputs] = useState({ rin: "10", rf: "100", c: "1", f: "" })
  const [units, setUnits] = useState({
    rin: { unit: "kΩ", scale: 1000 },
    rf: { unit: "kΩ", scale: 1000 },
    c: defaultUnits.c,
    f: { unit: "Hz", scale: 1 },
  })
  const [solving, setSolving] = useState<"c" | "f">("f")
  const replacing = useRef(false)
  function value(field: (typeof fields)[number]) {
    const parsed = positiveNumber(inputs[field].replaceAll(",", ""))
    const scaled = parsed === null ? null : parsed * units[field].scale
    return scaled !== null && Number.isFinite(scaled) && scaled > 0
      ? scaled
      : null
  }
  const rin = value("rin")
  const rf = value("rf")
  const c = solving === "c" ? solveRc(rf, value("f")) : value("c")
  const f = solving === "f" ? solveRc(rf, c) : value("f")
  const values = { rin, rf, c, f }
  const rawGain = rin !== null && rf !== null ? rf / rin : null
  const gain =
    rawGain !== null && Number.isFinite(rawGain) && rawGain > 0 ? rawGain : null
  const gainDb = gain === null ? NaN : 20 * Math.log10(gain)
  const displayed = {
    ...inputs,
    [solving]:
      values[solving] === null
        ? ""
        : formatNumber(values[solving]! / units[solving].scale),
  }
  displayed.f = groupFrequencyInput(displayed.f)

  return (
    <FieldGroup className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Inverting active low-pass filter</CardTitle>
          <CardDescription>
            A capacitor in parallel with the feedback resistor creates a
            first-order low-pass filter. Enter Rin and Rf, then edit either Cf
            or the target cutoff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const calculated = field === solving
                const invalid = !calculated && values[field] === null
                const id = `active-low-pass-${field}`
                return (
                  <Field key={field} data-invalid={invalid}>
                    <FieldLabel htmlFor={id}>{labels[field]}</FieldLabel>
                    <InputGroup
                      className="h-12 cursor-text"
                      onClick={(event) => {
                        if (!(event.target as HTMLElement).closest("input"))
                          event.currentTarget.querySelector("input")?.focus()
                      }}
                    >
                      <InputGroupInput
                        id={id}
                        className="flex-initial font-mono text-lg md:text-lg"
                        style={{
                          width: `calc(${Math.max(1, (displayed[field] || "Calculated").length)}ch + 0.875rem)`,
                          maxWidth: "calc(100% - 4rem)",
                        }}
                        inputMode={field === "f" ? "decimal" : "text"}
                        value={displayed[field]}
                        placeholder={
                          calculated ? "Calculated" : "Enter a value"
                        }
                        aria-invalid={invalid}
                        aria-describedby={`${id}-unit ${id}-help${invalid ? ` ${id}-error` : ""}`}
                        onBeforeInput={(event) => {
                          const input = event.currentTarget
                          replacing.current =
                            input.selectionStart === 0 &&
                            input.selectionEnd === input.value.length
                        }}
                        onPaste={(event) => {
                          const input = event.currentTarget
                          replacing.current =
                            input.selectionStart === 0 &&
                            input.selectionEnd === input.value.length
                        }}
                        onChange={(event) => {
                          const input = event.currentTarget
                          if (field === "f") {
                            const raw = input.value
                            const formatted = groupFrequencyInput(raw)
                            const before = raw
                              .slice(0, input.selectionStart ?? raw.length)
                              .replaceAll(",", "").length
                            setInputs({ ...displayed, f: formatted })
                            let caret = 0,
                              count = 0
                            while (caret < formatted.length && count < before) {
                              if (formatted[caret] !== ",") count++
                              caret++
                            }
                            requestAnimationFrame(() => {
                              if (document.activeElement === input)
                                input.setSelectionRange(caret, caret)
                            })
                            setSolving("c")
                          } else {
                            const parsed = parseEngineeringInput(
                              input.value,
                              field === "c" ? "c" : "r",
                              units[field],
                              replacing.current
                            )
                            setInputs({ ...displayed, [field]: parsed.text })
                            setUnits({
                              ...units,
                              [field]: {
                                unit: parsed.unit,
                                scale: parsed.scale,
                              },
                            })
                            if (field === "c") setSolving("f")
                          }
                          replacing.current = false
                        }}
                      />
                      <InputGroupAddon
                        id={`${id}-unit`}
                        align="inline-end"
                        className="shrink-0 text-lg text-foreground"
                        aria-live="polite"
                      >
                        {units[field].unit}
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription id={`${id}-help`}>
                      {field === "rin" || field === "rf"
                        ? "New entry: ohms. Suffixes: 10k, 100k, 1M."
                        : calculated
                          ? "Calculated. Edit to solve the other value."
                          : field === "c"
                            ? "New entry: nF. Suffixes: 100p, 1n, 1u."
                            : "Target cutoff held while you change resistors."}
                    </FieldDescription>
                    {invalid && (
                      <FieldError id={`${id}-error`}>
                        Enter a finite value greater than zero.
                      </FieldError>
                    )}
                  </Field>
                )
              })}
            </FieldGroup>
            <Field>
              <FieldLabel>Low-frequency gain</FieldLabel>
              <p className="font-mono text-xl" aria-live="polite">
                {gain === null
                  ? "—"
                  : `−${formatNumber(gain)} V/V · ${formatNumber(gainDb)} dB`}
              </p>
              <FieldDescription>
                A = −Rf / Rin · fc = 1 / (2πRfCf). At cutoff, gain is 3.01 dB
                below the low-frequency value; roll-off is 20 dB per decade.
              </FieldDescription>
              {(values[solving] === null || gain === null) && (
                <FieldError>
                  Enter valid component values within the calculator’s numeric
                  range to show the complete response.
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <OpampCircuit
        topology="inverting"
        r1={rin}
        rf={rf}
        cf={c}
        locked={null}
      />
      <RcBodePlot
        cutoff={c === null ? null : f}
        highPass={false}
        gainDb={gainDb}
        inverting
      />
    </FieldGroup>
  )
}
