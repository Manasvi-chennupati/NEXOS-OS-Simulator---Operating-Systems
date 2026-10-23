import type { PcStep, RwStep } from './types'

export type ProducerConsumerState = {
  capacity: number
  buffer: (string | null)[]
  inPtr: number
  outPtr: number
  mutex: number
  empty: number
  full: number
  waitingProducers: string[]
  waitingConsumers: string[]
  itemSeq: number
  log: PcStep[]
}

export function createPc(capacity: number): ProducerConsumerState {
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('Buffer capacity must be an integer > 0.')
  const state: ProducerConsumerState = {
    capacity,
    buffer: Array.from({ length: capacity }, () => null),
    inPtr: 0,
    outPtr: 0,
    mutex: 1,
    empty: capacity,
    full: 0,
    waitingProducers: [],
    waitingConsumers: [],
    itemSeq: 1,
    log: [],
  }
  pushPc(state, 'Initialized empty buffer.', true)
  return state
}

function snapshotPc(state: ProducerConsumerState, description: string, success: boolean): PcStep {
  return {
    index: state.log.length,
    description,
    buffer: [...state.buffer],
    inPtr: state.inPtr,
    outPtr: state.outPtr,
    mutex: state.mutex,
    empty: state.empty,
    full: state.full,
    blocked: [...state.waitingProducers.map((p) => `P:${p}`), ...state.waitingConsumers.map((c) => `C:${c}`)],
    success,
  }
}

function pushPc(state: ProducerConsumerState, description: string, success: boolean) {
  state.log.push(snapshotPc(state, description, success))
}

function doProduce(state: ProducerConsumerState, who: string, item: string) {
  state.empty -= 1
  state.mutex -= 1
  state.buffer[state.inPtr] = item
  state.inPtr = (state.inPtr + 1) % state.capacity
  state.mutex += 1
  state.full += 1
  pushPc(state, `${who} produced "${item}" (wait empty, wait mutex, signal mutex, signal full).`, true)
  wakeConsumer(state)
}

function doConsume(state: ProducerConsumerState, who: string) {
  state.full -= 1
  state.mutex -= 1
  const item = state.buffer[state.outPtr]
  state.buffer[state.outPtr] = null
  state.outPtr = (state.outPtr + 1) % state.capacity
  state.mutex += 1
  state.empty += 1
  pushPc(state, `${who} consumed "${item}" (wait full, wait mutex, signal mutex, signal empty).`, true)
  wakeProducer(state)
}

function wakeProducer(state: ProducerConsumerState) {
  if (state.waitingProducers.length && state.empty > 0) {
    const who = state.waitingProducers.shift()!
    const item = `item-${state.itemSeq++}`
    doProduce(state, `${who} (woken)`, item)
  }
}

function wakeConsumer(state: ProducerConsumerState) {
  if (state.waitingConsumers.length && state.full > 0) {
    const who = state.waitingConsumers.shift()!
    doConsume(state, `${who} (woken)`)
  }
}

export function produce(state: ProducerConsumerState, who = 'Producer'): ProducerConsumerState {
  const next: ProducerConsumerState = {
    ...state,
    buffer: [...state.buffer],
    waitingProducers: [...state.waitingProducers],
    waitingConsumers: [...state.waitingConsumers],
    log: [...state.log],
  }
  if (next.empty === 0) {
    if (!next.waitingProducers.includes(who)) next.waitingProducers.push(who)
    pushPc(next, `${who} blocked on empty (buffer full).`, false)
    return next
  }
  const item = `item-${next.itemSeq++}`
  doProduce(next, who, item)
  return next
}

export function consume(state: ProducerConsumerState, who = 'Consumer'): ProducerConsumerState {
  const next: ProducerConsumerState = {
    ...state,
    buffer: [...state.buffer],
    waitingProducers: [...state.waitingProducers],
    waitingConsumers: [...state.waitingConsumers],
    log: [...state.log],
  }
  if (next.full === 0) {
    if (!next.waitingConsumers.includes(who)) next.waitingConsumers.push(who)
    pushPc(next, `${who} blocked on full (buffer empty).`, false)
    return next
  }
  doConsume(next, who)
  return next
}

export type ReaderWriterState = {
  mutex: number
  wrt: number
  readcount: number
  readers: string[]
  writer: string | null
  waitingReaders: string[]
  waitingWriters: string[]
  log: RwStep[]
}

export function createRw(): ReaderWriterState {
  const state: ReaderWriterState = {
    mutex: 1,
    wrt: 1,
    readcount: 0,
    readers: [],
    writer: null,
    waitingReaders: [],
    waitingWriters: [],
    log: [],
  }
  pushRw(state, 'Initialized first readers-writers semaphores (mutex=1, wrt=1, readcount=0).', true)
  return state
}

function snapshotRw(state: ReaderWriterState, description: string, success: boolean): RwStep {
  return {
    index: state.log.length,
    description,
    readers: [...state.readers],
    writer: state.writer,
    mutex: state.mutex,
    wrt: state.wrt,
    readcount: state.readcount,
    waiting: [...state.waitingReaders.map((r) => `R:${r}`), ...state.waitingWriters.map((w) => `W:${w}`)],
    success,
  }
}

function pushRw(state: ReaderWriterState, description: string, success: boolean) {
  state.log.push(snapshotRw(state, description, success))
}

function cloneRw(state: ReaderWriterState): ReaderWriterState {
  return {
    ...state,
    readers: [...state.readers],
    waitingReaders: [...state.waitingReaders],
    waitingWriters: [...state.waitingWriters],
    log: [...state.log],
  }
}

function admitReader(state: ReaderWriterState, who: string) {
  state.mutex -= 1
  state.readcount += 1
  if (state.readcount === 1) state.wrt -= 1
  state.readers.push(who)
  state.mutex += 1
  pushRw(state, `${who} entered as reader (readcount=${state.readcount}, wrt=${state.wrt}).`, true)
}

function admitWriter(state: ReaderWriterState, who: string) {
  state.wrt -= 1
  state.writer = who
  pushRw(state, `${who} entered as writer (wrt=0).`, true)
}

function wakeAfterLastReader(state: ReaderWriterState) {
  if (state.waitingWriters.length) {
    const w = state.waitingWriters.shift()!
    admitWriter(state, `${w}`)
  }
}

function wakeAfterWriter(state: ReaderWriterState) {
  if (state.waitingReaders.length) {
    const waiting = [...state.waitingReaders]
    state.waitingReaders = []
    for (const r of waiting) admitReader(state, r)
  } else if (state.waitingWriters.length) {
    const w = state.waitingWriters.shift()!
    admitWriter(state, w)
  }
}

export function readEnter(state: ReaderWriterState, who: string): ReaderWriterState {
  const next = cloneRw(state)
  if (next.writer) {
    if (!next.waitingReaders.includes(who)) next.waitingReaders.push(who)
    pushRw(next, `${who} blocked: writer ${next.writer} holds wrt.`, false)
    return next
  }
  admitReader(next, who)
  return next
}

export function readLeave(state: ReaderWriterState, who: string): ReaderWriterState {
  const next = cloneRw(state)
  const idx = next.readers.indexOf(who)
  if (idx === -1) {
    pushRw(next, `${who} cannot leave: not in critical section.`, false)
    return next
  }
  next.readers.splice(idx, 1)
  next.mutex -= 1
  next.readcount -= 1
  if (next.readcount === 0) next.wrt += 1
  next.mutex += 1
  pushRw(next, `${who} left reading (readcount=${next.readcount}, wrt=${next.wrt}).`, true)
  if (next.readcount === 0) wakeAfterLastReader(next)
  return next
}

export function writeEnter(state: ReaderWriterState, who: string): ReaderWriterState {
  const next = cloneRw(state)
  if (next.writer || next.readers.length > 0) {
    if (!next.waitingWriters.includes(who)) next.waitingWriters.push(who)
    pushRw(
      next,
      `${who} blocked: ${next.writer ? `writer ${next.writer} active` : `${next.readers.length} reader(s) active`}.`,
      false,
    )
    return next
  }
  admitWriter(next, who)
  return next
}

export function writeLeave(state: ReaderWriterState, who: string): ReaderWriterState {
  const next = cloneRw(state)
  if (next.writer !== who) {
    pushRw(next, `${who} cannot leave: is not the active writer.`, false)
    return next
  }
  next.writer = null
  next.wrt += 1
  pushRw(next, `${who} finished writing (wrt=1). Waiting readers are preferred.`, true)
  wakeAfterWriter(next)
  return next
}
