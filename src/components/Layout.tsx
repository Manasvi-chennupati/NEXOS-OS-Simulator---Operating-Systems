import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Layers,
  LayoutDashboard,
  FolderTree,
  LockKeyhole,
  MemoryStick,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

export type ViewId =
  | 'dashboard'
  | 'cpu'
  | 'memory'
  | 'paging'
  | 'deadlock'
  | 'disk'
  | 'fs'
  | 'sync'

const NAV: { id: ViewId; label: string; icon: typeof Cpu }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cpu', label: 'CPU Scheduling', icon: Cpu },
  { id: 'memory', label: 'Memory Allocation', icon: MemoryStick },
  { id: 'paging', label: 'Page Replacement', icon: Layers },
  { id: 'deadlock', label: "Banker's Algorithm", icon: LockKeyhole },
  { id: 'disk', label: 'Disk Scheduling', icon: HardDrive },
  { id: 'fs', label: 'File System', icon: FolderTree },
  { id: 'sync', label: 'Synchronization', icon: Database },
]

export function Layout({
  view,
  onView,
  children,
}: {
  view: ViewId
  onView: (v: ViewId) => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const currentPage = NAV.find((item) => item.id === view)

  const navigate = (id: ViewId) => {
    onView(id)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#070d16] text-slate-200">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[270px] flex-col overflow-hidden border-r border-white/[0.07] bg-[#0b1421] transition-transform duration-300 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Fixed brand */}
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="mx-4 mb-6 mt-5 flex shrink-0 items-center gap-3 rounded-xl px-2 py-2 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-teal-400/5 text-cyan-300 shadow-lg shadow-cyan-950/20">
            <Activity size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold tracking-[0.32em] text-cyan-300">
              NEXOS
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              OS Simulation Lab
            </p>
          </div>

          <span className="md:hidden">
            <X size={18} className="text-slate-400" />
          </span>
        </button>

        {/* Navigation heading */}
        <div className="mx-4 mb-3 flex shrink-0 items-center justify-between px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <span className="rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-slate-500">
            {NAV.length} MODULES
          </span>
        </div>

        {/* Scrollable navigation */}
        <nav
          className="mx-4 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-4"
          aria-label="Main navigation"
        >
          {NAV.map((item) => {
            const Icon = item.icon
            const active = item.id === view

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex w-full shrink-0 items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'border-cyan-300/10 bg-gradient-to-r from-teal-400/15 to-cyan-400/[0.04] text-cyan-200 shadow-sm shadow-cyan-950/10'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-300" />
                )}

                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    active
                      ? 'bg-cyan-300/10 text-cyan-300'
                      : 'text-slate-500 group-hover:bg-white/[0.05] group-hover:text-slate-200'
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                </span>

                <span className="min-w-0 flex-1">{item.label}</span>

                {active && (
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-cyan-300/80"
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Fixed bottom section */}
        <div className="mx-4 mb-3 mt-3 shrink-0 border-t border-white/[0.07] pt-3">
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-800/60 to-slate-900/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                <Sparkles size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">
                  Learning Lab
                </p>
                <p className="text-[10px] text-slate-500">
                  Interactive environment
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Explore OS algorithms, visualize execution, and understand how
              systems work.
            </p>

            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-[10px] font-medium text-emerald-300">
                Simulation environment ready
              </span>
            </div>
          </div>

          <p className="mt-3 px-2 text-[10px] text-slate-600">
            NEXOS OS Simulator · v1.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen min-w-0 md:pl-[270px]">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center gap-3 border-b border-white/[0.07] bg-[#070d16]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.08] md:hidden"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-100 sm:text-xl">
                {currentPage?.label ?? 'Dashboard'}
              </h1>

              <span className="hidden rounded-md border border-cyan-300/10 bg-cyan-300/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-cyan-300 sm:inline-flex">
                NEXOS LAB
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-slate-500 sm:text-[13px]">
              Interactive Operating System Simulation and Visualization
              Platform
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-slate-400">
              System online
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1700px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="mx-auto flex max-w-[1700px] flex-col gap-1 border-t border-white/[0.06] px-4 py-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-9">
          <span>NEXOS OS SIMULATOR</span>
          <span>Built for learning operating system concepts</span>
        </footer>
      </div>
    </div>
  )
}