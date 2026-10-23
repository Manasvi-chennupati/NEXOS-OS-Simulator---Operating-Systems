import { describe, expect, it } from 'vitest'
import { needMatrix, requestResources, safetyCheck } from './bankers'
import { sampleAvailable, sampleBankers } from './samples'

describe("Banker's algorithm", () => {
  it('builds Need = Max − Allocation', () => {
    expect(needMatrix(sampleBankers)[0]).toEqual([7, 4, 3])
    expect(needMatrix(sampleBankers)[1]).toEqual([1, 2, 2])
  })

  it('finds a safe sequence for the textbook snapshot', () => {
    const r = safetyCheck(sampleAvailable, sampleBankers)
    expect(r.safe).toBe(true)
    expect(r.safeSequence).toEqual(['P1', 'P3', 'P4', 'P0', 'P2'])
  })

  it('grants a request that stays safe', () => {
    const r = requestResources(sampleAvailable, sampleBankers, 'P1', [1, 0, 2])
    expect(r.safe).toBe(true)
    expect(r.message).toMatch(/granted/i)
    expect(r.available).toEqual([2, 3, 0])
  })

  it('refuses a request that exceeds need', () => {
    const r = requestResources(sampleAvailable, sampleBankers, 'P1', [2, 0, 0])
    expect(r.safe).toBe(false)
    expect(r.message).toMatch(/need/i)
  })
})
