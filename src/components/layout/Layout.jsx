import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BankBanner from './BankBanner'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      <aside className={`${collapsed ? 'w-16' : 'w-72'} h-screen bg-navy-900 flex flex-col overflow-y-auto shrink-0 transition-all duration-200`}>
        <BankBanner collapsed={collapsed} />
        <Sidebar collapsed={collapsed} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
