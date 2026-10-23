import type { MemoryBlock, MemoryFit, MemoryRequest, MemoryResult } from './types'

function coalesce(blocks: MemoryBlock[]): MemoryBlock[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  const out: MemoryBlock[] = []
  for (const b of sorted) {
    const last = out[out.length - 1]
    if (last && last.type === 'free' && b.type === 'free' && last.start + last.size === b.start) {
      last.size += b.size
    } else {
      out.push({ ...b })
    }
  }
  return out
}

export function holesToBlocks(holes: number[]): MemoryBlock[] {
  const blocks: MemoryBlock[] = []
  let cursor = 0
  holes.forEach((size, i) => {
    if (size <= 0) return
    blocks.push({ id: `hole-${i}`, start: cursor, size, type: 'free' })
    cursor += size
  })
  return blocks
}

function pickHole(blocks: MemoryBlock[], size: number, strategy: MemoryFit): MemoryBlock | null {
  const holes = blocks.filter((b) => b.type === 'free' && b.size >= size)
  if (!holes.length) return null
  if (strategy === 'first') return holes[0]
  if (strategy === 'best') {
    return [...holes].sort((a, b) => a.size - b.size || a.start - b.start)[0]
  }
  return [...holes].sort((a, b) => b.size - a.size || a.start - b.start)[0]
}

export function allocateOne(
  blocks: MemoryBlock[],
  request: MemoryRequest,
  strategy: MemoryFit,
): { blocks: MemoryBlock[]; ok: boolean; reason?: string } {
  if (request.size <= 0) return { blocks, ok: false, reason: 'Request size must be > 0.' }
  const hole = pickHole(blocks, request.size, strategy)
  if (!hole) {
    const free = blocks.filter((b) => b.type === 'free').reduce((s, b) => s + b.size, 0)
    const reason =
      free >= request.size
        ? `External fragmentation: ${free} free units exist but no single hole ≥ ${request.size}.`
        : `Not enough memory: ${free} free, need ${request.size}.`
    return { blocks, ok: false, reason }
  }

  const next: MemoryBlock[] = []
  for (const b of blocks) {
    if (b.start !== hole.start || b.type !== 'free') {
      next.push(b)
      continue
    }
    next.push({
      id: `p-${request.id}`,
      start: b.start,
      size: request.size,
      type: 'process',
      processId: request.id,
    })
    const leftover = b.size - request.size
    if (leftover > 0) {
      next.push({
        id: `hole-${b.start + request.size}`,
        start: b.start + request.size,
        size: leftover,
        type: 'free',
      })
    }
  }
  return { blocks: coalesce(next), ok: true }
}

export function freeProcess(blocks: MemoryBlock[], processId: string): MemoryBlock[] {
  return coalesce(
    blocks.map((b) =>
      b.processId === processId ? { id: `hole-${b.start}`, start: b.start, size: b.size, type: 'free' as const } : b,
    ),
  )
}

export function allocateAll(
  holes: number[],
  requests: MemoryRequest[],
  strategy: MemoryFit,
): MemoryResult {
  if (holes.some((h) => !Number.isFinite(h) || h <= 0)) {
    throw new Error('Each hole size must be a number > 0.')
  }
  let blocks = holesToBlocks(holes)
  const totalSize = holes.reduce((s, h) => s + h, 0)
  const allocations: MemoryResult['allocations'] = []
  const failures: MemoryResult['failures'] = []

  for (const req of requests) {
    if (!req.id.trim()) {
      failures.push({ processId: req.id, size: req.size, reason: 'Process id required.' })
      continue
    }
    if (blocks.some((b) => b.processId === req.id)) {
      failures.push({ processId: req.id, size: req.size, reason: 'Process already allocated.' })
      continue
    }
    const result = allocateOne(blocks, req, strategy)
    blocks = result.blocks
    if (result.ok) {
      const allocated = blocks.find((b) => b.processId === req.id)
      if (allocated) {
        allocations.push({ processId: req.id, start: allocated.start, size: allocated.size })
      }
    } else {
      failures.push({ processId: req.id, size: req.size, reason: result.reason ?? 'Failed' })
    }
  }

  const freeTotal = blocks.filter((b) => b.type === 'free').reduce((s, b) => s + b.size, 0)
  const failedDueToFrag = failures.some((f) => f.reason.includes('External fragmentation'))

  return {
    strategy,
    totalSize,
    blocks,
    allocations,
    failures,
    internalFragmentation: 0,
    externalFragmentation: failedDueToFrag ? freeTotal : 0,
  }
}

export function strategyLabel(s: MemoryFit): string {
  if (s === 'first') return 'First Fit'
  if (s === 'best') return 'Best Fit'
  return 'Worst Fit'
}
