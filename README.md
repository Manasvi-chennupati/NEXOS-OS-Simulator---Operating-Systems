# NEXOS — An Interactive Operating System Simulation and Visualization Platform

NEXOS is a college-level Operating Systems lab that runs entirely in the browser. CPU, memory, paging, deadlock avoidance, disk, file-system, and synchronization algorithms are implemented as TypeScript modules. The UI only renders what those modules compute.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Recharts (disk path, CPU bars) and SVG/CSS (Gantt, memory, blocks)
- Lucide React
- Vitest + Testing Library

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm test          # unit + UI smoke tests
npm run build     # production bundle (tsc + vite)
npm run preview   # serve the production build
```

Use Node.js 20 or newer.

## What each module does

| Module | Algorithms / model | Output |
| --- | --- | --- |
| CPU scheduling | FCFS, non-preemptive SJF, non-preemptive Priority (lower number = higher priority), Round Robin | Gantt chart, CT/TAT/WT/RT, averages, CPU utilization, throughput, compare-all |
| Memory | First Fit, Best Fit, Worst Fit on a hole list | Address map, placement, external fragmentation, free/coalesce |
| Paging | FIFO, LRU | Per-step frames, faults, hit/fault ratios |
| Deadlock | Banker's safety + resource request | Need matrix, Work trace, grant/refuse |
| Disk | FCFS, SSTF, SCAN, C-SCAN | Head path, total/average seek, time = seek × ms per cylinder |
| File system | Contiguous, linked, indexed | Block map, directory, internal fragmentation, largest free run |
| Sync | Producer-Consumer (empty/full/mutex), first Readers-Writers | Live buffer/CS, blocked queues, wakeup |

Inputs persist in `localStorage` under the `nexos:` prefix so a refresh keeps the last process table, hole list, and similar forms.

## Sample data

Each screen has a **Load sample** (or equivalent) button. CPU/paging/disk/Banker's samples match common textbook traces (Silberschatz / Galvin style). After loading, press the run button — the charts are not pre-baked.

## Project layout

```
src/algorithms/   # pure functions + Vitest tests
src/views/        # one screen per OS topic
src/components/   # layout, Gantt, memory map, disk chart, form widgets
```

## Honest limitations

- There is no SRTF, preemptive priority, multilevel queue, or MLFQ scheduler.
- SCAN/C-SCAN travel to the disk end (0 or max) only when requests remain on the opposite side; if every remaining request is already in the current direction, the arm stops at the last request (LOOK-like).
- Memory uses variable partitions from the hole list you enter, not paging-with-segmentation or buddy allocation.
- The virtual file system models block allocation only: no directories beyond a flat table, no inode timestamps, no crash recovery.
- Synchronization is a discrete click-step semaphore model, not preemptive threads or a real race detector.
- Banker's request simulation shows whether a request *would* be granted; it does not mutate the form until you copy the new vectors yourself.
- Persistence is local to the browser. Clearing site data resets saved forms.
- This is a teaching simulator, not an operating system.

## Tests

`npm test` executes known traces, including:

- FCFS waiting-time average 5.75 on the four-process sample
- Non-preemptive SJF order P1 → P4 → P3 → P2
- FIFO 15 faults / LRU 12 faults on the 20-page, 3-frame reference string
- Banker's safe sequence P1 → P3 → P4 → P0 → P2
- Disk totals 640 (FCFS), 236 (SSTF), 331 (SCAN), 382 (C-SCAN) for the 53/199 sample
