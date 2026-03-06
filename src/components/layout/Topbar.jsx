import { Bell, ChevronDown, Menu } from 'lucide-react'

const CURRENT_USER = {
  name: 'Erthild Silver-Thread',
  role: 'Senior Compliance Officer',
  initials: 'ES',
}

export default function Topbar({ onToggle }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">

      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-navy-800 transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Internal Banking Platform
        </p>
      </div>

      <div className="flex items-center gap-5">

        <button className="relative text-slate-500 hover:text-navy-800 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-gold-400 text-xs font-bold shrink-0">
            {CURRENT_USER.initials}
          </div>

          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-700">{CURRENT_USER.name}</p>
            <p className="text-xs text-slate-400">{CURRENT_USER.role}</p>
          </div>

          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

      </div>
    </header>
  )
}
