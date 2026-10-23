import type { AllocationMethod, FileSystemState, FsFile } from './types'

export function createDisk(blockCount: number, blockSize: number): FileSystemState {
  if (!Number.isInteger(blockCount) || blockCount <= 0) throw new Error('Block count must be an integer > 0.')
  if (!Number.isInteger(blockSize) || blockSize <= 0) throw new Error('Block size must be an integer > 0.')
  return {
    blockCount,
    blockSize,
    occupancy: Array.from({ length: blockCount }, () => null),
    files: [],
    lastMessage: `Initialized ${blockCount} blocks of ${blockSize} bytes (${blockCount * blockSize} bytes).`,
  }
}

function neededDataBlocks(sizeBytes: number, blockSize: number): number {
  return Math.ceil(sizeBytes / blockSize)
}

function freeIndexes(state: FileSystemState): number[] {
  return state.occupancy.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0)
}

function firstContiguousRun(state: FileSystemState, need: number): number[] | null {
  let run: number[] = []
  for (let i = 0; i < state.occupancy.length; i++) {
    if (state.occupancy[i] === null) {
      run.push(i)
      if (run.length === need) return run
    } else {
      run = []
    }
  }
  return null
}

export function createFile(
  state: FileSystemState,
  name: string,
  sizeBytes: number,
  method: AllocationMethod,
): FileSystemState {
  const trimmed = name.trim()
  if (!trimmed) return { ...state, lastMessage: 'File name is required.' }
  if (state.files.some((f) => f.name === trimmed)) {
    return { ...state, lastMessage: `File "${trimmed}" already exists.` }
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ...state, lastMessage: 'File size must be > 0 bytes.' }
  }

  const dataBlocks = neededDataBlocks(sizeBytes, state.blockSize)
  const extra = method === 'indexed' ? 1 : 0
  const free = freeIndexes(state)
  if (free.length < dataBlocks + extra) {
    return {
      ...state,
      lastMessage: `Not enough free blocks. Need ${dataBlocks + extra}, have ${free.length}.`,
    }
  }

  let blocks: number[] = []
  let indexBlock: number | undefined
  const occupancy = [...state.occupancy]
  const id = `${trimmed}-${Date.now()}`

  if (method === 'contiguous') {
    const run = firstContiguousRun(state, dataBlocks)
    if (!run) {
      const freeCount = free.length
      return {
        ...state,
        lastMessage: `Contiguous allocation failed. ${freeCount} free blocks exist but they are not consecutive (external fragmentation).`,
      }
    }
    blocks = run
  } else if (method === 'linked') {
    blocks = free.slice(0, dataBlocks)
  } else {
    indexBlock = free[0]
    blocks = free.slice(1, 1 + dataBlocks)
    occupancy[indexBlock] = id
  }

  for (const b of blocks) occupancy[b] = id
  const file: FsFile = { id, name: trimmed, sizeBytes, method, blocks, indexBlock }
  return {
    ...state,
    occupancy,
    files: [...state.files, file],
    lastMessage: `Created "${trimmed}" using ${method} allocation on blocks ${describeFile(file)}.`,
  }
}

function describeFile(file: FsFile): string {
  if (file.method === 'contiguous') {
    const a = file.blocks[0]
    const b = file.blocks[file.blocks.length - 1]
    return `${a}–${b}`
  }
  if (file.method === 'indexed') {
    return `index ${file.indexBlock} → [${file.blocks.join(', ')}]`
  }
  return file.blocks.join(' → ')
}

export function deleteFile(state: FileSystemState, name: string): FileSystemState {
  const file = state.files.find((f) => f.name === name)
  if (!file) return { ...state, lastMessage: `No file named "${name}".` }
  const occupancy = state.occupancy.map((v) => (v === file.id ? null : v))
  return {
    ...state,
    occupancy,
    files: state.files.filter((f) => f.id !== file.id),
    lastMessage: `Deleted "${name}" and freed ${file.blocks.length + (file.indexBlock !== undefined ? 1 : 0)} block(s).`,
  }
}

export function fragmentation(state: FileSystemState): {
  used: number
  free: number
  internal: number
  largestFreeRun: number
  freeRuns: number
} {
  let used = 0
  let free = 0
  let internal = 0
  let run = 0
  let largest = 0
  let freeRuns = 0
  for (const cell of state.occupancy) {
    if (cell === null) {
      free += 1
      run += 1
      largest = Math.max(largest, run)
    } else {
      used += 1
      if (run > 0) freeRuns += 1
      run = 0
    }
  }
  if (run > 0) freeRuns += 1
  for (const f of state.files) {
    const occupied = f.blocks.length * state.blockSize
    internal += occupied - f.sizeBytes
  }
  return { used, free, internal, largestFreeRun: largest, freeRuns }
}
