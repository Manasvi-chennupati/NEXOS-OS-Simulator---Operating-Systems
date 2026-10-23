export type Process = {
  id: string
  arrivalTime: number
  burstTime: number
  priority: number
}

export type GanttSlice = {
  processId: string
  start: number
  end: number
}

export type ProcessMetrics = {
  id: string
  arrivalTime: number
  burstTime: number
  priority: number
  completionTime: number
  turnaroundTime: number
  waitingTime: number
  responseTime: number
}

export type ScheduleResult = {
  algorithm: string
  gantt: GanttSlice[]
  processes: ProcessMetrics[]
  averages: {
    waitingTime: number
    turnaroundTime: number
    responseTime: number
  }
  cpuUtilization: number
  throughput: number
  totalTime: number
  idleTime: number
}

export type MemoryBlock = {
  id: string
  start: number
  size: number
  type: 'free' | 'process'
  processId?: string
}

export type MemoryRequest = {
  id: string
  size: number
}

export type MemoryFit = 'first' | 'best' | 'worst'

export type MemoryResult = {
  strategy: MemoryFit
  totalSize: number
  blocks: MemoryBlock[]
  allocations: { processId: string; start: number; size: number }[]
  failures: { processId: string; size: number; reason: string }[]
  internalFragmentation: number
  externalFragmentation: number
}

export type PageStep = {
  index: number
  page: number
  frames: (number | null)[]
  fault: boolean
  replaced: number | null
}

export type PageResult = {
  algorithm: 'FIFO' | 'LRU'
  frameCount: number
  referenceString: number[]
  steps: PageStep[]
  faults: number
  hits: number
  faultRatio: number
  hitRatio: number
}

export type BankersProcess = {
  id: string
  allocation: number[]
  max: number[]
}

export type BankersSnapshot = {
  processCount: number
  resourceCount: number
  available: number[]
  processes: BankersProcess[]
  need: number[][]
  safe: boolean
  safeSequence: string[]
  workTrace: { processId: string; work: number[] }[]
  message: string
}

export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN'

export type DiskResult = {
  algorithm: DiskAlgorithm
  startHead: number
  maxCylinder: number
  direction: 'up' | 'down'
  sequence: number[]
  movements: { from: number; to: number; distance: number }[]
  totalSeek: number
  averageSeek: number
  estimatedTime: number
}

export type AllocationMethod = 'contiguous' | 'linked' | 'indexed'

export type FsFile = {
  id: string
  name: string
  sizeBytes: number
  method: AllocationMethod
  blocks: number[]
  indexBlock?: number
}

export type FileSystemState = {
  blockCount: number
  blockSize: number
  occupancy: (string | null)[]
  files: FsFile[]
  lastMessage: string
}

export type SyncOp =
  | { actor: 'producer'; action: 'produce'; item: string }
  | { actor: 'consumer'; action: 'consume' }
  | { actor: string; action: 'read-enter' | 'read-leave' | 'write-enter' | 'write-leave' }

export type PcStep = {
  index: number
  description: string
  buffer: (string | null)[]
  inPtr: number
  outPtr: number
  mutex: number
  empty: number
  full: number
  blocked: string[]
  success: boolean
}

export type RwStep = {
  index: number
  description: string
  readers: string[]
  writer: string | null
  mutex: number
  wrt: number
  readcount: number
  waiting: string[]
  success: boolean
}
