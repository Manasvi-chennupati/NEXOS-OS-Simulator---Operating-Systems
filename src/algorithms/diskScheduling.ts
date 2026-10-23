import type { DiskAlgorithm, DiskResult } from './types'

export function validateDisk(
  requests: number[],
  startHead: number,
  maxCylinder: number,
): string[] {
  const errors: string[] = []
  if (requests.length === 0) errors.push('Add at least one disk request.')
  if (!Number.isInteger(maxCylinder) || maxCylinder <= 0) errors.push('Max cylinder must be an integer > 0.')
  if (!Number.isInteger(startHead) || startHead < 0 || startHead > maxCylinder) {
    errors.push(`Start head must be an integer between 0 and ${maxCylinder}.`)
  }
  for (const r of requests) {
    if (!Number.isInteger(r) || r < 0 || r > maxCylinder) {
      errors.push(`Request ${r} is outside 0..${maxCylinder}.`)
    }
  }
  return errors
}

function toResult(
  algorithm: DiskAlgorithm,
  startHead: number,
  maxCylinder: number,
  direction: 'up' | 'down',
  path: number[],
  seekPerCylinder: number,
): DiskResult {
  const sequence = path
  const movements: DiskResult['movements'] = []
  let from = startHead
  let totalSeek = 0
  for (const to of path) {
    const distance = Math.abs(to - from)
    movements.push({ from, to, distance })
    totalSeek += distance
    from = to
  }
  const avgDenom = Math.max(1, path.length)
  return {
    algorithm,
    startHead,
    maxCylinder,
    direction,
    sequence,
    movements,
    totalSeek,
    averageSeek: Math.round((totalSeek / avgDenom) * 10000) / 10000,
    estimatedTime: Math.round(totalSeek * seekPerCylinder * 10000) / 10000,
  }
}

export function diskFcfs(
  requests: number[],
  startHead: number,
  maxCylinder: number,
  seekPerCylinder = 1,
): DiskResult {
  return toResult('FCFS', startHead, maxCylinder, 'up', [...requests], seekPerCylinder)
}

export function diskSstf(
  requests: number[],
  startHead: number,
  maxCylinder: number,
  seekPerCylinder = 1,
): DiskResult {
  const pending = [...requests]
  const path: number[] = []
  let head = startHead
  while (pending.length) {
    pending.sort((a, b) => Math.abs(a - head) - Math.abs(b - head) || a - b)
    const next = pending.shift()!
    path.push(next)
    head = next
  }
  return toResult('SSTF', startHead, maxCylinder, 'up', path, seekPerCylinder)
}

export function diskScan(
  requests: number[],
  startHead: number,
  maxCylinder: number,
  direction: 'up' | 'down',
  seekPerCylinder = 1,
): DiskResult {
  const unique = [...requests]
  const up = unique.filter((r) => r >= startHead).sort((a, b) => a - b)
  const down = unique.filter((r) => r < startHead).sort((a, b) => b - a)
  const path: number[] = []
  if (direction === 'up') {
    path.push(...up)
    if (down.length) {
      if (path[path.length - 1] !== maxCylinder && startHead !== maxCylinder) path.push(maxCylinder)
      path.push(...down)
    }
  } else {
    path.push(...down)
    if (up.length) {
      if (path[path.length - 1] !== 0 && startHead !== 0) path.push(0)
      path.push(...up)
    }
  }
  return toResult('SCAN', startHead, maxCylinder, direction, path, seekPerCylinder)
}

export function diskCscan(
  requests: number[],
  startHead: number,
  maxCylinder: number,
  direction: 'up' | 'down',
  seekPerCylinder = 1,
): DiskResult {
  const unique = [...requests]
  const path: number[] = []
  if (direction === 'up') {
    const up = unique.filter((r) => r >= startHead).sort((a, b) => a - b)
    const wrap = unique.filter((r) => r < startHead).sort((a, b) => a - b)
    path.push(...up)
    if (wrap.length) {
      if (path[path.length - 1] !== maxCylinder) path.push(maxCylinder)
      path.push(0)
      path.push(...wrap)
    }
  } else {
    const down = unique.filter((r) => r <= startHead).sort((a, b) => b - a)
    const wrap = unique.filter((r) => r > startHead).sort((a, b) => b - a)
    path.push(...down)
    if (wrap.length) {
      if (path[path.length - 1] !== 0) path.push(0)
      path.push(maxCylinder)
      path.push(...wrap)
    }
  }
  return toResult('C-SCAN', startHead, maxCylinder, direction, path, seekPerCylinder)
}

export function runDisk(
  algorithm: DiskAlgorithm,
  requests: number[],
  startHead: number,
  maxCylinder: number,
  direction: 'up' | 'down',
  seekPerCylinder = 1,
): DiskResult {
  const errors = validateDisk(requests, startHead, maxCylinder)
  if (errors.length) throw new Error(errors.join(' '))
  switch (algorithm) {
    case 'FCFS':
      return diskFcfs(requests, startHead, maxCylinder, seekPerCylinder)
    case 'SSTF':
      return diskSstf(requests, startHead, maxCylinder, seekPerCylinder)
    case 'SCAN':
      return diskScan(requests, startHead, maxCylinder, direction, seekPerCylinder)
    case 'C-SCAN':
      return diskCscan(requests, startHead, maxCylinder, direction, seekPerCylinder)
  }
}
