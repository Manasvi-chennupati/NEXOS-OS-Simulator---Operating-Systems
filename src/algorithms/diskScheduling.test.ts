import { describe, expect, it } from 'vitest'
import { diskCscan, diskFcfs, diskScan, diskSstf } from './diskScheduling'

const req = [98, 183, 37, 122, 14, 124, 65, 67]

describe('disk scheduling', () => {
  it('FCFS follows the request order', () => {
    const r = diskFcfs(req, 53, 199)
    expect(r.sequence).toEqual(req)
    expect(r.totalSeek).toBe(640)
  })

  it('SSTF always picks the closest pending request', () => {
    const r = diskSstf(req, 53, 199)
    expect(r.sequence).toEqual([65, 67, 37, 14, 98, 122, 124, 183])
    expect(r.totalSeek).toBe(236)
  })

  it('SCAN goes to the end before reversing', () => {
    const r = diskScan(req, 53, 199, 'up')
    expect(r.sequence).toEqual([65, 67, 98, 122, 124, 183, 199, 37, 14])
    expect(r.totalSeek).toBe(331)
  })

  it('C-SCAN jumps to the other end', () => {
    const r = diskCscan(req, 53, 199, 'up')
    expect(r.sequence).toEqual([65, 67, 98, 122, 124, 183, 199, 0, 14, 37])
    expect(r.totalSeek).toBe(382)
  })
})
