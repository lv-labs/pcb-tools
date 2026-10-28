import { useMemo, useState } from "react"
import { LockKeyhole, LockKeyholeOpen } from "lucide-react"
import { OpampCircuit } from "@/components/opamp-circuit"

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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  closestMatches,
  closestPairs,
  formatNumber,
  formatResistance,
  gain,
  positiveNumber,
  solveResistor,
  type ESeries,
  type Resistor,
  type Topology,
} from "@/lib/opamp-gain"

function GainCalculator({ topology }: { topology: Topology }) {
  const [resistors, setResistors] = useState({ r1: "10", rf: "100" })
  const [locked, setLocked] = useState<Resistor | null>(null)
  const [target, setTarget] = useState("10")
  const [findPair, setFindPair] = useState(false)
  const [series, setSeries] = useState<ESeries>("E24")
  const inverting = topology === "inverting"
  const labels = {
    r1: inverting ? "Input resistor · Rᵢₙ" : "Ground resistor · Rg",
    rf: "Feedback resistor · Rf",
  }
  const targetNumber = positiveNumber(target)
  const validTarget = targetNumber !== null && (inverting || targetNumber > 1)
  const solvingPair = !locked && findPair
  const targeting = locked !== null || solvingPair
  const pairs = useMemo(
    () =>
      solvingPair && validTarget
        ? closestPairs(topology, targetNumber!, series)
        : [],
    [solvingPair, validTarget, topology, targetNumber, series]
  )
  const fixedNumber = locked ? positiveNumber(resistors[locked]) : null
  const ideal =
    locked && fixedNumber !== null && validTarget
      ? solveResistor(topology, locked, fixedNumber * 1000, targetNumber!)
      : null
  const values = { ...resistors }
  if (solvingPair) {
    values.r1 = pairs.length ? formatNumber(pairs[0].r1 / 1000) : ""
    values.rf = pairs.length ? formatNumber(pairs[0].rf / 1000) : ""
  }
  if (locked)
    values[locked === "r1" ? "rf" : "r1"] =
      ideal === null ? "" : formatNumber(ideal / 1000)
  const r1 = positiveNumber(values.r1)
  const rf = positiveNumber(values.rf)
  const calculatedGain =
    r1 !== null && rf !== null ? gain(topology, r1, rf) : null
  const actualGain =
    calculatedGain !== null &&
      Number.isFinite(calculatedGain) &&
      calculatedGain !== 0
      ? calculatedGain
      : null
  const singleMatches =
    locked && fixedNumber !== null && validTarget
      ? closestMatches(
        topology,
        locked,
        fixedNumber * 1000,
        targetNumber!,
        series
      )
      : []

  const matches = solvingPair
    ? pairs
    : singleMatches.map((row) => ({
      ...row,
      r1: locked === "r1" ? fixedNumber! * 1000 : row.resistance,
      rf: locked === "rf" ? fixedNumber! * 1000 : row.resistance,
    }))

  function toggleLock(resistor: Resistor) {
    setResistors(values)
    setFindPair(false)
    if (!targeting && actualGain !== null)
      setTarget(formatNumber(Math.abs(actualGain)))
    setLocked(locked === resistor ? null : resistor)
  }

  return (
    <FieldGroup>
      <Card>
        <CardHeader>
          <CardTitle>
            {inverting ? "Inverting" : "Non-inverting"} amplifier
          </CardTitle>
          <CardDescription>
            <p>
              Enter two resistors to calculate gain, enter a gain to find a
              standard pair, or lock one resistor to solve for the other.
            </p>
            <p className="mt-4 text-sm text-foreground">
              {inverting ? "Av = −Rf / Rᵢₙ" : "Av = 1 + Rf / Rg"}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {(["r1", "rf"] as const).map((resistor) => {
                const solving = locked !== null && locked !== resistor
                const invalid =
                  !solving &&
                  !solvingPair &&
                  positiveNumber(values[resistor]) === null
                const id = `${topology}-${resistor}`
                return (
                  <Field key={resistor} className="mb-0" data-invalid={invalid}>
                    <FieldLabel htmlFor={id}>{labels[resistor]}</FieldLabel>
                    <InputGroup className="h-12">
                      <InputGroupInput
                        id={id}
                        className="text-lg md:text-lg"
                        inputMode="decimal"
                        value={values[resistor]}
                        readOnly={solving}
                        aria-invalid={invalid}
                        placeholder={
                          solving ? "Calculated" : "Enter resistance"
                        }
                        onChange={(event) => {
                          setFindPair(false)
                          setResistors({
                            ...values,
                            [resistor]: event.target.value,
                          })
                        }}
                      />
                      <InputGroupAddon align="inline-end">
                        kΩ
                        <InputGroupButton
                          size="icon-sm"
                          variant={locked === resistor ? "secondary" : "ghost"}
                          aria-label={`${locked === resistor ? "Unlock" : "Lock"} ${labels[resistor]}`}
                          aria-pressed={locked === resistor}
                          disabled={
                            (solving && ideal === null) ||
                            (solvingPair && !pairs.length)
                          }
                          title={
                            locked === resistor
                              ? "Unlock to calculate gain from two resistors"
                              : "Hold this resistor fixed and set a target gain"
                          }
                          onClick={() => toggleLock(resistor)}
                        >
                          {locked === resistor ? (
                            <LockKeyhole />
                          ) : (
                            <LockKeyholeOpen />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {/* <FieldDescription id={`${id}-help`}>
                      {solving
                        ? "Calculated from your target gain."
                        : locked === resistor
                          ? "Held fixed while solving. You can still edit this value."
                          : "Lock to hold this resistor fixed."}
                    </FieldDescription> */}
                    {invalid && (
                      <FieldError>
                        Enter a finite resistance greater than zero.
                      </FieldError>
                    )}
                  </Field>
                )
              })}
            </FieldGroup>
            <Separator />
            <Field className="mb-0" data-invalid={targeting && !validTarget}>
              <FieldLabel htmlFor={`${topology}-gain`}>
                {targeting ? "Target gain · |Av|" : "Gain magnitude · |Av|"}
              </FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  id={`${topology}-gain`}
                  className="text-lg md:text-lg"
                  inputMode="decimal"
                  value={
                    targeting
                      ? target
                      : actualGain === null
                        ? ""
                        : formatNumber(Math.abs(actualGain))
                  }
                  aria-invalid={targeting && !validTarget}
                  aria-describedby={`${topology}-gain-help`}
                  placeholder="Enter target gain"
                  onChange={(event) => {
                    setTarget(event.target.value)
                    if (!locked) setFindPair(true)
                  }}
                />
                <InputGroupAddon align="inline-end">V/V</InputGroupAddon>
              </InputGroup>
              <FieldDescription id={`${topology}-gain-help`}>
                {locked
                  ? inverting
                    ? "Enter a positive magnitude; the output is inverted."
                    : "Enter a gain greater than 1. Unity gain uses a voltage follower."
                  : "Enter a positive target gain to find both resistors, or edit a resistor to calculate gain. Pair search: 1 kΩ–1 MΩ."}
              </FieldDescription>
              {targeting && !validTarget && (
                <FieldError>
                  {inverting
                    ? "Target magnitude must be finite and greater than zero."
                    : "Target gain must be finite and greater than 1."}
                </FieldError>
              )}
            </Field>
            {/* <Field className="mb-0" aria-live="polite">
              <FieldDescription>
                {actualGain !== null
                  ? `Av = ${formatNumber(actualGain)} V/V · ${formatNumber(20 * Math.log10(Math.abs(actualGain)))} dB${inverting ? " · Inverted output" : ""}`
                  : "Enter valid values to calculate the result."}
              </FieldDescription>
              {solvingPair && pairs.length > 0 && (
                <FieldDescription>
                  Best standard pair shown above and in the circuit. Gain error:{" "}
                  {pairs[0].error.toFixed(3)}%. Equal-error pairs prefer{" "}
                  {inverting ? "Rᵢₙ" : "Rg"} near 10 kΩ.
                </FieldDescription>
              )}
              {locked && ideal !== null && (
                <FieldDescription className="pt-4 text-lg text-foreground">
                  Ideal {locked === "r1" ? "Rf" : inverting ? "Rᵢₙ" : "Rg"}:{" "}
                  <strong>{formatResistance(ideal)}</strong>
                </FieldDescription>
              )}
              {locked &&
                validTarget &&
                fixedNumber !== null &&
                ideal === null && (
                  <FieldError>
                    These values exceed the calculation range. Try a smaller
                    gain or resistance.
                  </FieldError>
                )}
            </Field> */}
          </FieldGroup>
        </CardContent>
      </Card>
      <OpampCircuit
        topology={topology}
        r1={r1 === null ? null : r1 * 1000}
        rf={rf === null ? null : rf * 1000}
        locked={locked}
        matchedPair={solvingPair && pairs.length > 0}
      />
      <Card>
        <CardHeader>
          <CardTitle>Closest standard values</CardTitle>
          <CardDescription>
            {/* {solvingPair
              ? "Six closest standard pairs, with both resistors between 1 kΩ and 1 MΩ, ranked by absolute gain error."
              : "Six nearest matches ranked by absolute gain error. The locked resistor stays fixed."} */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor={`${topology}-series`}>
              Preferred value series
            </FieldLabel>
            <NativeSelect
              id={`${topology}-series`}
              value={series}
              onChange={(event) => setSeries(event.target.value as ESeries)}
            >
              {(["E24", "E48", "E96"] as const).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Table>
            {/* <TableCaption>
              Ideal op-amp, nominal resistor values. Component tolerances and
              op-amp bandwidth are not included.
            </TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>{inverting ? "Rᵢₙ" : "Rg"}</TableHead>
                <TableHead>Rf</TableHead>
                <TableHead className="text-right">Gain (V/V)</TableHead>
                <TableHead className="text-right">Gain (dB)</TableHead>
                <TableHead className="text-right">Error (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length ? (
                matches.map((row) => (
                  <TableRow key={`${row.r1}-${row.rf}`}>
                    <TableCell className="font-medium">
                      {formatResistance(row.r1)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatResistance(row.rf)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.gain)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(20 * Math.log10(Math.abs(row.gain))).toFixed(3)}
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
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {locked
                      ? "Enter a valid resistance and target gain to see matches."
                      : "Enter a valid target gain to find standard resistor pairs."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </FieldGroup>
  )
}

export default function OpampGain() {
  return (
    <FieldGroup className="mx-auto max-w-4xl">
      <Field>
        <h2 className="text-xl font-semibold">Op-amp gain calculator</h2>
        <FieldDescription>
          Calculate voltage gain and find feedback resistor values.
        </FieldDescription>
      </Field>
      <Tabs defaultValue="inverting">
        <TabsList aria-label="Amplifier topology">
          <TabsTrigger value="inverting">Inverting</TabsTrigger>
          <TabsTrigger value="non-inverting">Non-inverting</TabsTrigger>
        </TabsList>
        {(["inverting", "non-inverting"] as const).map((topology) => (
          <TabsContent key={topology} value={topology} keepMounted>
            <GainCalculator topology={topology} />
          </TabsContent>
        ))}
      </Tabs>
    </FieldGroup>
  )
}
