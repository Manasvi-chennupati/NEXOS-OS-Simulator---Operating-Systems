import { useState } from 'react'
import { Layout, type ViewId } from './components/Layout'
import { BankersView } from './views/BankersView'
import { CpuView } from './views/CpuView'
import { DashboardView } from './views/DashboardView'
import { DiskView } from './views/DiskView'
import { FileSystemView } from './views/FileSystemView'
import { MemoryView } from './views/MemoryView'
import { PagingView } from './views/PagingView'
import { SyncView } from './views/SyncView'

export default function App() {
  const [view, setView] = useState<ViewId>('dashboard')
  return (
    <Layout view={view} onView={setView}>
      {view === 'dashboard' ? <DashboardView onOpen={setView} /> : null}
      {view === 'cpu' ? <CpuView /> : null}
      {view === 'memory' ? <MemoryView /> : null}
      {view === 'paging' ? <PagingView /> : null}
      {view === 'deadlock' ? <BankersView /> : null}
      {view === 'disk' ? <DiskView /> : null}
      {view === 'fs' ? <FileSystemView /> : null}
      {view === 'sync' ? <SyncView /> : null}
    </Layout>
  )
}
