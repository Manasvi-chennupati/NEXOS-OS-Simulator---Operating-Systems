import { describe, expect, it } from 'vitest'
import { fifoPages, lruPages } from './pageReplacement'

const refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]

describe('page replacement', () => {
  it('counts 15 FIFO faults for the classic 3-frame string', () => {
    const r = fifoPages(3, refs)
    expect(r.faults).toBe(15)
    expect(r.hits).toBe(5)
    expect(r.steps[0]).toMatchObject({ page: 7, fault: true, frames: [7, null, null] })
    expect(r.steps[3].replaced).toBe(7)
  })

  it('counts 12 LRU faults for the same string', () => {
    const r = lruPages(3, refs)
    expect(r.faults).toBe(12)
    expect(r.hitRatio).toBe(0.4)
  })

  it('does not evict on a hit', () => {
    const r = fifoPages(2, [1, 1, 1])
    expect(r.faults).toBe(1)
    expect(r.steps.every((s, i) => (i === 0 ? s.fault : !s.fault))).toBe(true)
  })
})
