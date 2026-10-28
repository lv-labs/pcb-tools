import { useMemo, useRef, useState } from "react"
import { LockKeyhole, LockKeyholeOpen } from "lucide-react"
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  formatNumber,
  formatResistance,
  positiveNumber,
} from "@/lib/opamp-gain"
import {
  formatCapacitance,
  formatFrequency,
  nextRcSolve,
  rcMatches,
  solveRc,
  type CapacitorSeries,
  type MatchMode,
  type RcField,
  type RcValues,
  type ResistorSeries,
} from "@/lib/passive-rc-filters"
import {
  defaultUnits,
  groupFrequencyInput,
  parseEngineeringInput,
} from "@/lib/engineering-input"
import { RcCircuit } from "@/components/rc-circuit"
import { RcBodePlot } from "@/components/rc-bode-plot"

const fields = ["r", "c", "f"] as const
const labels = {
  r: "Resistance · R",
  c: "Capacitance · C",
  f: "Cutoff frequency · fc",
}
function inputValue(input: string, scale: number) {
  const parsed = positiveNumber(input.replaceAll(",", ""))
  const value = parsed === null ? null : parsed * scale
  return value !== null && Number.isFinite(value) && value > 0 ? value : null
}

function FilterCalculator({ highPass }: { highPass: boolean }) {
  const prefix = highPass ? "high-pass" : "low-pass"
  const [inputs, setInputs] = useState({ r: "10000", c: "100", f: "" })
  const [componentUnits, setComponentUnits] = useState(defaultUnits)
  const replacing = useRef(false)
  const units = { r: componentUnits.r.unit, c: componentUnits.c.unit, f: "Hz" }
  const scales = { r: componentUnits.r.scale, c: componentUnits.c.scale, f: 1 }
  const [locked, setLocked] = useState<RcField | null>(null)
  const [solving, setSolving] = useState<RcField | "pair">("f")
  const [series, setSeries] = useState<ResistorSeries>("E24")
  const [capSeries, setCapSeries] = useState<CapacitorSeries>("E12")
  const [matchMode, setMatchMode] = useState<MatchMode>("pair")
  const inputR = inputValue(inputs.r, scales.r)
  const inputC = inputValue(inputs.c, scales.c)
  const inputF = inputValue(inputs.f, 1)
  const r = solving === "r" ? solveRc(inputC, inputF) : inputR
  const c = solving === "c" ? solveRc(inputR, inputF) : inputC
  const f = solving === "f" ? solveRc(inputR, inputC) : inputF
  const mode =
    solving === "pair"
      ? "pair"
      : locked === "r"
        ? "capacitor"
        : locked === "c"
          ? "resistor"
          : matchMode
  const matches = useMemo(
    () => rcMatches({ r, c, f }, mode, series, capSeries),
    [r, c, f, mode, series, capSeries]
  )
  const values: RcValues =
    solving === "pair"
      ? { f, r: matches[0]?.r ?? null, c: matches[0]?.c ?? null }
      : { r, c, f }
  const displayed = { ...inputs }
  for (const field of fields) {
    if (solving === field || (solving === "pair" && field !== "f"))
      displayed[field] =
        values[field] === null
          ? ""
          : formatNumber(values[field]! / scales[field])
  }
  displayed.f = groupFrequencyInput(displayed.f)
  const actual = solveRc(values.r, values.c)
  const rangeError =
    solving !== "pair" &&
    values[solving] === null &&
    fields
      .filter((field) => field !== solving)
      .every((field) => values[field] !== null)

  function toggleLock(field: RcField) {
    setInputs(displayed)
    if (locked === field) {
      setLocked(null)
      setSolving("f")
    } else {
      setLocked(field)
      setSolving(field === "f" ? "c" : field === "r" ? "c" : "r")
      if (field === "f") setMatchMode("capacitor")
    }
  }

  return (
    <FieldGroup>
      <Card>
        <CardHeader>
          <CardTitle>{highPass ? "High-pass" : "Low-pass"} RC filter</CardTitle>
          <CardDescription>
            Enter R and C to calculate cutoff, or enter a target cutoff to find
            a standard pair. Lock any one value, then edit another to solve the
            third.
            <p className="mt-4 text-sm text-foreground">fc = 1 / (2πRC)</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const calculated =
                  solving === field || (solving === "pair" && field !== "f")
                const invalid = !calculated && values[field] === null
                const id = `${prefix}-${field}`
                return (
                  <Field
                    key={field}
                    className={field === "f" ? "mb-0 sm:col-span-2" : "mb-0"}
                    data-invalid={invalid}
                  >
                    {field === "f" && <Separator className="mb-4" />}
                    <FieldLabel htmlFor={id}>
                      {field === "f" && solving !== "f"
                        ? "Target cutoff · fc"
                        : labels[field]}
                    </FieldLabel>
                    <InputGroup
                      className="h-12 cursor-text"
                      onClick={(event) => {
                        const target = event.target as HTMLElement
                        if (target.closest("button, input")) return
                        event.currentTarget.querySelector("input")?.focus()
                      }}
                    >
                      <InputGroupInput
                        id={id}
                        className="flex-initial font-mono text-lg md:text-lg"
                        style={{
                          width: `calc(${Math.max(1, (displayed[field] || (calculated ? "Calculated" : "Enter a value")).length)}ch + 0.875rem)`,
                          maxWidth: "calc(100% - 5rem)",
                        }}
                        inputMode={field === "f" ? "decimal" : "text"}
                        value={displayed[field]}
                        aria-invalid={invalid}
                        aria-describedby={`${id}-unit ${id}-help`}
                        placeholder={
                          calculated ? "Calculated" : "Enter a value"
                        }
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
                          const raw = input.value
                          if (field === "f") {
                            const formatted = groupFrequencyInput(raw)
                            const charactersBeforeCaret = raw
                              .slice(0, input.selectionStart ?? raw.length)
                              .replaceAll(",", "").length
                            setInputs({ ...displayed, f: formatted })
                            // Restore the caret after inserting/removing grouping separators.
                            let caret = 0
                            let count = 0
                            while (
                              caret < formatted.length &&
                              count < charactersBeforeCaret
                            ) {
                              if (formatted[caret] !== ",") count++
                              caret++
                            }
                            requestAnimationFrame(() => {
                              if (document.activeElement === input)
                                input.setSelectionRange(caret, caret)
                            })
                          } else {
                            const parsed = parseEngineeringInput(
                              raw,
                              field,
                              componentUnits[field],
                              replacing.current
                            )
                            setInputs({ ...displayed, [field]: parsed.text })
                            setComponentUnits({
                              ...componentUnits,
                              [field]: {
                                unit: parsed.unit,
                                scale: parsed.scale,
                              },
                            })
                          }
                          replacing.current = false
                          setSolving(nextRcSolve(field, locked, solving))
                          if (locked === "f" && field !== "f")
                            setMatchMode(
                              field === "r" ? "capacitor" : "resistor"
                            )
                        }}
                      />
                      <InputGroupAddon
                        id={`${id}-unit`}
                        align="inline-end"
                        className="shrink-0 pr-0 text-lg text-foreground"
                        aria-live="polite"
                      >
                        {units[field]}
                      </InputGroupAddon>
                      <InputGroupAddon
                        align="inline-end"
                        className="ml-auto shrink-0"
                      >
                        <InputGroupButton
                          size="icon-sm"
                          variant={locked === field ? "secondary" : "ghost"}
                          aria-label={`${locked === field ? "Unlock" : "Lock"} ${labels[field]}`}
                          aria-pressed={locked === field}
                          title={
                            locked === field
                              ? "Unlock this value"
                              : "Hold this value while solving"
                          }
                          disabled={locked !== field && values[field] === null}
                          onClick={() => toggleLock(field)}
                        >
                          {locked === field ? (
                            <LockKeyhole />
                          ) : (
                            <LockKeyholeOpen />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription id={`${id}-help`}>
                      {locked === field
                        ? "Held fixed when other values change. You can still edit it."
                        : calculated
                          ? solving === "pair"
                            ? "Best standard pair for your target cutoff."
                            : "Calculated. Edit to solve another value."
                          : "Enter a value, or lock it to hold it fixed."}
                      {field === "r" &&
                        " New entry: ohms. Suffixes: 100r, 100k, 1M."}
                      {field === "c" &&
                        " New entry: nF. Suffixes: 100p, 100n, 1u, 10u."}
                    </FieldDescription>
                    {invalid && (
                      <FieldError>
                        Enter a finite value greater than zero.
                      </FieldError>
                    )}
                  </Field>
                )
              })}
            </FieldGroup>
            <Field className="mb-0" aria-live="polite">
              {rangeError ? (
                <FieldError>
                  These values exceed the calculation range. Try less extreme
                  values.
                </FieldError>
              ) : (
                <FieldDescription>
                  {actual === null
                    ? "Enter valid values to calculate your filter."
                    : `Actual cutoff: ${formatFrequency(actual)} · −3.01 dB at cutoff · 20 dB/decade roll-off.`}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <RcBodePlot cutoff={actual} highPass={highPass} />
      <RcCircuit
        highPass={highPass}
        resistance={values.r}
        capacitance={values.c}
      />
      <Card>
        <CardHeader>
          <CardTitle>Closest standard values</CardTitle>
          <CardDescription>
            Six matches ranked by absolute cutoff error against{" "}
            {values.f === null ? "your target" : formatFrequency(values.f)}.
            {mode === "capacitor"
              ? " Your resistor stays fixed."
              : mode === "resistor"
                ? " Your capacitor stays fixed."
                : " Equal-error pairs prefer a resistor near 10 kΩ."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldGroup className="grid gap-4 sm:grid-cols-3">
              <Field className="mb-0">
                <FieldLabel htmlFor={`${prefix}-match`}>
                  Find closest
                </FieldLabel>
                <NativeSelect
                  id={`${prefix}-match`}
                  value={mode}
                  disabled={
                    locked === "r" || locked === "c" || solving === "pair"
                  }
                  onChange={(event) =>
                    setMatchMode(event.target.value as MatchMode)
                  }
                >
                  <NativeSelectOption value="pair">
                    R + C pair
                  </NativeSelectOption>
                  <NativeSelectOption value="resistor">
                    Resistor · keep C
                  </NativeSelectOption>
                  <NativeSelectOption value="capacitor">
                    Capacitor · keep R
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field className="mb-0">
                <FieldLabel htmlFor={`${prefix}-series`}>
                  Resistor series
                </FieldLabel>
                <NativeSelect
                  id={`${prefix}-series`}
                  value={series}
                  disabled={mode === "capacitor"}
                  onChange={(event) =>
                    setSeries(event.target.value as ResistorSeries)
                  }
                >
                  {(["E12", "E24", "E48", "E96"] as const).map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {value}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field className="mb-0">
                <FieldLabel htmlFor={`${prefix}-caps`}>
                  Capacitor values
                </FieldLabel>
                <NativeSelect
                  id={`${prefix}-caps`}
                  value={capSeries}
                  disabled={mode === "resistor"}
                  onChange={(event) =>
                    setCapSeries(event.target.value as CapacitorSeries)
                  }
                >
                  <NativeSelectOption value="E6">
                    E6 · common
                  </NativeSelectOption>
                  <NativeSelectOption value="E12">
                    E12 · common
                  </NativeSelectOption>
                  <NativeSelectOption value="E24">
                    E24 · extended
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
            </FieldGroup>
            <Table>
              <TableCaption>
                Nominal values; tolerances, source impedance and loading are not
                included. Search: R 10 Ω–1 MΩ; C 1 pF–1,000 µF. A held component
                can be outside these ranges.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>R</TableHead>
                  <TableHead>C</TableHead>
                  <TableHead className="text-right">Actual cutoff</TableHead>
                  <TableHead className="text-right">Error (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length ? (
                  matches.map((row) => (
                    <TableRow key={`${row.r}-${row.c}`}>
                      <TableCell className="font-medium">
                        {formatResistance(row.r)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCapacitance(row.c)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatFrequency(row.cutoff)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.error > 0 ? "+" : ""}
                        {row.error.toFixed(3)}%
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Enter a valid cutoff
                      {mode === "pair"
                        ? ""
                        : mode === "capacitor"
                          ? " and resistance"
                          : " and capacitance"}{" "}
                      to see matches.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </FieldGroup>
        </CardContent>
      </Card>
    </FieldGroup>
  )
}

export default function PassiveRcFilters() {
  return (
    <FieldGroup className="mx-auto max-w-4xl">
      <Field>
        <h2 className="text-xl font-semibold">Passive RC filters</h2>
        <FieldDescription>
          Calculate first-order filters and find practical resistor and
          capacitor values.
        </FieldDescription>
      </Field>
      <Tabs defaultValue="low-pass">
        <TabsList aria-label="Filter type">
          <TabsTrigger value="low-pass">Low-pass</TabsTrigger>
          <TabsTrigger value="high-pass">High-pass</TabsTrigger>
        </TabsList>
        <TabsContent value="low-pass" keepMounted>
          <FilterCalculator highPass={false} />
        </TabsContent>
        <TabsContent value="high-pass" keepMounted>
          <FilterCalculator highPass />
        </TabsContent>
      </Tabs>
    </FieldGroup>
  )
}
