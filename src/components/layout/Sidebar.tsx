import { NavLink } from 'react-router-dom'
import { Users, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/tariffs', label: 'Тарифы', icon: Tag },
]

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r bg-gray-50">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
