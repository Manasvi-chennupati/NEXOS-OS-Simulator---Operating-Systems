import { useEffect, useState } from 'react'
import {
  Blocks,
  CheckCircle2,
  Cpu,
  HardDrive,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  allocateAll,
  allocateOne,
  freeProcess,
  holesToBlocks,
  strategyLabel,
} from '../algorithms/memoryAllocation'
import { loadState, saveState } from '../algorithms/persistence'
import { sampleHoles, sampleMemoryRequests } from '../algorithms/samples'
import type {
  MemoryBlock,
  MemoryFit,
  MemoryRequest,
  MemoryResult,
} from '../algorithms/types'
import { MemoryMap } from '../components/MemoryMap'
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

type Stored = {
  holes: string
  requests: MemoryRequest[]
  strategy: MemoryFit
}

export function MemoryView() {
  const stored = loadState<Stored>('memory', {
    holes: sampleHoles.join(', '),
    requests: sampleMemoryRequests,
    strategy: 'first',
  })

  const [holesText, setHolesText] = useState(stored.holes)
  const [requests, setRequests] = useState<MemoryRequest[]>(stored.requests)
  const [strategy, setStrategy] = useState<MemoryFit>(stored.strategy)
  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<MemoryResult | null>(null)
  const [live, setLive] = useState<MemoryBlock[] | null>(null)

  useEffect(() => {
    saveState('memory', { holes: holesText, requests, strategy })
  }, [holesText, requests, strategy])

  function parseHoles(): number[] {
    return holesText
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map(Number)
  }

  function run() {
    const holes = parseHoles()
    const errs: string[] = []

    if (!holes.length) {
      errs.push('Enter at least one hole size.')
    }

    if (holes.some((hole) => !Number.isFinite(hole) || hole <= 0)) {
      errs.push('Hole sizes must be numbers greater than zero.')
    }

    if (
      requests.some(
        (request) =>
          !request.id.trim() ||
          !Number.isFinite(request.size) ||
          request.size <= 0,
      )
    ) {
      errs.push('Each request needs a process ID and a size greater than zero.')
    }

    if (errs.length) {
      setErrors(errs)
      setResult(null)
      setLive(null)
      return
    }

    const next = allocateAll(holes, requests, strategy)

    setErrors([])
    setResult(next)
    setLive(next.blocks)
  }

  function freeOne(id: string) {
    if (!live || !result) return

    const blocks = freeProcess(live, id)
    const allocations = result.allocations.filter(
      (allocation) => allocation.processId !== id,
    )

    setLive(blocks)
    setResult({
      ...result,
      blocks,
      allocations,
    })
  }

  function extraAlloc() {
    if (!live || !result) return

    const id = `PX${Date.now() % 100000}`
    const size = 50
    const allocation = allocateOne(live, { id, size }, strategy)

    setLive(allocation.blocks)

    if (allocation.ok) {
      const placedBlock = allocation.blocks.find(
        (block) => block.processId === id,
      )

      setResult({
        ...result,
        blocks: allocation.blocks,
        allocations: placedBlock
          ? [
              ...result.allocations,
              {
                processId: id,
                start: placedBlock.start,
                size,
              },
            ]
          : result.allocations,
      })
    } else {
      setResult({
        ...result,
        blocks: allocation.blocks,
        failures: [
          ...result.failures,
          {
            processId: id,
            size,
            reason: allocation.reason ?? 'Allocation failed.',
          },
        ],
      })
    }
  }

  function resetInputs() {
    setHolesText(sampleHoles.join(', '))
    setRequests(sampleMemoryRequests)
    setStrategy('first')
    setErrors([])
    setResult(null)
    setLive(null)
  }

  const parsedHoles = parseHoles()
  const total =
    result?.totalSize ??
    parsedHoles.reduce(
      (sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0),
      0,
    )

  const blocks =
    live ??
    (total > 0
      ? holesToBlocks(parsedHoles.filter((hole) => Number.isFinite(hole) && hole > 0))
      : [])

  const freeSpace = blocks.reduce(
    (sum, block) => sum + (block.processId === 'FREE' ? block.size : 0),
    0,
  )

  const usedSpace = Math.max(total - freeSpace, 0)
  const usagePercent = total > 0 ? Math.round((usedSpace / total) * 100) : 0

  return (
    <div className="space-y-6 pb-8">
      {/* Page introduction */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101e30] via-[#0c1726] to-[#102b31] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
              <HardDrive size={14} />
              Memory management
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Memory Allocation
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Allocate processes into variable-sized memory partitions,
              visualize memory usage, and explore fragmentation using
              First Fit, Best Fit, and Worst Fit strategies.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-300">
              <Blocks size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {requests.length} requests
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {strategyLabel(strategy)} strategy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Memory configuration</CardTitle>
            <p className="mt-1 text-xs text-slate-400">
              Set available memory holes and process sizes.
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            {total.toLocaleString()} total units
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Memory hole sizes (comma separated)">
            <Input
              value={holesText}
              onChange={(event) => {
                setHolesText(event.target.value)
                setResult(null)
                setLive(null)
                setErrors([])
              }}
              placeholder="Example: 100, 500, 200, 300"
            />
          </Field>

          <Field label="Allocation strategy">
            <Select
              value={strategy}
              onChange={(event) => {
                setStrategy(event.target.value as MemoryFit)
                setResult(null)
                setLive(null)
              }}
            >
              <option value="first">First Fit</option>
              <option value="best">Best Fit</option>
              <option value="worst">Worst Fit</option>
            </Select>
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Process requests
            </h3>
            <span className="text-xs text-slate-500">
              {requests.length} processes
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table
              headers={['Process ID', 'Memory size', 'Action']}
              rows={requests.map((request, index) => [
                <Input
                  key="id"
                  value={request.id}
                  onChange={(event) => {
                    setRequests((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, id: event.target.value }
                          : row,
                      ),
                    )
                    setResult(null)
                    setLive(null)
                  }}
                />,
                <Input
                  key="size"
                  type="number"
                  min={1}
                  value={request.size}
                  onChange={(event) => {
                    setRequests((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, size: Number(event.target.value) }
                          : row,
                      ),
                    )
                    setResult(null)
                    setLive(null)
                  }}
                />,
                <Button
                  key="remove"
                  variant="ghost"
                  onClick={() => {
                    setRequests((rows) =>
                      rows.filter((_, rowIndex) => rowIndex !== index),
                    )
                    setResult(null)
                    setLive(null)
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </Button>,
              ])}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setRequests((rows) => [
                ...rows,
                { id: `P${rows.length + 1}`, size: 100 },
              ])
              setResult(null)
              setLive(null)
            }}
          >
            <Plus size={15} />
            Add request
          </Button>

          <Button variant="ghost" onClick={resetInputs}>
            <RotateCcw size={15} />
            Reset sample
          </Button>

          <Button onClick={run}>
            <Cpu size={15} />
            Allocate memory
          </Button>

          {live && (
            <Button variant="ghost" onClick={extraAlloc}>
              <Plus size={15} />
              Try extra 50-unit process
            </Button>
          )}
        </div>

        <div className="mt-4">
          <ErrorBanner errors={errors} />
        </div>
      </Card>

      {/* Memory map */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Memory map</CardTitle>
            <p className="mt-1 text-xs text-slate-400">
              {strategyLabel(strategy)} · Address-ordered memory blocks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
              Allocated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-600" />
              Free
            </span>
          </div>
        </div>

        <MemoryMap blocks={blocks} totalSize={Math.max(total, 1)} />

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Memory utilization</span>
            <span className="font-mono text-cyan-300">{usagePercent}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Used: {usedSpace.toLocaleString()} units</span>
            <span>Free: {freeSpace.toLocaleString()} units</span>
          </div>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <>
          <div className="flex items-center gap-2">
            <ActivityIcon />
            <h3 className="text-lg font-bold text-slate-100">
              Allocation results
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric
              label="Successfully allocated"
              value={String(result.allocations.length)}
            />
            <Metric
              label="Failed requests"
              value={String(result.failures.length)}
            />
            <Metric
              label="External fragmentation"
              value={String(result.externalFragmentation)}
              hint="Free memory that cannot satisfy a request in one block"
            />
          </div>

          <Card>
            <CardTitle>Process placement</CardTitle>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              View allocation addresses and release memory when needed.
            </p>

            {result.allocations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  headers={[
                    'Process ID',
                    'Start address',
                    'Allocated size',
                    'Action',
                  ]}
                  rows={result.allocations.map((allocation) => [
                    allocation.processId,
                    allocation.start,
                    allocation.size,
                    <Button
                      key={allocation.processId}
                      variant="ghost"
                      onClick={() => freeOne(allocation.processId)}
                    >
                      <Trash2 size={14} />
                      Free memory
                    </Button>,
                  ])}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-slate-400">
                No processes are currently allocated.
              </p>
            )}

            {result.failures.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <XCircle size={17} />
                  Unsuccessful allocations
                </div>

                <div className="space-y-2">
                  {result.failures.map((failure) => (
                    <div
                      key={failure.processId}
                      className="flex flex-col justify-between gap-1 border-b border-white/[0.06] pb-2 text-xs sm:flex-row"
                    >
                      <span className="font-medium text-slate-200">
                        {failure.processId} · {failure.size} units
                      </span>
                      <span className="text-amber-200/80">
                        {failure.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failures.length === 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3 text-xs text-emerald-200">
                <CheckCircle2 size={16} />
                All process requests were allocated successfully.
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Allocation strategy explained</CardTitle>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  name: 'First Fit',
                  description:
                    'Selects the first available memory block that can hold the process.',
                  active: strategy === 'first',
                },
                {
                  name: 'Best Fit',
                  description:
                    'Selects the smallest available block that can hold the process.',
                  active: strategy === 'best',
                },
                {
                  name: 'Worst Fit',
                  description:
                    'Selects the largest available block that can hold the process.',
                  active: strategy === 'worst',
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`rounded-xl border p-4 ${
                    item.active
                      ? 'border-cyan-300/30 bg-cyan-300/[0.06]'
                      : 'border-white/[0.07] bg-white/[0.02]'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      item.active ? 'text-cyan-200' : 'text-slate-200'
                    }`}
                  >
                    {item.name}
                    {item.active ? ' · Selected' : ''}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function ActivityIcon() {
  return <Blocks size={19} className="text-cyan-300" />
}