import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Cpu,
  Database,
  FolderTree,
  HardDrive,
  Layers,
  LockKeyhole,
  MemoryStick,
  Search,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ViewId } from '../components/Layout'
import { Card } from '../components/ui'

type Module = {
  id: ViewId
  title: string
  description: string
  category: string
  algorithms: string[]
  icon: LucideIcon
  color: string
}

const MODULES: Module[] = [
  {
    id: 'cpu',
    title: 'CPU Scheduling',
    description:
      'Visualize how processes compete for CPU time and compare scheduling strategies.',
    category: 'Process Management',
    algorithms: ['FCFS', 'SJF', 'SRTF', 'Priority', 'Round Robin'],
    icon: Cpu,
    color: 'violet',
  },
  {
    id: 'memory',
    title: 'Memory Allocation',
    description:
      'Explore memory blocks, allocation strategies, and external fragmentation.',
    category: 'Memory Management',
    algorithms: ['First Fit', 'Best Fit', 'Worst Fit'],
    icon: MemoryStick,
    color: 'cyan',
  },
  {
    id: 'paging',
    title: 'Page Replacement',
    description:
      'Track page faults and see how replacement policies manage limited frames.',
    category: 'Memory Management',
    algorithms: ['FIFO', 'LRU', 'Optimal'],
    icon: Layers,
    color: 'blue',
  },
  {
    id: 'deadlock',
    title: "Banker's Algorithm",
    description:
      'Analyze resource allocation and determine whether a system is in a safe state.',
    category: 'Process Management',
    algorithms: ["Banker's Algorithm", 'Safe Sequence', 'Resource Requests'],
    icon: LockKeyhole,
    color: 'amber',
  },
  {
    id: 'disk',
    title: 'Disk Scheduling',
    description:
      'Visualize disk-head movement and compare total seek distances.',
    category: 'Storage Management',
    algorithms: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'],
    icon: HardDrive,
    color: 'emerald',
  },
  {
    id: 'fs',
    title: 'File System',
    description:
      'Explore directories and files through an interactive file-system simulator.',
    category: 'Storage Management',
    algorithms: ['Create', 'Read', 'Rename', 'Delete'],
    icon: FolderTree,
    color: 'pink',
  },
  {
    id: 'sync',
    title: 'Synchronization',
    description:
      'Understand concurrent execution, shared resources, and synchronization.',
    category: 'Process Management',
    algorithms: ['Mutex', 'Semaphore', 'Producer–Consumer'],
    icon: Activity,
    color: 'orange',
  },
]

const CATEGORIES = [
  'All Modules',
  'Process Management',
  'Memory Management',
  'Storage Management',
]

export function DashboardView({
  onOpen,
}: {
  onOpen: (view: ViewId) => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Modules')

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase()

    return MODULES.filter((module) => {
      const matchesCategory =
        category === 'All Modules' || module.category === category

      const searchableText = [
        module.title,
        module.description,
        module.category,
        ...module.algorithms,
      ]
        .join(' ')
        .toLowerCase()

      return matchesCategory && searchableText.includes(query)
    })
  }, [search, category])

  return (
    <div className="min-h-screen space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-200">
            <Sparkles size={14} />
            INTERACTIVE OS LABORATORY
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Explore the
            <span className="block bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              world of operating systems.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Welcome to NEXOS. Learn core operating system concepts through
            interactive simulations, algorithm visualizations, and hands-on
            experiments.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onOpen('cpu')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            >
              Start exploring
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('nexos-modules')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <BookOpen size={17} />
              Browse modules
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-10 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:mt-12 sm:grid-cols-4">
          <div>
            <p className="text-3xl font-bold">{MODULES.length}</p>
            <p className="mt-1 text-xs text-slate-400">Interactive modules</p>
          </div>
          <div>
            <p className="text-3xl font-bold">7+</p>
            <p className="mt-1 text-xs text-slate-400">OS concepts</p>
          </div>
          <div>
            <p className="text-3xl font-bold">20+</p>
            <p className="mt-1 text-xs text-slate-400">Algorithm options</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-3xl font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Ready
            </p>
            <p className="mt-1 text-xs text-slate-400">Simulation lab</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <Terminal size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold">Learn by doing</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Run interactive simulations
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
              <Database size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold">Understand the logic</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Explore results step by step
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Activity size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold">Compare algorithms</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Find differences in performance
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section id="nexos-modules" className="scroll-mt-8 space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              YOUR WORKSPACE
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Simulation modules
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Choose a module to start experimenting.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search algorithms..."
              aria-label="Search modules and algorithms"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-900"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                category === item
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {filteredModules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module, index) => {
              const Icon = module.icon

              return (
                <Card
                  key={module.id}
                  className="group relative flex h-full flex-col overflow-hidden border border-slate-200/70 bg-white p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5 dark:border-white/10 dark:bg-slate-900 dark:hover:border-violet-400/40"
                >
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${
                      module.color === 'violet'
                        ? 'from-violet-500 to-fuchsia-400'
                        : module.color === 'cyan'
                          ? 'from-cyan-500 to-teal-400'
                          : module.color === 'blue'
                            ? 'from-blue-500 to-cyan-400'
                            : module.color === 'amber'
                              ? 'from-amber-500 to-orange-400'
                              : module.color === 'emerald'
                                ? 'from-emerald-500 to-teal-400'
                                : module.color === 'pink'
                                  ? 'from-pink-500 to-rose-400'
                                  : 'from-orange-500 to-amber-400'
                    }`}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`rounded-2xl p-3 ${
                          module.color === 'violet'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                            : module.color === 'cyan'
                              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                              : module.color === 'blue'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                : module.color === 'amber'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                  : module.color === 'emerald'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : module.color === 'pink'
                                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
                        }`}
                      >
                        <Icon size={23} />
                      </div>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <p className="mt-5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                      {module.category}
                    </p>

                    <h3 className="mt-1 text-lg font-bold tracking-tight">
                      {module.title}
                    </h3>

                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {module.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {module.algorithms.map((algorithm) => (
                        <span
                          key={algorithm}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          {algorithm}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpen(module.id)}
                      className="mt-5 flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition group-hover:border-violet-300 group-hover:bg-violet-50 group-hover:text-violet-700 dark:border-white/10 dark:group-hover:border-violet-400/30 dark:group-hover:bg-violet-500/10 dark:group-hover:text-violet-300"
                    >
                      Open simulator
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
            <Search className="mx-auto text-slate-400" size={28} />
            <h3 className="mt-4 font-semibold">No modules found</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try another search term or select a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('All Modules')
              }}
              className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold tracking-wide">NEXOS OS SIMULATOR</p>
        <p>Learn. Simulate. Understand how operating systems work.</p>
      </footer>
    </div>
  )
}