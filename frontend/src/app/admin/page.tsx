'use client'

import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { Building2, Users, FileText, Wrench, TrendingUp, ArrowRight, ClipboardList, UserPlus, CalendarClock } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface ActivityItem {
  id: string
  type: 'checkin' | 'complaint' | 'payment' | 'contract'
  message: string
  time: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalStudents: 0,
    activeContracts: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    openIncidents: 0,
  })
  const [loading, setLoading] = useState(true)

  const recentActivity: ActivityItem[] = [
    { id: '1', type: 'checkin', message: 'Nguyễn Văn An đã nhận phòng A201', time: '2 giờ trước' },
    { id: '2', type: 'payment', message: 'Hóa đơn HD-2024-0045 đã thanh toán', time: '3 giờ trước' },
    { id: '3', type: 'complaint', message: 'Báo sự cố: Đèn phòng B305 bị hỏng', time: '5 giờ trước' },
    { id: '4', type: 'contract', message: 'Hợp đồng SV-2024-0123 sắp hết hạn (15/04)', time: '6 giờ trước' },
    { id: '5', type: 'checkin', message: 'Trần Thị Bình đã trả phòng C102', time: '1 ngày trước' },
  ]

  const upcomingExpirations = [
    { name: 'Lê Hoàng Nam', room: 'A305', expiry: '15/04/2026', daysLeft: 27 },
    { name: 'Phạm Thị Cúc', room: 'B201', expiry: '20/04/2026', daysLeft: 32 },
    { name: 'Võ Minh Trí', room: 'C403', expiry: '01/05/2026', daysLeft: 43 },
    { name: 'Đặng Thanh Hà', room: 'A108', expiry: '05/05/2026', daysLeft: 47 },
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [roomsRes, studentsRes, contractsRes, invoicesRes, incidentsRes] = await Promise.allSettled([
        api.get('/rooms/stats/summary'),
        api.get('/students/stats/summary'),
        api.get('/contracts/stats/summary'),
        api.get('/invoices/stats/summary'),
        api.get('/incidents/stats/summary'),
      ])

      setStats({
        totalRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.total || 0) : 0,
        availableRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.available || 0) : 0,
        occupiedRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.occupied || 0) : 0,
        maintenanceRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.maintenance || 0) : 0,
        totalStudents: studentsRes.status === 'fulfilled' ? (studentsRes.value.data.data.totalStudents || 0) : 0,
        activeContracts: contractsRes.status === 'fulfilled' ? (contractsRes.value.data.data.active || 0) : 0,
        pendingInvoices: invoicesRes.status === 'fulfilled' ? ((invoicesRes.value.data.data.unpaid || 0) + (invoicesRes.value.data.data.overdue || 0)) : 0,
        totalRevenue: invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data.data.paidAmount || 0) : 0,
        openIncidents: incidentsRes.status === 'fulfilled' ? ((incidentsRes.value.data.data.byStatus?.pending || 0) + (incidentsRes.value.data.data.byStatus?.inProgress || 0)) : 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const occupancyRate = stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surface-200 rounded-xl animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-surface-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const quickLinks = [
    { name: 'Đăng ký phòng', href: '/admin/registrations', icon: ClipboardList, desc: 'Phê duyệt hồ sơ' },
    { name: 'Quản lý phòng', href: '/admin/rooms', icon: Building2, desc: `${stats.totalRooms} phòng` },
    { name: 'Sinh viên', href: '/admin/students', icon: Users, desc: `${stats.totalStudents} SV` },
    { name: 'Hợp đồng', href: '/admin/contracts', icon: FileText, desc: `${stats.activeContracts} HD` },
    { name: 'Hóa đơn', href: '/admin/invoices', icon: FileText, desc: `${stats.pendingInvoices} chờ thu` },
    { name: 'Sự cố', href: '/admin/incidents', icon: Wrench, desc: `${stats.openIncidents} mở` },
  ]

  const activityIconMap = {
    checkin: 'bg-success-100 text-success-600',
    complaint: 'bg-warning-100 text-warning-600',
    payment: 'bg-primary-100 text-primary-600',
    contract: 'bg-navy-100 text-navy-600',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Dashboard</h1>
          <p className="text-navy-400 mt-0.5 font-body">Tổng quan hệ thống quản lý Ký túc xá</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/admin/registrations">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-600 hover:bg-navy-700 text-white text-sm font-semibold font-sans rounded-xl transition-all duration-200 cursor-pointer shadow-sm">
              <UserPlus className="w-4 h-4" />
              Đăng ký sinh viên
            </button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng số phòng"
          value={stats.totalRooms}
          icon={<Building2 className="w-6 h-6 text-white" />}
          gradient="navy"
          subtitle={`${stats.availableRooms} trống · ${stats.occupiedRooms} đã thuê`}
        />
        <StatsCard
          title="Sinh viên"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-white" />}
          gradient="blue"
          subtitle={`${stats.activeContracts} hợp đồng đang hoạt động`}
        />
        <StatsCard
          title="Hóa đơn chờ thu"
          value={stats.pendingInvoices}
          icon={<FileText className="w-6 h-6 text-white" />}
          gradient="amber"
          subtitle={`Tổng thu: ${stats.totalRevenue.toLocaleString('vi-VN')}đ`}
        />
        <StatsCard
          title="Sự cố đang mở"
          value={stats.openIncidents}
          icon={<Wrench className="w-6 h-6 text-white" />}
          gradient="red"
          subtitle="Cần xử lý"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Room status — 2 columns */}
        <Card className="lg:col-span-2">
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-sans text-navy-700">Trạng thái phòng</h2>
              <Link href="/admin/rooms" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold font-sans cursor-pointer">
                Chi tiết <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            {/* Occupancy circle + breakdown */}
            <div className="flex items-center gap-8 mb-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E6ED" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray={`${occupancyRate}, 100`} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-sans text-navy-700">{occupancyRate}</span>
                  <span className="text-[10px] text-navy-400 font-medium">%</span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-navy-400 font-body">Tỷ lệ lấp đầy</p>
                  <p className="text-2xl font-bold font-sans text-navy-700">{stats.occupiedRooms}<span className="text-navy-300 font-normal">/{stats.totalRooms}</span></p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Còn trống', value: stats.availableRooms, color: 'bg-success-500' },
                    { label: 'Đã thuê', value: stats.occupiedRooms, color: 'bg-primary-500' },
                    { label: 'Bảo trì', value: stats.maintenanceRooms, color: 'bg-warning-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-sm text-navy-500 font-body">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold font-sans text-navy-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="h-2.5 w-full bg-surface-200 rounded-full overflow-hidden flex">
              <div className="bg-success-500 h-full transition-all duration-700 rounded-l-full" style={{ width: `${stats.totalRooms ? (stats.availableRooms / stats.totalRooms) * 100 : 0}%` }} />
              <div className="bg-primary-500 h-full transition-all duration-700" style={{ width: `${stats.totalRooms ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0}%` }} />
              <div className="bg-warning-500 h-full transition-all duration-700 rounded-r-full" style={{ width: `${stats.totalRooms ? (stats.maintenanceRooms / stats.totalRooms) * 100 : 0}%` }} />
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <h2 className="text-base font-bold font-sans text-navy-700">Truy cập nhanh</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <Link key={link.name} href={link.href} className="group">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-200/60 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer">
                    <div className="p-2 rounded-lg bg-surface-100 group-hover:bg-primary-100 transition-colors">
                      <link.icon className="w-4 h-4 text-navy-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-sans text-navy-600 group-hover:text-navy-700 truncate">{link.name}</p>
                      <p className="text-[11px] text-navy-400">{link.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <h2 className="text-base font-bold font-sans text-navy-700">Hoạt động gần đây</h2>
          </div>
          <div className="divide-y divide-surface-100">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 transition-colors cursor-pointer">
                <div className={`p-2 rounded-lg shrink-0 ${activityIconMap[item.type]}`}>
                  {item.type === 'checkin' && <Building2 className="w-4 h-4" />}
                  {item.type === 'complaint' && <Wrench className="w-4 h-4" />}
                  {item.type === 'payment' && <TrendingUp className="w-4 h-4" />}
                  {item.type === 'contract' && <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-600 font-body truncate">{item.message}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Expirations */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-warning-600" />
              <h2 className="text-base font-bold font-sans text-navy-700">Hợp đồng sắp hết hạn</h2>
            </div>
          </div>
          <div className="divide-y divide-surface-100">
            {upcomingExpirations.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-sm font-bold font-sans text-navy-500">
                    {item.name.charAt(item.name.lastIndexOf(' ') + 1)}
                  </div>
                  <div>
                    <p className="text-sm font-medium font-sans text-navy-700">{item.name}</p>
                    <p className="text-xs text-navy-400 font-body">Phòng {item.room}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-navy-500 font-body">{item.expiry}</p>
                  <p className={`text-xs font-semibold font-sans ${item.daysLeft <= 30 ? 'text-warning-600' : 'text-navy-400'}`}>
                    {item.daysLeft} ngày
                  </p>
                </div>
              </div>
            ))}
            {upcomingExpirations.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-navy-400 font-body">
                Không có hợp đồng sắp hết hạn
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
