import type { GanttSlice } from '../algorithms/types'
import { colorFor } from '../lib/palette'

export function GanttChart({ gantt }: { gantt: GanttSlice[] }) {
  if (!gantt.length) {
    return (
      <p className="text-sm text-slate-500">
        Run a schedule to draw the Gantt chart.
      </p>
    )
  }

  const start = Math.min(...gantt.map((slice) => slice.start))
  const end = Math.max(...gantt.map((slice) => slice.end))
  const span = Math.max(end - start, 1)

  // Select a readable interval depending on the total schedule duration.
  const interval =
    span <= 12 ? 1 : span <= 30 ? 2 : span <= 60 ? 5 : Math.ceil(span / 10)

  const ticks: number[] = []
  for (let t = start; t <= end; t += interval) {
    ticks.push(t)
  }

  if (ticks[ticks.length - 1] !== end) {
    ticks.push(end)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          CPU execution timeline
        </p>
        <p className="font-mono text-xs text-slate-500">
          Total duration: {span} time units
        </p>
      </div>

      {/* Timeline scale */}
      <div className="relative ml-1 h-7">
        {ticks.map((tick) => {
          const left = ((tick - start) / span) * 100
          const isEnd = tick === end
          const isStart = tick === start

          return (
            <div
              key={tick}
              className="absolute top-0 flex h-full flex-col items-center"
              style={{
                left: `${left}%`,
                transform: isStart
                  ? 'translateX(0)'
                  : isEnd
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
              }}
            >
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                {tick}
              </span>
              <span className="mt-1 h-2 w-px bg-slate-500" />
            </div>
          )
        })}
      </div>

      {/* Gantt process blocks */}
      <div className="relative flex min-h-[68px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
        {gantt.map((slice, index) => {
          const duration = slice.end - slice.start
          const width = (duration / span) * 100
          const idle = slice.processId === 'IDLE'

          return (
            <div
              key={`${slice.processId}-${index}-${slice.start}`}
              className={`relative flex min-w-0 flex-col items-center justify-center border-r border-slate-950/50 px-1 py-3 text-center ${
                idle ? 'bg-slate-700 text-slate-200' : 'text-slate-950'
              }`}
              style={{
                width: `${width}%`,
                flexShrink: 0,
                background: idle ? undefined : colorFor(slice.processId),
              }}
              title={`${slice.processId}: ${slice.start} to ${slice.end} (${duration} time units)`}
            >
              <span className="truncate text-xs font-extrabold sm:text-sm">
                {idle ? 'IDLE' : slice.processId}
              </span>
              <span className="mt-1 text-[10px] font-semibold opacity-80">
                {duration} unit{duration === 1 ? '' : 's'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Exact start/end times for every execution slice */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Execution details</span>
          <span>{gantt.length} time slice{gantt.length === 1 ? '' : 's'}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {gantt.map((slice, index) => (
            <div
              key={`${slice.processId}-detail-${index}`}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  background:
                    slice.processId === 'IDLE'
                      ? '#64748b'
                      : colorFor(slice.processId),
                }}
              />
              <span className="text-xs font-semibold text-slate-200">
                {slice.processId}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {slice.start} → {slice.end}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}