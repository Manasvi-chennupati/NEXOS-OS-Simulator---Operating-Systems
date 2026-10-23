import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Clock3,
  Disc3,
  Gauge,
  RotateCcw,
  Waypoints,
  Zap,
} from 'lucide-react'
import { runDisk, validateDisk } from '../algorithms/diskScheduling'
import { loadState, saveState } from '../algorithms/persistence'
import { sampleDiskRequests } from '../algorithms/samples'
import type { DiskAlgorithm, DiskResult } from '../algorithms/types'
import { DiskPath } from '../components/DiskPath'
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

type StoredDiskState = {
  requests: string
  start: number
  max: number
  algo: DiskAlgorithm
  dir: 'up' | 'down'
  seek: number
}

export function DiskView() {
  const stored = loadState<StoredDiskState>('disk', {
    requests: sampleDiskRequests.join(', '),
    start: 53,
    max: 199,
    algo: 'SCAN',
    dir: 'up',
    seek: 1,
  })

  const [requests, setRequests] = useState(stored.requests)
  const [start, setStart] = useState(stored.start)
  const [max, setMax] = useState(stored.max)
  const [algo, setAlgo] = useState<DiskAlgorithm>(stored.algo)
  const [dir, setDir] = useState<'up' | 'down'>(stored.dir)
  const [seek, setSeek] = useState(stored.seek)
  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<DiskResult | null>(null)

  useEffect(() => {
    saveState('disk', { requests, start, max, algo, dir, seek })
  }, [requests, start, max, algo, dir, seek])

  function parse(): number[] {
    return requests
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
  }

  function run() {
    const req = parse()
    const errs = validateDisk(req, start, max)
    setErrors(errs)

    if (errs.length) {
      setResult(null)
      return
    }

    try {
      setResult(runDisk(algo, req, start, max, dir, seek))
    } catch (error) {
      setResult(null)
      setErrors([
        error instanceof Error ? error.message : String(error),
      ])
    }
  }

  function loadSample() {
    setRequests(sampleDiskRequests.join(', '))
    setStart(53)
    setMax(199)
    setAlgo('SCAN')
    setDir('up')
    setSeek(1)
    setErrors([])
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#102a3a] via-[#0b1928] to-[#11152a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Disc3 size={16} />
              Storage I/O Management
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Disk Scheduling
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Simulate disk-head movement, compare scheduling strategies,
              and understand how operating systems process pending I/O requests.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
            <Waypoints size={32} />
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Requests queued</p>
            <p className="mt-1 text-xl font-bold text-white">
              {parse().filter(Number.isFinite).length}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Current head</p>
            <p className="mt-1 text-xl font-bold text-white">{start}</p>
          </div>

          <div className="col-span-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:col-span-1">
            <p className="text-xs text-slate-500">Selected algorithm</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">{algo}</p>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Gauge size={20} />
          </div>

          <div>
            <CardTitle>Simulation Configuration</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Set the disk geometry, initial head position, and request queue.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Scheduling algorithm">
            <Select
              value={algo}
              onChange={(event) => {
                setAlgo(event.target.value as DiskAlgorithm)
                setResult(null)
                setErrors([])
              }}
            >
              <option value="FCFS">FCFS</option>
              <option value="SSTF">SSTF</option>
              <option value="SCAN">SCAN</option>
              <option value="C-SCAN">C-SCAN</option>
            </Select>
          </Field>

          <Field label="Initial head position">
            <Input
              type="number"
              value={start}
              onChange={(event) => setStart(Number(event.target.value))}
            />
          </Field>

          <Field label="Maximum cylinder">
            <Input
              type="number"
              value={max}
              onChange={(event) => setMax(Number(event.target.value))}
            />
          </Field>

          <Field label="SCAN direction">
            <Select
              value={dir}
              onChange={(event) => {
                setDir(event.target.value as 'up' | 'down')
                setResult(null)
              }}
            >
              <option value="up">Toward higher cylinders</option>
              <option value="down">Toward cylinder 0</option>
            </Select>
          </Field>

          <Field label="Time per cylinder">
            <Input
              type="number"
              value={seek}
              onChange={(event) => setSeek(Number(event.target.value))}
            />
          </Field>

          <Field label="Request queue">
            <Input
              value={requests}
              onChange={(event) => setRequests(event.target.value)}
              placeholder="98, 183, 37, 122, 14"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={run}>
            <Activity size={16} />
            Run Simulation
          </Button>

          <Button variant="ghost" onClick={loadSample}>
            <RotateCcw size={15} />
            Reset Sample
          </Button>
        </div>

        <div className="mt-4">
          <ErrorBanner errors={errors} />
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Enter cylinder requests separated by commas or spaces. Cylinder
          positions must be within the configured disk range.
        </p>
      </Card>

      {/* Results */}
      {result ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric
              label="Total Head Movement"
              value={`${result.totalSeek} cylinders`}
            />
            <Metric
              label="Average Seek Movement"
              value={String(result.averageSeek)}
            />
            <Metric
              label="Estimated Seek Time"
              value={String(result.estimatedTime)}
            />
          </section>

          <Card>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Disk Head Movement Path</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Execution order for {algo}
                </p>
              </div>

              <span className="w-fit rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-300">
                {result.sequence.length} positions
              </span>
            </div>

            <div className="overflow-x-auto">
              <p className="mb-4 min-w-max font-mono text-sm leading-7 text-slate-300">
                {result.sequence.join('  →  ')}
              </p>
            </div>

            <DiskPath result={result} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <ArrowDownUp size={19} />
              </div>

              <div>
                <CardTitle>Head Movement Breakdown</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Distance travelled at every movement
                </p>
              </div>
            </div>

            <Table
              headers={['Step', 'From Cylinder', 'To Cylinder', 'Distance']}
              rows={result.movements.map((movement, index) => [
                index + 1,
                movement.from,
                movement.to,
                movement.distance,
              ])}
            />

            {result.movements.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No head movement required for this request queue.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>How to interpret the results</CardTitle>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-300">
                  <ArrowRight size={17} />
                  <p className="font-semibold">Total movement</p>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Sum of the cylinder distances travelled by the disk head
                  during the schedule.
                </p>
              </div>

              <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-violet-300">
                  <Activity size={17} />
                  <p className="font-semibold">Average movement</p>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Average head movement per request, as calculated by the
                  scheduling algorithm.
                </p>
              </div>

              <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <Clock3 size={17} />
                  <p className="font-semibold">Estimated time</p>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Estimated movement time based on the configured time per
                  cylinder. It does not necessarily include rotational latency.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-300">
              <Zap size={26} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-200">
              Ready to schedule requests
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Configure the algorithm and disk request queue, then run the
              simulation to visualize head movement and calculate seek metrics.
            </p>
          </div>
        </Card>
      )}

      {/* Algorithm reference */}
      <Card>
        <CardTitle>Scheduling Algorithms</CardTitle>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="font-semibold text-cyan-300">FCFS</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Processes requests in arrival order. Simple and fair in queue
              order, but may cause large head movements.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="font-semibold text-violet-300">SSTF</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Chooses the request closest to the current head position. It
              can reduce movement but may starve distant requests.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="font-semibold text-emerald-300">SCAN</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Moves in one direction servicing requests, then reverses at the
              disk boundary according to the algorithm implementation.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="font-semibold text-amber-300">C-SCAN</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Services requests in one direction and returns to the opposite
              end to continue servicing in a circular order.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}