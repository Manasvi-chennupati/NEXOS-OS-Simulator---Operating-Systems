import type { BankersProcess, MemoryRequest, Process } from './types'

export const sampleProcesses: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 3 },
]

export const sampleSjfProcesses: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 6, priority: 3 },
  { id: 'P2', arrivalTime: 2, burstTime: 8, priority: 1 },
  { id: 'P3', arrivalTime: 4, burstTime: 7, priority: 2 },
  { id: 'P4', arrivalTime: 5, burstTime: 3, priority: 4 },
]

export const sampleHoles = [100, 500, 200, 300, 600]

export const sampleMemoryRequests: MemoryRequest[] = [
  { id: 'P1', size: 212 },
  { id: 'P2', size: 417 },
  { id: 'P3', size: 112 },
  { id: 'P4', size: 426 },
]

export const sampleReferenceString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]

export const sampleAvailable = [3, 3, 2]

export const sampleBankers: BankersProcess[] = [
  { id: 'P0', allocation: [0, 1, 0], max: [7, 5, 3] },
  { id: 'P1', allocation: [2, 0, 0], max: [3, 2, 2] },
  { id: 'P2', allocation: [3, 0, 2], max: [9, 0, 2] },
  { id: 'P3', allocation: [2, 1, 1], max: [2, 2, 2] },
  { id: 'P4', allocation: [0, 0, 2], max: [4, 3, 3] },
]

export const sampleDiskRequests = [98, 183, 37, 122, 14, 124, 65, 67]
