import { describe, expect, it } from 'vitest'
import { consume, createPc, createRw, produce, readEnter, readLeave, writeEnter, writeLeave } from './synchronization'

describe('producer-consumer', () => {
  it('fills, blocks on full, then wakes after consume', () => {
    let s = createPc(2)
    s = produce(s, 'P')
    s = produce(s, 'P')
    expect(s.full).toBe(2)
    s = produce(s, 'P')
    expect(s.waitingProducers).toContain('P')
    s = consume(s, 'C')
    expect(s.waitingProducers).toHaveLength(0)
    expect(s.full).toBe(2)
  })

  it('blocks consume on empty', () => {
    let s = createPc(1)
    s = consume(s, 'C')
    expect(s.waitingConsumers).toContain('C')
    s = produce(s, 'P')
    expect(s.buffer.every((c) => c === null)).toBe(true)
    expect(s.waitingConsumers).toHaveLength(0)
  })
})

describe('readers-writers', () => {
  it('allows concurrent readers and blocks a writer', () => {
    let s = createRw()
    s = readEnter(s, 'R1')
    s = readEnter(s, 'R2')
    expect(s.readcount).toBe(2)
    s = writeEnter(s, 'W1')
    expect(s.waitingWriters).toContain('W1')
    s = readLeave(s, 'R1')
    expect(s.writer).toBeNull()
    s = readLeave(s, 'R2')
    expect(s.writer).toBe('W1')
  })

  it('prefers waiting readers after a writer leaves', () => {
    let s = createRw()
    s = writeEnter(s, 'W1')
    s = readEnter(s, 'R1')
    s = readEnter(s, 'R2')
    s = writeLeave(s, 'W1')
    expect(s.writer).toBeNull()
    expect(s.readers).toEqual(['R1', 'R2'])
  })
})
