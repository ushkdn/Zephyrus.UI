import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useAuthStore } from '../../store/auth.store'
import { ROLE_LABELS } from '../../types'
import { userApi } from '../../api/user.api'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: ('Admin' | 'Manager' | 'Buyer')[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Главная', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/categories', label: 'Категории', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/products', label: 'Товары', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/suppliers', label: 'Поставщики', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/purchase-requests', label: 'Заявки', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/orders', label: 'Заказы', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', roles: ['Admin', 'Manager'] },
  { to: '/notifications', label: 'Уведомления', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
]

export function Sidebar() {
  const { user, logout, hasRole } = useAuthStore()
  const [profileOpen, setProfileOpen] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => userApi.getById(user!.id),
    enabled: !!user?.id && profileOpen,
  })

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true
    return hasRole(...item.roles)
  })

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : user?.email ?? ''

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="text-xl font-bold text-white tracking-tight">Zephyrus</span>
        <p className="text-xs text-slate-400 mt-0.5">Управление закупками</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 relative">
        {profileOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Профиль</p>
              <button
                onClick={() => setProfileOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-slate-500">ФИО</p>
                <p className="text-sm text-white">
                  {profile?.data
                    ? `${profile.data.lastName} ${profile.data.firstName} ${profile.data.middleName}`.trim()
                    : `${user?.lastName ?? ''} ${user?.firstName ?? ''}`.trim()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white truncate">{profile?.data?.email ?? user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Роль</p>
                <p className="text-sm text-white">{user?.role ? ROLE_LABELS[user.role] : '—'}</p>
              </div>
              {profile?.data && (
                <div>
                  <p className="text-xs text-slate-500">Дата регистрации</p>
                  <p className="text-sm text-white">
                    {new Date(profile.data.dateCreated).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="w-full flex items-center gap-3 mb-3 px-1 py-1 rounded-lg hover:bg-slate-800 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{fullName}</p>
            <p className="text-xs text-slate-400">{user?.role ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <svg
            className={clsx('w-4 h-4 text-slate-400 shrink-0 transition-transform', profileOpen && 'rotate-180')}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Выйти
        </button>
      </div>
    </aside>
  )
}
