import { describe, expect, it } from 'vitest'
import { allocateAll } from './memoryAllocation'

const holes = [100, 500, 200, 300, 600]
const requests = [
  { id: 'P1', size: 212 },
  { id: 'P2', size: 417 },
  { id: 'P3', size: 112 },
  { id: 'P4', size: 426 },
]

describe('memory allocation', () => {
  it('first fit uses the lowest-address hole that is large enough', () => {
    const r = allocateAll(holes, requests, 'first')
    expect(r.allocations.find((a) => a.processId === 'P1')).toEqual({ processId: 'P1', start: 100, size: 212 })
    expect(r.allocations.find((a) => a.processId === 'P2')?.start).toBe(312)
    expect(r.failures).toHaveLength(0)
  })

  it('best fit uses the smallest adequate hole on the first placement', () => {
    const r = allocateAll(holes, requests, 'best')
    expect(r.allocations.find((a) => a.processId === 'P1')?.start).toBe(800)
    expect(r.allocations.find((a) => a.processId === 'P2')?.start).toBe(1012)
    expect(r.failures).toHaveLength(0)
  })

  it('worst fit uses the largest hole first', () => {
    const r = allocateAll(holes, requests, 'worst')
    expect(r.allocations.find((a) => a.processId === 'P1')?.start).toBe(1100)
    expect(r.allocations).toHaveLength(4)
  })

  it('reports external fragmentation when free space is split', () => {
    const r = allocateAll(
      [50, 200, 50],
      [
        { id: 'A', size: 200 },
        { id: 'B', size: 40 },
        { id: 'C', size: 40 },
        { id: 'D', size: 15 },
      ],
      'first',
    )
    expect(r.failures[0]?.processId).toBe('D')
    expect(r.failures[0]?.reason).toMatch(/External fragmentation/i)
    expect(r.externalFragmentation).toBe(20)
  })
})
