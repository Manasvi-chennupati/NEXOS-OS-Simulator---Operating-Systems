import type { PageResult, PageStep } from './types'

function ratios(faults: number, n: number) {
  if (n === 0) return { faultRatio: 0, hitRatio: 0, hits: 0 }
  const hits = n - faults
  return {
    hits,
    faultRatio: Math.round((faults / n) * 10000) / 10000,
    hitRatio: Math.round((hits / n) * 10000) / 10000,
  }
}

export function validatePaging(frameCount: number, referenceString: number[]): string[] {
  const errors: string[] = []
  if (!Number.isInteger(frameCount) || frameCount <= 0) errors.push('Frame count must be an integer > 0.')
  if (referenceString.length === 0) errors.push('Reference string cannot be empty.')
  if (referenceString.some((p) => !Number.isInteger(p) || p < 0)) {
    errors.push('Pages must be integers ≥ 0.')
  }
  return errors
}

export function fifoPages(frameCount: number, referenceString: number[]): PageResult {
  const errors = validatePaging(frameCount, referenceString)
  if (errors.length) throw new Error(errors.join(' '))

  const frames: (number | null)[] = Array.from({ length: frameCount }, () => null)
  const insertion: number[] = []
  const steps: PageStep[] = []
  let faults = 0

  referenceString.forEach((page, index) => {
    const hit = frames.includes(page)
    let replaced: number | null = null
    if (!hit) {
      faults += 1
      const empty = frames.indexOf(null)
      if (empty !== -1) {
        frames[empty] = page
        insertion.push(page)
      } else {
        const victim = insertion.shift()!
        const vi = frames.indexOf(victim)
        replaced = victim
        frames[vi] = page
        insertion.push(page)
      }
    }
    steps.push({ index, page, frames: [...frames], fault: !hit, replaced })
  })

  return { algorithm: 'FIFO', frameCount, referenceString, steps, faults, ...ratios(faults, referenceString.length) }
}

export function lruPages(frameCount: number, referenceString: number[]): PageResult {
  const errors = validatePaging(frameCount, referenceString)
  if (errors.length) throw new Error(errors.join(' '))

  const frames: (number | null)[] = Array.from({ length: frameCount }, () => null)
  const lastUsed = new Map<number, number>()
  const steps: PageStep[] = []
  let faults = 0

  referenceString.forEach((page, index) => {
    const hit = frames.includes(page)
    let replaced: number | null = null
    if (!hit) {
      faults += 1
      const empty = frames.indexOf(null)
      if (empty !== -1) {
        frames[empty] = page
      } else {
        let victim = frames[0] as number
        let oldest = Infinity
        for (const f of frames) {
          if (f === null) continue
          const used = lastUsed.get(f) ?? -1
          if (used < oldest) {
            oldest = used
            victim = f
          }
        }
        replaced = victim
        frames[frames.indexOf(victim)] = page
      }
    }
    lastUsed.set(page, index)
    steps.push({ index, page, frames: [...frames], fault: !hit, replaced })
  })

  return { algorithm: 'LRU', frameCount, referenceString, steps, faults, ...ratios(faults, referenceString.length) }
}
