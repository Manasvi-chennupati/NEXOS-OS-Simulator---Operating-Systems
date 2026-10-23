import { useEffect, useState } from 'react'
import { requestResources, safetyCheck } from '../algorithms/bankers'
import { loadState, saveState } from '../algorithms/persistence'
import { sampleAvailable, sampleBankers } from '../algorithms/samples'
import type { BankersProcess, BankersSnapshot } from '../algorithms/types'
import { Button, Card, CardTitle, ErrorBanner, Field, Input, Metric, Select, Table } from '../components/ui'

export function BankersView() {
  const stored = loadState<{ available: string; processes: BankersProcess[] }>('bankers', {
    available: sampleAvailable.join(' '),
    processes: sampleBankers,
  })
  const [availableText, setAvailableText] = useState(stored.available)
  const [processes, setProcesses] = useState<BankersProcess[]>(stored.processes)
  const [pid, setPid] = useState(stored.processes[0]?.id ?? 'P0')
  const [reqText, setReqText] = useState('1 0 2')
  const [errors, setErrors] = useState<string[]>([])
  const [snap, setSnap] = useState<BankersSnapshot | null>(null)

  useEffect(() => {
    saveState('bankers', { available: availableText, processes })
  }, [availableText, processes])

  function parseVec(text: string): number[] {
    return text
      .trim()
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
  }

  function runSafety() {
    try {
      setErrors([])
      setSnap(safetyCheck(parseVec(availableText), processes))
    } catch (e) {
      setSnap(null)
      setErrors([e instanceof Error ? e.message : String(e)])
    }
  }

  function runRequest() {
    try {
      setErrors([])
      setSnap(requestResources(parseVec(availableText), processes, pid, parseVec(reqText)))
    } catch (e) {
      setSnap(null)
      setErrors([e instanceof Error ? e.message : String(e)])
    }
  }

  function patch(i: number, field: 'allocation' | 'max', text: string) {
    const vec = parseVec(text)
    setProcesses((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: vec } : r)))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Resource snapshot</CardTitle>
        <p className="mb-3 text-sm text-slate-400">
          Need = Max − Allocation. A process can finish if Need ≤ Work. Granting a request is allowed only if the
          pretend-allocate state is still safe.
        </p>
        <Field label="Available vector">
          <Input value={availableText} onChange={(e) => setAvailableText(e.target.value)} />
        </Field>
        <div className="mt-3">
          <Table
            headers={['PID', 'Allocation', 'Max', '']}
            rows={processes.map((p, i) => [
              <Input key="id" value={p.id} onChange={(e) => setProcesses((rows) => rows.map((r, idx) => (idx === i ? { ...r, id: e.target.value } : r)))} />,
              <Input key="a" defaultValue={p.allocation.join(' ')} onBlur={(e) => patch(i, 'allocation', e.target.value)} />,
              <Input key="m" defaultValue={p.max.join(' ')} onBlur={(e) => patch(i, 'max', e.target.value)} />,
              <Button key="rm" variant="ghost" onClick={() => setProcesses((rows) => rows.filter((_, idx) => idx !== i))}>
                Remove
              </Button>,
            ])}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              setProcesses((rows) => {
                const m = parseVec(availableText).length || 3
                return [...rows, { id: `P${rows.length}`, allocation: Array(m).fill(0), max: Array(m).fill(1) }]
              })
            }
          >
            Add process
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setAvailableText(sampleAvailable.join(' '))
              setProcesses(sampleBankers)
            }}
          >
            Load textbook sample
          </Button>
          <Button onClick={runSafety}>Check safety</Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Process for request">
            <Select value={pid} onChange={(e) => setPid(e.target.value)}>
              {processes.map((p) => (
                <option key={p.id}>{p.id}</option>
              ))}
            </Select>
          </Field>
          <Field label="Request vector">
            <Input value={reqText} onChange={(e) => setReqText(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button onClick={runRequest}>Try request</Button>
          </div>
        </div>
        <div className="mt-3">
          <ErrorBanner errors={errors} />
        </div>
      </Card>

      {snap ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Safe?" value={snap.safe ? 'YES' : 'NO'} />
            <Metric label="Processes" value={String(snap.processCount)} />
            <Metric label="Resources" value={String(snap.resourceCount)} />
          </div>
          <Card>
            <p className="text-sm text-slate-200">{snap.message}</p>
            <div className="mt-3">
              <Table
                headers={['PID', 'Allocation', 'Max', 'Need']}
                rows={snap.processes.map((p, i) => [p.id, p.allocation.join(' '), p.max.join(' '), snap.need[i].join(' ')])}
              />
            </div>
            {snap.workTrace.length ? (
              <ol className="mt-3 list-decimal pl-5 text-sm text-slate-400">
                {snap.workTrace.map((t) => (
                  <li key={t.processId + t.work.join(',')}>
                    After {t.processId} finishes, Work = [{t.work.join(', ')}]
                  </li>
                ))}
              </ol>
            ) : null}
          </Card>
        </>
      ) : null}
    </div>
  )
}
