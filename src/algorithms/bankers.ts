
import type { BankersProcess, BankersSnapshot } from './types'

function vecLeq(a: number[], b: number[]): boolean {
  return a.every((v, i) => v <= b[i])
}

function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i])
}

function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i])
}

export function needMatrix(processes: BankersProcess[]): number[][] {
  return processes.map((p) => vecSub(p.max, p.allocation))
}

export function validateBankers(
  available: number[],
  processes: BankersProcess[],
): string[] {
  const errors: string[] = []

  if (available.length === 0) {
    errors.push('At least one resource type is required.')
  }

  if (available.some((n) => !Number.isInteger(n) || n < 0)) {
    errors.push('Available must be integers ≥ 0.')
  }

  const m = available.length
  const ids = new Set<string>()

  for (const p of processes) {
    if (!p.id.trim()) {
      errors.push('Process id required.')
    }

    if (ids.has(p.id)) {
      errors.push(`Duplicate id ${p.id}`)
    }

    ids.add(p.id)

    if (p.allocation.length !== m || p.max.length !== m) {
      errors.push(
        `${p.id}: allocation/max length must match resource count (${m}).`,
      )
      continue
    }

    if (
      p.allocation.some((n) => !Number.isInteger(n) || n < 0) ||
      p.max.some((n) => !Number.isInteger(n) || n < 0)
    ) {
      errors.push(
        `${p.id}: allocation and max must be integers ≥ 0.`,
      )
    }

    if (p.allocation.some((n, i) => n > p.max[i])) {
      errors.push(`${p.id}: allocation cannot exceed max.`)
    }
  }

  return errors
}

export function safetyCheck(
  available: number[],
  processes: BankersProcess[],
): BankersSnapshot {
  const errors = validateBankers(available, processes)

  if (errors.length) {
    throw new Error(errors.join(' '))
  }

  const need = needMatrix(processes)
  const work = [...available]
  const finish = processes.map(() => false)
  const safeSequence: string[] = []
  const workTrace: { processId: string; work: number[] }[] = []

  let progressed = true

  while (progressed) {
    progressed = false

    for (let i = 0; i < processes.length; i++) {
      if (finish[i]) continue
      if (!vecLeq(need[i], work)) continue

      const next = vecAdd(work, processes[i].allocation)

      for (let j = 0; j < work.length; j++) {
        work[j] = next[j]
      }

      finish[i] = true
      safeSequence.push(processes[i].id)

      workTrace.push({
        processId: processes[i].id,
        work: [...work],
      })

      progressed = true
    }
  }

  const safe = finish.every(Boolean)

  return {
    processCount: processes.length,
    resourceCount: available.length,
    available: [...available],
    processes,
    need,
    safe,
    safeSequence,
    workTrace,
    message: safe
      ? `System is in a safe state. One safe sequence is ${safeSequence.join(' → ')}.`
      : `System is NOT safe. Finished ${safeSequence.join(', ') || '(none)'} before no process could proceed.`,
  }
}

export function requestResources(
  available: number[],
  processes: BankersProcess[],
  processId: string,
  request: number[],
): BankersSnapshot {
  const base = safetyCheck(available, processes)

  const idx = processes.findIndex((p) => p.id === processId)

  if (idx === -1) {
    return {
      ...base,
      safe: false,
      message: `Unknown process ${processId}.`,
    }
  }

  const need = base.need[idx]

  if (request.length !== available.length) {
    return {
      ...base,
      safe: false,
      message: 'Request vector length mismatch.',
    }
  }

  if (request.some((n) => !Number.isInteger(n) || n < 0)) {
    return {
      ...base,
      safe: false,
      message: 'Request must be integers ≥ 0.',
    }
  }

  if (!vecLeq(request, need)) {
    return {
      ...base,
      safe: false,
      message: `${processId} requested more than its remaining need ${need.join(', ')}.`,
    }
  }

  if (!vecLeq(request, available)) {
    return {
      ...base,
      safe: false,
      message: `Not enough available resources. Available = [${available.join(', ')}]. Process must wait.`,
    }
  }

  const nextAvailable = vecSub(available, request)

  const nextProcesses = processes.map((proc, i) =>
    i === idx
      ? {
          ...proc,
          allocation: vecAdd(proc.allocation, request),
        }
      : proc,
  )

  const check = safetyCheck(nextAvailable, nextProcesses)

  if (!check.safe) {
    return {
      ...check,
      available,
      processes,
      need: base.need,
      safe: false,
      message: `Request by ${processId} would leave the system unsafe and is refused.`,
    }
  }

  return {
    ...check,
    message: `Request by ${processId} is granted. New available = [${check.available.join(', ')}]. Safe sequence: ${check.safeSequence.join(' → ')}.`,
  }
}
