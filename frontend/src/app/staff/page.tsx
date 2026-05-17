'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { Building2, Users, Wrench, FileText, ArrowRight, DollarSign, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import Link from 'next/link'

export default function StaffDashboard() {
  const { user } = useAuthStore()
  const role = user?.role || ''

  const [stats, setStats] = useState({
    rooms: { total: 0, available: 0, occupied: 0, maintenance: 0 },
    students: { totalStudents: 0 },
    incidents: { total: 0, byStatus: { pending: 0, inProgress: 0, resolved: 0, closed: 0 } },
    invoices: { total: 0, unpaid: 0, overdue: 0 },
    maintenance: { total: 0, byStatus: { pending: 0, inProgress: 0, completed: 0 } }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [role])

  const fetchStats = async () => {
    setLoading(true)
    const endpoints: Promise<any>[] = []

    if (role === 'staff') {
      endpoints.push(api.get('/rooms/stats/summary').catch(() => null))
      endpoints.push(api.get('/students/stats/summary').catch(() => null))
      endpoints.push(api.get('/incidents/stats/summary').catch(() => null))
      endpoints.push(api.get('/invoices/stats/summary').catch(() => null))
    } else if (role === 'accountant') {
      endpoints.push(Promise.resolve(null)) // rooms
      endpoints.push(Promise.resolve(null)) // students
      endpoints.push(Promise.resolve(null)) // incidents
      endpoints.push(api.get('/invoices/stats/summary').catch(() => null))
    } else if (role === 'technician') {
      endpoints.push(Promise.resolve(null)) // rooms
      endpoints.push(Promise.resolve(null)) // students
      endpoints.push(api.get('/incidents/stats/summary').catch(() => null))
      endpoints.push(Promise.resolve(null)) // invoices
    }

    try {
      const results = await Promise.allSettled(endpoints)
      setStats({
        rooms: results[0]?.status === 'fulfilled' && results[0].value?.data?.data ? results[0].value.data.data : { total: 0, available: 0, occupied: 0, maintenance: 0 },
        students: results[1]?.status === 'fulfilled' && results[1].value?.data?.data ? results[1].value.data.data : { totalStudents: 0 },
        incidents: results[2]?.status === 'fulfilled' && results[2].value?.data?.data ? results[2].value.data.data : { total: 0, byStatus: {} },
        invoices: results[3]?.status === 'fulfilled' && results[3].value?.data?.data ? results[3].value.data.data : { total: 0, unpaid: 0, overdue: 0 },
        maintenance: { total: 0, byStatus: { pending: 0, inProgress: 0, completed: 0 } }
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const roleLabel: Record<string, string> = {
    staff: 'Quản lý',
    accountant: 'Kế toán',
    technician: 'Kỹ thuật',
  }

  const statsCards: { title: string; value: number; icon: React.ReactNode; gradient: 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'; subtitle: string; href: string; show: boolean }[] = [
    {
      title: 'Phòng còn trống',
      value: stats.rooms.available ?? 0,
      icon: <Building2 className="w-6 h-6 text-white" />,
      gradient: 'blue',
      subtitle: `/ ${stats.rooms.total ?? 0} tổng số`,
      href: '/staff/rooms',
      show: role === 'staff'
    },
    {
      title: 'Sinh viên',
      value: stats.students.totalStudents ?? 0,
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: 'green',
      subtitle: 'Đang thuê phòng',
      href: '/staff/students',
      show: role === 'staff'
    },
    {
      title: 'Sự cố chờ xử lý',
      value: (stats.incidents.byStatus?.pending ?? 0) + (stats.incidents.byStatus?.inProgress ?? 0),
      icon: <Wrench className="w-6 h-6 text-white" />,
      gradient: 'amber',
      subtitle: `${stats.incidents.byStatus?.resolved ?? 0} đã giải quyết`,
      href: '/staff/incidents',
      show: role === 'staff' || role === 'technician'
    },
    {
      title: 'Hóa đơn quá hạn',
      value: stats.invoices.overdue ?? 0,
      icon: <FileText className="w-6 h-6 text-white" />,
      gradient: 'red',
      subtitle: `${stats.invoices.unpaid ?? 0} chưa thanh toán`,
      href: '/staff/invoices',
      show: role === 'staff' || role === 'accountant'
    },
  ]

  const visibleCards = statsCards.filter(c => c.show)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan - {roleLabel[role] || ''}</h1>
        <p className="text-gray-500 mt-1">Theo dõi tình trạng ký túc xá</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 sm:grid-cols-2 ${visibleCards.length >= 4 ? 'lg:grid-cols-4' : visibleCards.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {visibleCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <StatsCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
              subtitle={card.subtitle}
            />
          </Link>
        ))}
      </div>

      {/* Detail Cards - only show for staff */}
      {role === 'staff' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Room status */}
          <Card>
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Trạng thái phòng</h2>
                <Link href="/staff/rooms" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Còn trống', value: stats.rooms.available ?? 0, color: 'bg-emerald-500' },
                { label: 'Đã thuê', value: stats.rooms.occupied ?? 0, color: 'bg-blue-500' },
                { label: 'Bảo trì', value: stats.rooms.maintenance ?? 0, color: 'bg-amber-500' },
              ].map((item) => {
                const pct = stats.rooms.total ? Math.round((item.value / stats.rooms.total) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-900">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Incident status */}
          <Card>
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Tình trạng sự cố</h2>
                <Link href="/staff/incidents" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { label: 'Chờ xử lý', value: stats.incidents.byStatus?.pending ?? 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Đang xử lý', value: stats.incidents.byStatus?.inProgress ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Đã giải quyết', value: stats.incidents.byStatus?.resolved ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Đã đóng', value: stats.incidents.byStatus?.closed ?? 0, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-100' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${item.bg}`}>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Technician only shows incidents */}
      {role === 'technician' && (
        <Card>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Tình trạng sự cố</h2>
              <Link href="/staff/incidents" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Chi tiết <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-2.5">
            {[
              { label: 'Chờ xử lý', value: stats.incidents.byStatus?.pending ?? 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Đang xử lý', value: stats.incidents.byStatus?.inProgress ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Đã giải quyết', value: stats.incidents.byStatus?.resolved ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Đã đóng', value: stats.incidents.byStatus?.closed ?? 0, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-100' },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${item.bg}`}>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Accountant only shows invoice summary */}
      {role === 'accountant' && (
        <Card>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Tình trạng thanh toán</h2>
              <Link href="/staff/invoices" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Chi tiết <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-2.5">
            {[
              { label: 'Tổng hóa đơn', value: stats.invoices.total ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Chưa thanh toán', value: stats.invoices.unpaid ?? 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Quá hạn', value: stats.invoices.overdue ?? 0, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${item.bg}`}>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
