import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Clock3,
  Cpu,
  GitCompareArrows,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  runCpu,
  validateProcesses,
  type CpuAlgorithm,
} from '../algorithms/cpuScheduling'
import { loadState, saveState } from '../algorithms/persistence'
import { sampleProcesses } from '../algorithms/samples'
import type { Process, ScheduleResult } from '../algorithms/types'
import { GanttChart } from '../components/GanttChart'
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

const ALGOS: { id: CpuAlgorithm; label: string }[] = [
  { id: 'FCFS', label: 'First Come First Serve' },
  { id: 'SJF', label: 'Shortest Job First' },
  { id: 'PRIORITY', label: 'Priority Scheduling' },
  { id: 'RR', label: 'Round Robin' },
]

type Stored = {
  processes: Process[]
  algorithm: CpuAlgorithm
  quantum: number
}

export function CpuView() {
  const initial = loadState<Stored>('cpu', {
    processes: sampleProcesses,
    algorithm: 'FCFS',
    quantum: 2,
  })

  const [processes, setProcesses] = useState<Process[]>(initial.processes)
  const [algorithm, setAlgorithm] = useState<CpuAlgorithm>(initial.algorithm)
  const [quantum, setQuantum] = useState(initial.quantum)
  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [compare, setCompare] = useState<ScheduleResult[] | null>(null)

  useEffect(() => {
    saveState('cpu', { processes, algorithm, quantum })
  }, [processes, algorithm, quantum])

  function update(i: number, patch: Partial<Process>) {
    setProcesses((rows) =>
      rows.map((row, index) => (index === i ? { ...row, ...patch } : row)),
    )
    setResult(null)
    setCompare(null)
  }

  function simulate() {
    const errs = validateProcesses(processes)

    if (algorithm === 'RR' && (!Number.isFinite(quantum) || quantum <= 0)) {
      errs.push('Quantum must be greater than zero.')
    }

    setErrors(errs)
    setCompare(null)

    if (errs.length) {
      setResult(null)
      return
    }

    setResult(runCpu(algorithm, processes, quantum))
  }

  function runCompare() {
    const errs = validateProcesses(processes)

    if (!Number.isFinite(quantum) || quantum <= 0) {
      errs.push('Quantum must be greater than zero for Round Robin comparison.')
    }

    setErrors(errs)

    if (errs.length) return

    setResult(null)
    setCompare(
      (['FCFS', 'SJF', 'PRIORITY', 'RR'] as CpuAlgorithm[]).map((item) =>
        runCpu(item, processes, quantum),
      ),
    )
  }

  function addProcess() {
    setProcesses((rows) => [
      ...rows,
      {
        id: `P${rows.length + 1}`,
        arrivalTime: rows.length,
        burstTime: 4,
        priority: rows.length + 1,
      },
    ])
    setResult(null)
    setCompare(null)
    setErrors([])
  }

  function resetProcesses() {
    setProcesses(sampleProcesses)
    setResult(null)
    setCompare(null)
    setErrors([])
  }

  const chartData = useMemo(
    () =>
      result?.processes.map((process) => ({
        id: process.id,
        waiting: process.waitingTime,
        turnaround: process.turnaroundTime,
      })) ?? [],
    [result],
  )

  return (
    <div className="space-y-6 pb-8">
      {/* Page introduction */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101e30] via-[#0c1726] to-[#102b31] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
              <Cpu size={14} />
              Process management
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              CPU Scheduling
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Configure processes, execute scheduling algorithms, and analyze
              waiting time, turnaround time, and CPU utilization.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-300">
              <Activity size={23} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {processes.length} processes
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Ready for simulation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process configuration */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Process configuration</CardTitle>
            <p className="mt-1 text-xs text-slate-400">
              Edit process values before running the simulation.
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            {processes.length} configured
          </span>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <Field label="Scheduling algorithm">
            <Select
              value={algorithm}
              onChange={(event) => {
                setAlgorithm(event.target.value as CpuAlgorithm)
                setResult(null)
                setCompare(null)
              }}
            >
              {ALGOS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Time quantum (Round Robin)">
            <Input
              type="number"
              min={1}
              value={quantum}
              onChange={(event) => {
                setQuantum(Number(event.target.value))
                setResult(null)
                setCompare(null)
              }}
            />
          </Field>
        </div>

        <div className="mb-3 hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
          <span>Process ID</span>
          <span>Arrival time</span>
          <span>Burst time</span>
          <span>Priority</span>
          <span className="w-16">Action</span>
        </div>

        <div className="space-y-3">
          {processes.map((process, index) => (
            <div
              key={`${index}-${process.id}`}
              className="grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end"
            >
              <Field label="Process ID">
                <Input
                  value={process.id}
                  onChange={(event) =>
                    update(index, { id: event.target.value })
                  }
                />
              </Field>

              <Field label="Arrival time">
                <Input
                  type="number"
                  min={0}
                  value={process.arrivalTime}
                  onChange={(event) =>
                    update(index, { arrivalTime: Number(event.target.value) })
                  }
                />
              </Field>

              <Field label="Burst time">
                <Input
                  type="number"
                  min={1}
                  value={process.burstTime}
                  onChange={(event) =>
                    update(index, { burstTime: Number(event.target.value) })
                  }
                />
              </Field>

              <Field label="Priority (lower = higher)">
                <Input
                  type="number"
                  value={process.priority}
                  onChange={(event) =>
                    update(index, { priority: Number(event.target.value) })
                  }
                />
              </Field>

              <Button
                variant="ghost"
                onClick={() => {
                  setProcesses((rows) =>
                    rows.filter((_, rowIndex) => rowIndex !== index),
                  )
                  setResult(null)
                  setCompare(null)
                  setErrors([])
                }}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={addProcess}>
            <Plus size={16} />
            Add process
          </Button>

          <Button variant="ghost" onClick={resetProcesses}>
            <RotateCcw size={15} />
            Load sample
          </Button>

          <Button onClick={simulate}>
            <Play size={15} />
            Run schedule
          </Button>

          <Button variant="ghost" onClick={runCompare}>
            <GitCompareArrows size={16} />
            Compare algorithms
          </Button>
        </div>

        <div className="mt-4">
          <ErrorBanner errors={errors} />
        </div>
      </Card>

      {/* Simulation results */}
      {result && (
        <>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-cyan-300" />
            <h3 className="text-lg font-bold text-slate-100">
              Simulation results
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric
              label="Average waiting time"
              value={String(result.averages.waitingTime)}
            />
            <Metric
              label="Average turnaround time"
              value={String(result.averages.turnaroundTime)}
            />
            <Metric
              label="Average response time"
              value={String(result.averages.responseTime)}
            />
            <Metric
              label="CPU utilization"
              value={`${result.cpuUtilization}%`}
              hint={`Idle time: ${result.idleTime}`}
            />
            <Metric
              label="Throughput"
              value={String(result.throughput)}
              hint={`${result.processes.length} / ${result.totalTime} time units`}
            />
          </div>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={18} className="text-cyan-300" />
              <div>
                <CardTitle>Execution timeline</CardTitle>
                <p className="mt-1 text-xs text-slate-400">
                  Gantt chart · {result.algorithm}
                </p>
              </div>
            </div>

            <GanttChart gantt={result.gantt} />
          </Card>

          {/* Per-process performance — one table only */}
          <Card>
            <CardTitle>Per-process performance</CardTitle>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              Completion, turnaround, waiting, and response times.
            </p>

            <div className="overflow-x-auto">
              <Table
                headers={[
                  'Process ID',
                  'Arrival Time (AT)',
                  'Burst Time (BT)',
                  'Completion Time (CT)',
                  'Turnaround (TAT)',
                  'Waiting (WT)',
                  'Response (RT)',
                ]}
                rows={result.processes.map((process) => [
                  process.id,
                  process.arrivalTime,
                  process.burstTime,
                  process.completionTime,
                  process.turnaroundTime,
                  process.waitingTime,
                  process.responseTime,
                ])}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  label: 'AT — Arrival Time',
                  description: 'When a process enters the ready queue.',
                },
                {
                  label: 'BT — Burst Time',
                  description: 'CPU execution time required by the process.',
                },
                {
                  label: 'CT — Completion Time',
                  description: 'The time at which the process finishes execution.',
                },
                {
                  label: 'TAT — Turnaround Time',
                  description:
                    'Total time from arrival to completion. TAT = CT − AT.',
                },
                {
                  label: 'WT — Waiting Time',
                  description:
                    'Time spent waiting for CPU execution. WT = TAT − BT.',
                },
                {
                  label: 'RT — Response Time',
                  description:
                    'Time from arrival until the process first gets CPU time.',
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                >
                  <p className="text-xs font-semibold text-cyan-300">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-300" />
              <div>
                <CardTitle>Waiting vs turnaround time</CardTitle>
                <p className="mt-1 text-xs text-slate-400">
                  Compare each process in time units.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="id" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: '#0b1520',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Bar
                    dataKey="waiting"
                    name="Waiting time"
                    fill="#3ee0c2"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="turnaround"
                    name="Turnaround time"
                    fill="#f0b429"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* Algorithm comparison */}
      {compare && (
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">
              <GitCompareArrows size={20} />
            </div>
            <div>
              <CardTitle>Algorithm comparison</CardTitle>
              <p className="mt-1 text-xs text-slate-400">
                Same process set, four scheduling strategies.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              headers={[
                'Algorithm',
                'Avg Waiting Time',
                'Avg Turnaround',
                'Avg Response',
                'CPU %',
                'Makespan',
              ]}
              rows={compare.map((item) => [
                item.algorithm,
                item.averages.waitingTime,
                item.averages.turnaroundTime,
                item.averages.responseTime,
                item.cpuUtilization,
                item.totalTime,
              ])}
            />
          </div>

          <div className="mt-6 space-y-6">
            {compare.map((item) => (
              <div
                key={item.algorithm}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Zap size={15} className="text-amber-300" />
                  {item.algorithm}
                </p>
                <GanttChart gantt={item.gantt} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {!result && !compare && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
          <div className="rounded-2xl bg-cyan-300/[0.08] p-4 text-cyan-300">
            <Users size={27} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-200">
            Ready to schedule
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            Choose a scheduling algorithm and run the simulation to explore
            process execution and performance metrics.
          </p>
        </div>
      )}
    </div>
  )
}