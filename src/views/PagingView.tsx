import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { fifoPages, lruPages, validatePaging } from '../algorithms/pageReplacement'
import { loadState, saveState } from '../algorithms/persistence'
import { sampleReferenceString } from '../algorithms/samples'
import type { PageResult } from '../algorithms/types'
import { colorFor } from '../lib/palette'
import {
  Button,
  Card,
  CardTitle,
  ErrorBanner,
  Field,
  Input,
  Metric,
  Select,
  Table,
} from '../components/ui'

type PagingAlgorithm = 'FIFO' | 'LRU'

type Stored = {
  frames: number
  refs: string
  algo: PagingAlgorithm
}

export function PagingView() {
  const stored = loadState<Stored>('paging', {
    frames: 3,
    refs: sampleReferenceString.join(', '),
    algo: 'FIFO',
  })

  const [frames, setFrames] = useState(stored.frames)
  const [refs, setRefs] = useState(stored.refs)
  const [algo, setAlgo] = useState<PagingAlgorithm>(stored.algo)
  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<PageResult | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    saveState('paging', { frames, refs, algo })
  }, [frames, refs, algo])

  function parseRefs(): number[] {
    return refs
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map(Number)
  }

  function run() {
    const referenceString = parseRefs()
    const errs = validatePaging(frames, referenceString)

    if (referenceString.some((value) => !Number.isInteger(value))) {
      errs.push('The reference string must contain integers only.')
    }

    setErrors(errs)

    if (errs.length) {
      setResult(null)
      setStep(0)
      return
    }

    const next =
      algo === 'FIFO'
        ? fifoPages(frames, referenceString)
        : lruPages(frames, referenceString)

    setResult(next)
    setStep(0)
  }

  function loadSample() {
    setRefs(sampleReferenceString.join(', '))
    setResult(null)
    setStep(0)
    setErrors([])
  }

  const current = result?.steps[step]
  const completedSteps = result ? step + 1 : 0
  const faultCount = result
    ? result.steps.slice(0, completedSteps).filter((item) => item.fault).length
    : 0
  const hitCount = completedSteps - faultCount

  return (
    <div className="space-y-6 pb-8">
      {/* Introduction */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101e30] via-[#0c1726] to-[#18203b] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
              <Layers size={14} />
              Virtual memory
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Page Replacement
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Simulate page references, observe frame replacement, and
              understand page faults and hits with interactive step-by-step
              visualization.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="rounded-xl bg-violet-300/10 p-3 text-violet-300">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{algo}</p>
              <p className="mt-1 text-xs text-slate-400">
                {frames} memory frames
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <Card>
        <div className="mb-5">
          <CardTitle>Simulation configuration</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Select a replacement policy and enter the page reference sequence.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Replacement algorithm">
            <Select
              value={algo}
              onChange={(event) => {
                setAlgo(event.target.value as PagingAlgorithm)
                setResult(null)
                setStep(0)
              }}
            >
              <option value="FIFO">FIFO — First In, First Out</option>
              <option value="LRU">LRU — Least Recently Used</option>
            </Select>
          </Field>

          <Field label="Number of frames">
            <Input
              type="number"
              min={1}
              value={frames}
              onChange={(event) => {
                setFrames(Number(event.target.value))
                setResult(null)
                setStep(0)
              }}
            />
          </Field>

          <Field label="Page reference string">
            <Input
              value={refs}
              onChange={(event) => {
                setRefs(event.target.value)
                setResult(null)
                setStep(0)
              }}
              placeholder="7, 0, 1, 2, 0, 3, 0"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={loadSample}>
            <RotateCcw size={15} />
            Load sample
          </Button>

          <Button onClick={run}>
            <Zap size={15} />
            Run simulation
          </Button>
        </div>

        <div className="mt-4">
          <ErrorBanner errors={errors} />
        </div>
      </Card>

      {result && (
        <>
          {/* Overall metrics */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-100">
              Simulation results
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total page faults" value={String(result.faults)} />
              <Metric label="Total page hits" value={String(result.hits)} />
              <Metric
                label="Fault ratio"
                value={String(result.faultRatio)}
              />
              <Metric label="Hit ratio" value={String(result.hitRatio)} />
            </div>
          </div>

          {/* Step visualizer */}
          <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Frame visualizer</CardTitle>
                <p className="mt-1 text-xs text-slate-400">
                  Step through each page reference to see memory changes.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  current?.fault
                    ? 'bg-amber-300/10 text-amber-200'
                    : 'bg-emerald-300/10 text-emerald-200'
                }`}
              >
                {current?.fault ? 'PAGE FAULT' : 'PAGE HIT'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Current reference</p>
                <p className="mt-2 font-mono text-3xl font-bold text-white">
                  {current?.page ?? '—'}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Progress</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {completedSteps}
                  <span className="text-sm font-normal text-slate-500">
                    {' '}
                    / {result.steps.length}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Replaced page</p>
                <p className="mt-2 font-mono text-2xl font-bold text-white">
                  {current?.replaced !== null &&
                  current?.replaced !== undefined
                    ? current.replaced
                    : '—'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Physical memory frames
              </p>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {current?.frames.map((frame, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1520]"
                  >
                    <div className="border-b border-white/[0.07] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Frame {index}
                    </div>

                    <div
                      className="flex h-20 items-center justify-center font-mono text-2xl font-bold"
                      style={{
                        background:
                          frame === null
                            ? 'rgba(148, 163, 184, 0.04)'
                            : `${colorFor(String(frame))}22`,
                        color: frame === null ? '#64748b' : colorFor(String(frame)),
                      }}
                    >
                      {frame === null ? '—' : frame}
                    </div>

                    <div className="px-3 py-2 text-center text-[10px] text-slate-500">
                      {frame === null ? 'Empty' : `Page ${frame}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Simulation progress</span>
                <span>
                  {Math.round(
                    (completedSteps / Math.max(result.steps.length, 1)) * 100,
                  )}
                  %
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all"
                  style={{
                    width: `${(completedSteps / Math.max(result.steps.length, 1)) * 100}%`,
                  }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={result.steps.length - 1}
                value={step}
                onChange={(event) => setStep(Number(event.target.value))}
                className="mt-4 w-full cursor-pointer accent-violet-400"
                aria-label="Simulation step"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  disabled={step === 0}
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                >
                  <ArrowLeft size={15} />
                  Previous
                </Button>

                <span className="text-xs text-slate-400">
                  Step {step + 1} of {result.steps.length}
                </span>

                <Button
                  variant="ghost"
                  disabled={step >= result.steps.length - 1}
                  onClick={() =>
                    setStep((value) =>
                      Math.min(result.steps.length - 1, value + 1),
                    )
                  }
                >
                  Next
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Reference trace */}
          <Card>
            <CardTitle>Page reference trace</CardTitle>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              Select a step to inspect its frame contents and outcome.
            </p>

            <div className="overflow-x-auto">
              <Table
                headers={[
                  'Step',
                  'Page',
                  ...Array.from(
                    { length: result.frameCount },
                    (_, index) => `Frame ${index + 1}`,
                  ),
                  'Outcome',
                ]}
                rows={result.steps.map((item, index) => [
                  <button
                    key={`step-${index}`}
                    onClick={() => setStep(index)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs ${
                      step === index
                        ? 'bg-violet-300/15 text-violet-200'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {index + 1}
                  </button>,
                  item.page,
                  ...item.frames.map((frame, frameIndex) => (
                    <span
                      key={`frame-${frameIndex}`}
                      className="font-mono"
                      style={{
                        color:
                          frame === null ? '#64748b' : colorFor(String(frame)),
                      }}
                    >
                      {frame === null ? '—' : frame}
                    </span>
                  )),
                  <span
                    key="outcome"
                    className={
                      item.fault ? 'text-amber-200' : 'text-emerald-200'
                    }
                  >
                    {item.fault
                      ? item.replaced === null
                        ? 'Fault · Empty frame'
                        : `Fault · Replaced ${item.replaced}`
                      : 'Hit'}
                  </span>,
                ])}
              />
            </div>
          </Card>

          {/* Current progress */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <div className="rounded-xl bg-amber-300/10 p-3 text-amber-200">
                <Zap size={19} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Faults so far</p>
                <p className="mt-1 text-xl font-bold text-amber-100">
                  {faultCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
              <div className="rounded-xl bg-emerald-300/10 p-3 text-emerald-200">
                <CheckCircle2 size={19} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Hits so far</p>
                <p className="mt-1 text-xl font-bold text-emerald-100">
                  {hitCount}
                </p>
              </div>
            </div>
          </div>

          {/* Algorithm notes */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={18} className="text-violet-300" />
              <CardTitle>Algorithm overview</CardTitle>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div
                className={`rounded-xl border p-4 ${
                  algo === 'FIFO'
                    ? 'border-violet-300/30 bg-violet-300/[0.05]'
                    : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <p className="text-sm font-semibold text-violet-200">
                  FIFO — First In, First Out
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Replaces the page that has been in memory the longest.
                  It follows the order in which pages entered the frames.
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  algo === 'LRU'
                    ? 'border-cyan-300/30 bg-cyan-300/[0.05]'
                    : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <p className="text-sm font-semibold text-cyan-200">
                  LRU — Least Recently Used
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Replaces the page that has not been used for the longest
                  time, based on recent reference history.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {!result && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
          <div className="rounded-2xl bg-violet-300/[0.08] p-4 text-violet-300">
            <Layers size={28} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-200">
            Ready to simulate
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            Configure the page reference string and frame count, then run the
            simulation to explore page replacement behavior.
          </p>
        </div>
      )}
    </div>
  )
}