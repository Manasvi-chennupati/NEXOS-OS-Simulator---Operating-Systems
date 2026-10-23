import type { GanttSlice, Process, ProcessMetrics, ScheduleResult } from './types'

const IDLE = 'IDLE'

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

function byId(a: Process, b: Process): number {
  return a.id.localeCompare(b.id)
}

export function validateProcesses(processes: Process[]): string[] {
  const errors: string[] = []
  if (processes.length === 0) errors.push('Add at least one process.')
  const seen = new Set<string>()
  for (const p of processes) {
    if (!p.id.trim()) errors.push('Process id cannot be empty.')
    if (seen.has(p.id)) errors.push(`Duplicate process id: ${p.id}`)
    seen.add(p.id)
    if (!Number.isFinite(p.arrivalTime) || p.arrivalTime < 0) {
      errors.push(`${p.id}: arrival time must be a number ≥ 0.`)
    }
    if (!Number.isFinite(p.burstTime) || p.burstTime <= 0) {
      errors.push(`${p.id}: burst time must be a number > 0.`)
    }
    if (!Number.isFinite(p.priority)) {
      errors.push(`${p.id}: priority must be a number (lower = higher priority).`)
    }
  }
  return errors
}

export function buildScheduleResult(
  algorithm: string,
  processes: Process[],
  gantt: GanttSlice[],
): ScheduleResult {
  const firstStart = new Map<string, number>()
  const completion = new Map<string, number>()
  let idleTime = 0

  for (const slice of gantt) {
    if (slice.end < slice.start) {
      throw new Error('Invalid Gantt slice: end < start')
    }
    if (slice.processId === IDLE) {
      idleTime += slice.end - slice.start
      continue
    }
    if (!firstStart.has(slice.processId)) firstStart.set(slice.processId, slice.start)
    completion.set(slice.processId, slice.end)
  }

  const metrics: ProcessMetrics[] = processes.map((p) => {
    const ct = completion.get(p.id)
    const rs = firstStart.get(p.id)
    if (ct === undefined || rs === undefined) {
      throw new Error(`Process ${p.id} never ran`)
    }
    const turnaroundTime = ct - p.arrivalTime
    const waitingTime = turnaroundTime - p.burstTime
    const responseTime = rs - p.arrivalTime
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: ct,
      turnaroundTime,
      waitingTime,
      responseTime,
    }
  })

  const n = metrics.length || 1
  const lastEnd = gantt.length ? gantt[gantt.length - 1].end : 0
  const totalTime = lastEnd
  const busy = metrics.reduce((s, m) => s + m.burstTime, 0)

  return {
    algorithm,
    gantt,
    processes: metrics,
    averages: {
      waitingTime: round4(metrics.reduce((s, m) => s + m.waitingTime, 0) / n),
      turnaroundTime: round4(metrics.reduce((s, m) => s + m.turnaroundTime, 0) / n),
      responseTime: round4(metrics.reduce((s, m) => s + m.responseTime, 0) / n),
    },
    cpuUtilization: totalTime === 0 ? 0 : round4((busy / totalTime) * 100),
    throughput: totalTime === 0 ? 0 : round4(metrics.length / totalTime),
    totalTime,
    idleTime: round4(idleTime),
  }
}

function pushSlice(gantt: GanttSlice[], processId: string, start: number, end: number) {
  if (end <= start) return
  const last = gantt[gantt.length - 1]
  if (last && last.processId === processId && last.end === start) {
    last.end = end
    return
  }
  gantt.push({ processId, start, end })
}

export function fcfs(processes: Process[]): ScheduleResult {
  const ordered = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || byId(a, b))
  const gantt: GanttSlice[] = []
  let time = 0
  for (const p of ordered) {
    if (time < p.arrivalTime) {
      pushSlice(gantt, IDLE, time, p.arrivalTime)
      time = p.arrivalTime
    }
    pushSlice(gantt, p.id, time, time + p.burstTime)
    time += p.burstTime
  }
  return buildScheduleResult('FCFS', processes, gantt)
}

function nonPreemptive(
  algorithm: string,
  processes: Process[],
  compare: (a: Process, b: Process) => number,
): ScheduleResult {
  const remaining = [...processes]
  const gantt: GanttSlice[] = []
  let time = 0

  while (remaining.length) {
    const ready = remaining.filter((p) => p.arrivalTime <= time)
    if (ready.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime))
      pushSlice(gantt, IDLE, time, nextArrival)
      time = nextArrival
      continue
    }
    ready.sort(compare)
    const chosen = ready[0]
    const idx = remaining.findIndex((p) => p.id === chosen.id)
    remaining.splice(idx, 1)
    pushSlice(gantt, chosen.id, time, time + chosen.burstTime)
    time += chosen.burstTime
  }
  return buildScheduleResult(algorithm, processes, gantt)
}

export function sjfNonPreemptive(processes: Process[]): ScheduleResult {
  return nonPreemptive(
    'SJF (non-preemptive)',
    processes,
    (a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || byId(a, b),
  )
}

export function priorityNonPreemptive(processes: Process[]): ScheduleResult {
  return nonPreemptive(
    'Priority (non-preemptive)',
    processes,
    (a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || byId(a, b),
  )
}

export function roundRobin(processes: Process[], quantum: number): ScheduleResult {
  if (!Number.isFinite(quantum) || quantum <= 0) {
    throw new Error('Time quantum must be > 0.')
  }
  const remaining = new Map(processes.map((p) => [p.id, p.burstTime]))
  const arrivals = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || byId(a, b))
  const gantt: GanttSlice[] = []
  const queue: Process[] = []
  const inQueue = new Set<string>()
  let time = 0
  let i = 0
  let completed = 0

  const enqueueArrived = () => {
    while (i < arrivals.length && arrivals[i].arrivalTime <= time) {
      const p = arrivals[i]
      if ((remaining.get(p.id) ?? 0) > 0 && !inQueue.has(p.id)) {
        queue.push(p)
        inQueue.add(p.id)
      }
      i += 1
    }
  }

  if (arrivals.length) time = arrivals[0].arrivalTime
  enqueueArrived()

  while (completed < processes.length) {
    if (queue.length === 0) {
      if (i >= arrivals.length) break
      if (time < arrivals[i].arrivalTime) {
        pushSlice(gantt, IDLE, time, arrivals[i].arrivalTime)
        time = arrivals[i].arrivalTime
      }
      enqueueArrived()
      continue
    }

    const p = queue.shift()!
    inQueue.delete(p.id)
    const left = remaining.get(p.id) ?? 0
    const run = Math.min(quantum, left)
    const start = time
    time += run
    remaining.set(p.id, left - run)
    pushSlice(gantt, p.id, start, time)
    enqueueArrived()

    if ((remaining.get(p.id) ?? 0) === 0) {
      completed += 1
    } else if (!inQueue.has(p.id)) {
      queue.push(p)
      inQueue.add(p.id)
    }
  }

  return buildScheduleResult('Round Robin', processes, gantt)
}

export type CpuAlgorithm = 'FCFS' | 'SJF' | 'PRIORITY' | 'RR'

export function runCpu(
  algorithm: CpuAlgorithm,
  processes: Process[],
  quantum = 2,
): ScheduleResult {
  const errors = validateProcesses(processes)
  if (errors.length) throw new Error(errors.join(' '))
  switch (algorithm) {
    case 'FCFS':
      return fcfs(processes)
    case 'SJF':
      return sjfNonPreemptive(processes)
    case 'PRIORITY':
      return priorityNonPreemptive(processes)
    case 'RR':
      return roundRobin(processes, quantum)
  }
}
