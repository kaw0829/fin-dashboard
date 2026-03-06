import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BarChart2, Users, ArrowLeftRight } from 'lucide-react'

// Each nav item defines its route path, label, and Lucide icon.
const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/analytics',   label: 'Analytics',    Icon: BarChart2 },
  { to: '/members',      label: 'Members',      Icon: Users },
  { to: '/transactions', label: 'Transactions', Icon: ArrowLeftRight },
]

export default function Sidebar({ collapsed }) {
  return (
    <nav className={`flex-1 py-6 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            [
              'flex items-center rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5',
              isActive
                ? 'bg-gold-400 text-navy-900'
                : 'text-gold-200 hover:bg-navy-700',
            ].join(' ')
          }
        >
          <Icon size={18} />
          {!collapsed && label}
        </NavLink>
      ))}
    </nav>
  )
}
