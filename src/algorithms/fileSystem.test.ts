import { describe, expect, it } from 'vitest'
import { createDisk, createFile, deleteFile, fragmentation } from './fileSystem'

describe('virtual file system', () => {
  it('allocates contiguous runs and reports external fragmentation when they break', () => {
    let s = createDisk(10, 100)
    s = createFile(s, 'a', 300, 'contiguous')
    s = createFile(s, 'b', 200, 'contiguous')
    expect(s.files[0].blocks).toEqual([0, 1, 2])
    s = deleteFile(s, 'a')
    s = createFile(s, 'c', 600, 'contiguous')
    expect(s.lastMessage).toMatch(/fragmentation/i)
    const f = fragmentation(s)
    expect(f.free).toBe(8)
    expect(f.largestFreeRun).toBe(5)
  })

  it('linked allocation can use non-contiguous free blocks', () => {
    let s = createDisk(6, 50)
    s = createFile(s, 'a', 100, 'contiguous')
    s = createFile(s, 'b', 50, 'contiguous')
    s = deleteFile(s, 'a')
    s = createFile(s, 'c', 150, 'linked')
    expect(s.files.find((f) => f.name === 'c')?.blocks).toEqual([0, 1, 3])
  })

  it('indexed allocation reserves an index block', () => {
    let s = createDisk(5, 100)
    s = createFile(s, 'idx', 200, 'indexed')
    const f = s.files[0]
    expect(f.indexBlock).toBe(0)
    expect(f.blocks).toEqual([1, 2])
    expect(s.occupancy.filter(Boolean)).toHaveLength(3)
  })
})
