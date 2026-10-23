import type { MemoryBlock } from '../algorithms/types'
import { colorFor } from '../lib/palette'

export function MemoryMap({ blocks, totalSize }: { blocks: MemoryBlock[]; totalSize: number }) {
  if (!blocks.length) return <p className="text-sm text-slate-500">No memory layout yet.</p>
  return (
    <div className="space-y-2">
      <div className="flex h-20 overflow-hidden rounded-xl border border-slate-800">
        {blocks.map((b) => (
          <div
            key={`${b.type}-${b.start}`}
            className="flex flex-col items-center justify-center border-r border-slate-950 px-1 text-center text-[10px] font-medium"
            style={{
              width: `${(b.size / totalSize) * 100}%`,
              background: b.type === 'free' ? '#1b2738' : colorFor(b.processId ?? b.id),
              color: b.type === 'free' ? '#8aa0b8' : '#082018',
              minWidth: '2rem',
            }}
            title={`${b.type} @ ${b.start}, size ${b.size}`}
          >
            <span>{b.type === 'free' ? 'Hole' : b.processId}</span>
            <span className="font-mono">
              {b.start}–{b.start + b.size - 1}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Addresses 0 … {totalSize - 1}</p>
    </div>
  )
}
