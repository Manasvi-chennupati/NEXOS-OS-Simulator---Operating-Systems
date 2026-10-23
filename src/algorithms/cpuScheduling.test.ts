import { describe, expect, it } from 'vitest'
import { fcfs, priorityNonPreemptive, roundRobin, sjfNonPreemptive, validateProcesses } from './cpuScheduling'
import type { Process } from './types'

const sample: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 3 },
]

describe('CPU scheduling', () => {
  it('rejects empty and invalid processes', () => {
    expect(validateProcesses([])).not.toHaveLength(0)
    expect(
      validateProcesses([{ id: 'A', arrivalTime: -1, burstTime: 0, priority: 1 }]),
    ).toEqual(expect.arrayContaining([expect.stringContaining('arrival'), expect.stringContaining('burst')]))
  })

  it('computes FCFS Gantt and averages', () => {
    const r = fcfs(sample)
    expect(r.gantt.map((s) => [s.processId, s.start, s.end])).toEqual([
      ['P1', 0, 5],
      ['P2', 5, 8],
      ['P3', 8, 16],
      ['P4', 16, 22],
    ])
    expect(r.processes.find((p) => p.id === 'P2')?.waitingTime).toBe(4)
    expect(r.averages.waitingTime).toBe(5.75)
    expect(r.averages.turnaroundTime).toBe(11.25)
    expect(r.cpuUtilization).toBe(100)
  })

  it('runs non-preemptive SJF with idle gaps', () => {
    const r = sjfNonPreemptive([
      { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 1 },
      { id: 'P2', arrivalTime: 2, burstTime: 8, priority: 1 },
      { id: 'P3', arrivalTime: 4, burstTime: 7, priority: 1 },
      { id: 'P4', arrivalTime: 5, burstTime: 3, priority: 1 },
    ])
    expect(r.gantt.map((s) => s.processId)).toEqual(['P1', 'P4', 'P3', 'P2'])
    expect(r.gantt.map((s) => [s.start, s.end])).toEqual([
      [0, 6],
      [6, 9],
      [9, 16],
      [16, 24],
    ])
    expect(r.processes.find((p) => p.id === 'P4')?.waitingTime).toBe(1)
  })

  it('uses lower priority numbers first', () => {
    const r = priorityNonPreemptive(sample)
    expect(r.gantt[0].processId).toBe('P1')
    expect(r.gantt.map((s) => s.processId)).toEqual(['P1', 'P2', 'P4', 'P3'])
  })

  it('round-robins with arrivals during a quantum', () => {
    const r = roundRobin(
      [
        { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
        { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1 },
      ],
      2,
    )
    expect(r.gantt.map((s) => [s.processId, s.start, s.end])).toEqual([
      ['P1', 0, 2],
      ['P2', 2, 4],
      ['P3', 4, 5],
      ['P1', 5, 7],
      ['P2', 7, 8],
      ['P1', 8, 9],
    ])
    expect(r.processes.find((p) => p.id === 'P1')?.waitingTime).toBe(4)
    expect(r.processes.find((p) => p.id === 'P1')?.responseTime).toBe(0)
  })

  it('inserts idle time when the CPU is empty', () => {
    const r = fcfs([
      { id: 'A', arrivalTime: 2, burstTime: 3, priority: 1 },
      { id: 'B', arrivalTime: 10, burstTime: 1, priority: 1 },
    ])
    expect(r.gantt[0]).toEqual({ processId: 'IDLE', start: 0, end: 2 })
    expect(r.gantt.some((s) => s.processId === 'IDLE' && s.start === 5 && s.end === 10)).toBe(true)
    expect(r.idleTime).toBe(7)
  })
})
