'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, FileText, BarChart3, TrendingUp, PieChart, Menu, LogOut, X, Bell, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { getRoleHome } from '@/lib/role-home'

export default function DirectorLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { setHasHydrated(true) }, [])

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
    } else if (user?.role !== 'director' && user?.role !== 'admin') {
      router.replace(getRoleHome(user?.role))
    }
  }, [hasHydrated, isAuthenticated, user, router])

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-warning-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || (user?.role !== 'director' && user?.role !== 'admin')) return null

  const navigation = [
    { name: 'Dashboard', href: '/director', icon: Home },
    { name: 'Chính sách giá', href: '/director/policies', icon: FileText },
    { name: 'Báo cáo', href: '/director/reports', icon: BarChart3 },
    { name: 'Doanh thu', href: '/director/revenue', icon: TrendingUp },
    { name: 'Công suất', href: '/director/occupancy', icon: PieChart },
    { name: 'Chat AI', href: '/director/chatbot', icon: MessageCircle },
    { name: 'Thông báo', href: '/director/notifications', icon: Bell },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/8">
        <div className="w-9 h-9 rounded-xl bg-warning-500 flex items-center justify-center shadow-sm">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold font-sans text-white truncate">Ban Giám đốc</p>
          <p className="text-[11px] text-white/40 truncate">{user?.fullName}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = item.href === '/director' ? pathname === '/director' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'}`}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/8">
        <button onClick={handleLogout} className="sidebar-nav-item text-danger-300 hover:text-danger-200 hover:bg-danger-500/10 w-full">
          <LogOut className="h-[18px] w-[18px]" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-navy-900/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-sidebar bg-navy-600 flex flex-col transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-3 right-3">
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:w-sidebar lg:flex">
        <div className="flex grow flex-col bg-navy-600 shadow-sidebar">
          <SidebarContent />
        </div>
      </div>

      <div className="lg:pl-sidebar">
        <header className="sticky top-0 z-30 flex h-header items-center gap-4 border-b border-surface-200/60 bg-white/80 backdrop-blur-md px-4 lg:px-6">
          <button className="p-2 text-navy-400 hover:text-navy-600 hover:bg-surface-100 rounded-lg lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <div className="hidden sm:block">
              <h1 className="text-base font-bold font-sans text-navy-700">Ban Giám đốc</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown href="/director/notifications" />
              <div className="flex items-center gap-2.5 pl-2 ml-2 border-l border-surface-200">
                <div className="w-8 h-8 rounded-xl bg-warning-600 flex items-center justify-center text-white text-xs font-bold font-sans">
                  {user?.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-navy-700 hidden sm:block">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 px-4 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
