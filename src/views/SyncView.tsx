import { useState } from 'react'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CircleHelp,
  Database,
  LockKeyhole,
  RotateCcw,
  Users,
  UserRoundPen,
  Workflow,
  XCircle,
} from 'lucide-react'
import {
  consume,
  createPc,
  createRw,
  produce,
  readEnter,
  readLeave,
  writeEnter,
  writeLeave,
  type ProducerConsumerState,
  type ReaderWriterState,
} from '../algorithms/synchronization'
import {
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Metric,
  Table,
} from '../components/ui'

export function SyncView() {
  const [capacity, setCapacity] = useState(3)
  const [pc, setPc] = useState<ProducerConsumerState>(() => createPc(3))
  const [rw, setRw] = useState<ReaderWriterState>(() => createRw())
  const [readerId, setReaderId] = useState('R1')
  const [writerId, setWriterId] = useState('W1')
  const [pcMessage, setPcMessage] = useState('')
  const [rwMessage, setRwMessage] = useState('')

  const resetPc = () => {
    try {
      setPc(createPc(capacity))
      setPcMessage('Buffer reset successfully.')
    } catch (error) {
      setPcMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const doProduce = () => {
    const next = produce(pc, 'Producer')
    setPc(next)
    const last = next.log[next.log.length - 1]
    setPcMessage(last?.description ?? 'Produce operation completed.')
  }

  const doConsume = () => {
    const next = consume(pc, 'Consumer')
    setPc(next)
    const last = next.log[next.log.length - 1]
    setPcMessage(last?.description ?? 'Consume operation completed.')
  }

  const doReadEnter = () => {
    if (!readerId.trim()) {
      setRwMessage('Enter a reader ID first.')
      return
    }
    const next = readEnter(rw, readerId.trim())
    setRw(next)
    setRwMessage(next.log[next.log.length - 1]?.description ?? 'Reader operation completed.')
  }

  const doReadLeave = () => {
    if (!readerId.trim()) {
      setRwMessage('Enter a reader ID first.')
      return
    }
    const next = readLeave(rw, readerId.trim())
    setRw(next)
    setRwMessage(next.log[next.log.length - 1]?.description ?? 'Reader operation completed.')
  }

  const doWriteEnter = () => {
    if (!writerId.trim()) {
      setRwMessage('Enter a writer ID first.')
      return
    }
    const next = writeEnter(rw, writerId.trim())
    setRw(next)
    setRwMessage(next.log[next.log.length - 1]?.description ?? 'Writer operation completed.')
  }

  const doWriteLeave = () => {
    if (!writerId.trim()) {
      setRwMessage('Enter a writer ID first.')
      return
    }
    const next = writeLeave(rw, writerId.trim())
    setRw(next)
    setRwMessage(next.log[next.log.length - 1]?.description ?? 'Writer operation completed.')
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#102a3a] via-[#0b1928] to-[#11152a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Workflow size={16} />
              Process Coordination
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Synchronization Lab
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Explore process coordination, shared resources, semaphores,
              critical sections, and blocked operations through interactive
              simulations.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
            <LockKeyhole size={30} />
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Buffer capacity</p>
            <p className="mt-1 text-xl font-bold text-white">{pc.buffer.length}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Occupied slots</p>
            <p className="mt-1 text-xl font-bold text-white">{pc.full}</p>
          </div>

          <div className="col-span-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:col-span-1">
            <p className="text-xs text-slate-500">Active readers</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">{rw.readers.length}</p>
          </div>
        </div>
      </section>

      {/* Producer Consumer */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Producer–Consumer</h3>
            <p className="text-xs text-slate-500">Bounded buffer and semaphore simulation</p>
          </div>
        </div>

        <Card>
          <CardTitle>Buffer Configuration</CardTitle>
          <p className="mb-5 mt-2 text-sm leading-6 text-slate-400">
            Producers add items to free slots. Consumers remove items from
            occupied slots. The empty, full, and mutex semaphore values track
            buffer availability and access.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <Field label="Buffer capacity">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={capacity}
                  onChange={(event) => setCapacity(Number(event.target.value))}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={resetPc}>
                <RotateCcw size={15} />
                Reset Buffer
              </Button>

              <Button onClick={doProduce}>
                <ArrowDownToLine size={15} />
                Produce
              </Button>

              <Button onClick={doConsume}>
                <ArrowUpFromLine size={15} />
                Consume
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Empty Slots" value={String(pc.empty)} />
            <Metric label="Full Slots" value={String(pc.full)} />
            <Metric label="Mutex" value={String(pc.mutex)} />
            <Metric
              label="Waiting Processes"
              value={String(pc.waitingProducers.length + pc.waitingConsumers.length)}
            />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">Buffer State</p>
              <p className="text-xs text-slate-500">
                {pc.full} / {pc.buffer.length} slots occupied
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {pc.buffer.map((cell, index) => {
                const isIn = index === pc.inPtr
                const isOut = index === pc.outPtr

                return (
                  <div
                    key={index}
                    className={`flex min-h-24 flex-col items-center justify-center rounded-xl border p-3 transition ${
                      cell
                        ? 'border-teal-400/30 bg-teal-400/[0.08]'
                        : 'border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Slot {index}
                    </span>

                    <span className={`mt-2 break-all text-sm font-bold ${
                      cell ? 'text-teal-200' : 'text-slate-600'
                    }`}>
                      {cell ?? 'Empty'}
                    </span>

                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {isIn && (
                        <span className="rounded bg-cyan-400/10 px-1.5 py-1 text-[9px] text-cyan-300">
                          IN
                        </span>
                      )}
                      {isOut && (
                        <span className="rounded bg-sky-400/10 px-1.5 py-1 text-[9px] text-sky-300">
                          OUT
                        </span>
                      )}
                      {!isIn && !isOut && (
                        <span className="text-[9px] text-slate-600">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-teal-400" />
                Occupied slot
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                Free slot
              </span>
            </div>
          </div>

          {pcMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-sm text-slate-300">
              <Activity size={16} className="mt-0.5 shrink-0 text-cyan-300" />
              <span className="break-words">{pcMessage}</span>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <Activity size={19} />
            </div>
            <div>
              <CardTitle>Producer–Consumer Event Log</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Operation history and blocked actions
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-auto">
            <Table
              headers={['Step', 'Event', 'Status']}
              rows={pc.log.map((entry) => [
                entry.index + 1,
                entry.description,
                <span
                  key={`pc-status-${entry.index}`}
                  className={`inline-flex items-center gap-1 text-xs ${
                    entry.success ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {entry.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {entry.success ? 'Success' : 'Blocked'}
                </span>,
              ])}
            />
          </div>

          {pc.log.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No operations yet. Select Produce or Consume to begin.
            </p>
          )}
        </Card>
      </section>

      {/* Readers Writers */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Readers–Writers</h3>
            <p className="text-xs text-slate-500">Shared reads and exclusive writes</p>
          </div>
        </div>

        <Card>
          <CardTitle>Critical Section Controls</CardTitle>

          <p className="mb-5 mt-2 text-sm leading-6 text-slate-400">
            Multiple readers may access the shared resource simultaneously.
            Writers require exclusive access. This simulator demonstrates the
            first readers–writers strategy.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reader ID">
              <Input
                value={readerId}
                onChange={(event) => setReaderId(event.target.value)}
                placeholder="R1"
              />
            </Field>

            <Field label="Writer ID">
              <Input
                value={writerId}
                onChange={(event) => setWriterId(event.target.value)}
                placeholder="W1"
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button onClick={doReadEnter}>
              <Users size={15} />
              Reader Enter
            </Button>

            <Button variant="ghost" onClick={doReadLeave}>
              Reader Leave
            </Button>

            <Button onClick={doWriteEnter}>
              <UserRoundPen size={15} />
              Writer Enter
            </Button>

            <Button variant="ghost" onClick={doWriteLeave}>
              Writer Leave
            </Button>
          </div>

          <div className="mt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setRw(createRw())
                setRwMessage('Readers–Writers state reset.')
              }}
            >
              <RotateCcw size={15} />
              Reset Readers–Writers
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Read Count" value={String(rw.readcount)} />
            <Metric label="Writer Lock (wrt)" value={String(rw.wrt)} />
            <Metric label="Active Readers" value={String(rw.readers.length)} />
            <Metric label="Active Writer" value={rw.writer ?? 'None'} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <div className="flex items-center gap-2 text-cyan-300">
                <Users size={17} />
                <p className="text-sm font-semibold">Readers in critical section</p>
              </div>

              {rw.readers.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {rw.readers.map((reader) => (
                    <span
                      key={reader}
                      className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-medium text-cyan-200"
                    >
                      {reader}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No active readers.</p>
              )}
            </div>

            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
              <div className="flex items-center gap-2 text-amber-300">
                <LockKeyhole size={17} />
                <p className="text-sm font-semibold">Writer in critical section</p>
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {rw.writer ?? 'No active writer'}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                A writer needs exclusive access to the shared resource.
              </p>
            </div>
          </div>

          {rwMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-3 text-sm text-slate-300">
              <CircleHelp size={16} className="mt-0.5 shrink-0 text-violet-300" />
              <span className="break-words">{rwMessage}</span>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <CardTitle>Readers–Writers Event Log</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Track critical-section operations and waiting processes
            </p>
          </div>

          <div className="max-h-72 overflow-auto">
            <Table
              headers={['Step', 'Event', 'Waiting Processes']}
              rows={rw.log.map((entry) => [
                entry.index + 1,
                entry.description,
                entry.waiting.join(', ') || '—',
              ])}
            />
          </div>

          {rw.log.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No events yet. Enter a reader or writer ID and run an operation.
            </p>
          )}
        </Card>
      </section>

      {/* Concept guide */}
      <Card>
        <CardTitle>Synchronization Concepts</CardTitle>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
            <p className="font-semibold text-cyan-300">Semaphore</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A synchronization mechanism used to coordinate access to shared
              resources and control how many operations can proceed.
            </p>
          </div>

          <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4">
            <p className="font-semibold text-violet-300">Critical Section</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Code that accesses shared data and needs protection against
              conflicting concurrent operations.
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
            <p className="font-semibold text-amber-300">Process Blocking</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              An operation waits when the required resource or synchronization
              condition is unavailable.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}