import { useEffect, useState } from 'react'
import {
  Database,
  FilePlus2,
  HardDrive,
  Layers3,
  RefreshCw,
  Trash2,
  FolderOpen,
  CircleHelp,
} from 'lucide-react'
import {
  createDisk,
  createFile,
  deleteFile,
  fragmentation,
} from '../algorithms/fileSystem'
import { loadState, saveState } from '../algorithms/persistence'
import type { AllocationMethod, FileSystemState } from '../algorithms/types'
import { colorFor } from '../lib/palette'
import {
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Metric,
  Select,
  Table,
} from '../components/ui'

export function FileSystemView() {
  const stored = loadState<FileSystemState>('fs', createDisk(32, 512))

  const [state, setState] = useState<FileSystemState>(() =>
    stored.occupancy?.length ? stored : createDisk(32, 512),
  )
  const [name, setName] = useState('notes.txt')
  const [size, setSize] = useState(1200)
  const [method, setMethod] = useState<AllocationMethod>('contiguous')
  const [blockCount, setBlockCount] = useState(state.blockCount)
  const [blockSize, setBlockSize] = useState(state.blockSize)
  const [message, setMessage] = useState('Ready to manage files.')

  useEffect(() => {
    saveState('fs', state)
  }, [state])

  const stats = fragmentation(state)

  const handleCreate = () => {
    try {
      const next = createFile(state, name.trim(), size, method)
      setState(next)
      setMessage(`Successfully created "${name.trim()}".`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleDelete = (fileName: string) => {
    try {
      setState(deleteFile(state, fileName))
      setMessage(`Deleted "${fileName}".`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleReinitialize = () => {
    try {
      const next = createDisk(blockCount, blockSize)
      setState(next)
      setMessage('Virtual disk reinitialized successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const loadSamples = () => {
    try {
      let next = createDisk(blockCount, blockSize)
      next = createFile(next, 'kernel.bin', Math.min(2048, blockCount * blockSize), 'contiguous')
      next = createFile(next, 'log.txt', Math.min(700, blockCount * blockSize), 'linked')
      next = createFile(next, 'index.db', Math.min(1600, blockCount * blockSize), 'indexed')
      setState(next)
      setMessage('Sample files loaded.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#102a3a] via-[#0b1928] to-[#11152a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <HardDrive size={15} />
              Storage Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              File System Simulator
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Explore how operating systems allocate disk blocks using
              contiguous, linked, and indexed allocation strategies.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
            <Database size={32} />
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Total blocks</p>
            <p className="mt-1 text-xl font-bold text-white">{state.blockCount}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Block size</p>
            <p className="mt-1 text-xl font-bold text-white">{state.blockSize} B</p>
          </div>

          <div className="col-span-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:col-span-1">
            <p className="text-xs text-slate-500">Files in directory</p>
            <p className="mt-1 text-xl font-bold text-white">{state.files.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Used Blocks" value={String(stats.used)} />
        <Metric label="Free Blocks" value={String(stats.free)} />
        <Metric label="Internal Fragmentation" value={`${stats.internal} B`} />
        <Metric label="Largest Free Run" value={String(stats.largestFreeRun)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle>Virtual Disk Configuration</CardTitle>

          <p className="mb-5 mt-2 text-sm leading-6 text-slate-400">
            Configure the disk geometry. Reinitializing clears all existing
            files and creates a fresh virtual disk.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total blocks">
              <Input
                type="number"
                min={1}
                max={512}
                value={blockCount}
                onChange={(event) => setBlockCount(Number(event.target.value))}
              />
            </Field>

            <Field label="Block size (bytes)">
              <Input
                type="number"
                min={1}
                value={blockSize}
                onChange={(event) => setBlockSize(Number(event.target.value))}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleReinitialize}>
              <RefreshCw size={15} />
              Reinitialize Disk
            </Button>

            <Button variant="ghost" onClick={loadSamples}>
              <Layers3 size={15} />
              Load Samples
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Create a File</CardTitle>

          <p className="mb-5 mt-2 text-sm leading-6 text-slate-400">
            Enter a file name and size, then choose an allocation strategy.
          </p>

          <div className="space-y-4">
            <Field label="File name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="example.txt"
              />
            </Field>

            <Field label="File size (bytes)">
              <Input
                type="number"
                min={1}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
            </Field>

            <Field label="Allocation strategy">
              <Select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as AllocationMethod)
                }
              >
                <option value="contiguous">Contiguous Allocation</option>
                <option value="linked">Linked Allocation</option>
                <option value="indexed">Indexed Allocation</option>
              </Select>
            </Field>

            <div className="w-full">
  <Button onClick={handleCreate}>
    <FilePlus2 size={16} />
    Create File
  </Button>
</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Disk Block Map</CardTitle>

          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
              Allocated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
              Free
            </span>
          </div>
        </div>

        <p className="mb-4 mt-2 text-sm text-slate-400">
          Each cell represents one disk block. Hover over a block to inspect
          its owner and index-block status.
        </p>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12">
          {state.occupancy.map((owner, index) => {
            const file = state.files.find((item) => item.id === owner)
            const isIndex = file?.indexBlock === index

            return (
              <div
                key={index}
                title={
                  owner
                    ? `Block ${index}: ${file?.name ?? 'Allocated'}${isIndex ? ' (index block)' : ''}`
                    : `Block ${index}: Free`
                }
                className="group relative flex aspect-square min-h-12 flex-col items-center justify-center rounded-lg border font-mono transition hover:-translate-y-0.5 hover:brightness-125"
                style={{
                  background: owner ? `${colorFor(owner)}22` : '#111c2b',
                  borderColor: owner ? colorFor(owner) : '#263447',
                  color: owner ? colorFor(owner) : '#64748b',
                }}
              >
                <span className="text-xs font-semibold">{index}</span>
                <span className="mt-0.5 text-[9px]">
                  {owner ? (isIndex ? 'INDEX' : 'USED') : 'FREE'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.files.map((file) => (
            <div
              key={file.id}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: colorFor(file.id) }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{file.method}</p>
              </div>

              <p className="shrink-0 text-xs text-slate-400">
                {file.blocks.length} blocks
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
            <FolderOpen size={20} />
          </div>

          <div>
            <CardTitle>File Directory</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Files currently stored on the virtual disk
            </p>
          </div>
        </div>

        <Table
          headers={['File Name', 'Size', 'Allocation', 'Block Mapping', 'Action']}
          rows={state.files.map((file) => [
            file.name,
            `${file.sizeBytes} B`,
            file.method,
            file.method === 'indexed'
              ? `Index ${file.indexBlock} → ${file.blocks.join(', ')}`
              : file.method === 'linked'
                ? file.blocks.join(' → ')
                : file.blocks.length
                  ? `${file.blocks[0]}–${file.blocks[file.blocks.length - 1]}`
                  : '—',
            <Button
              key={`delete-${file.id}`}
              variant="danger"
              onClick={() => handleDelete(file.name)}
            >
              <Trash2 size={14} />
              Delete
            </Button>,
          ])}
        />

        {state.files.length === 0 && (
          <div className="py-10 text-center">
            <FolderOpen className="mx-auto mb-3 text-slate-600" size={30} />
            <p className="text-sm font-medium text-slate-300">
              No files on disk yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Create a file or load the sample directory to get started.
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <CircleHelp size={18} className="mt-0.5 shrink-0 text-cyan-300" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200">System Message</p>
          <p className="mt-1 break-words text-sm text-slate-400">{message}</p>
        </div>
      </div>

      <Card>
        <CardTitle>Allocation Strategies</CardTitle>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
            <p className="font-semibold text-cyan-300">Contiguous</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Stores a file in consecutive blocks. Simple to access, but
              finding a sufficiently large free run can be difficult.
            </p>
          </div>

          <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4">
            <p className="font-semibold text-violet-300">Linked</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Stores file blocks anywhere on disk and links them together.
              It avoids requiring consecutive blocks.
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
            <p className="font-semibold text-amber-300">Indexed</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Uses an index block to reference a file's data blocks. The
              index block also consumes disk space.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}