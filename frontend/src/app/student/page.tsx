'use client'

import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Building2, FileText, Wrench, Bell, Calendar, RefreshCw, MessageCircle, ArrowRight, ClipboardCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    room: null as any,
    currentInvoice: null as any,
    openIncidents: 0,
    notifications: 0
  })
  const [pendingRegistration, setPendingRegistration] = useState<any>(null)
  const [hasActiveContract, setHasActiveContract] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [roomRes, invoiceRes, incidentsRes, regRes, contractsRes] = await Promise.allSettled([
        api.get('/rooms/my-room'),
        api.get('/invoices/current'),
        api.get('/incidents/my-incidents'),
        api.get('/registrations/my'),
        api.get('/students/my-contracts')
      ])

      const room = roomRes.status === 'fulfilled' ? roomRes.value.data.data : null
      const currentInvoice = invoiceRes.status === 'fulfilled' ? invoiceRes.value.data.data : null
      const myIncidentsData = incidentsRes.status === 'fulfilled' ? (incidentsRes.value.data.data || { reported: [], assigned: [] }) : { reported: [], assigned: [] }
      const reported: any[] = myIncidentsData.reported || []
      const openIncidents = reported.filter((i: any) => i.status === 'pending' || i.status === 'in_progress').length

      // Check for active registration (pending, deposit_pending, deposit_paid)
      const registrations: any[] = regRes.status === 'fulfilled' ? (regRes.value.data.data || []) : []
      const activeReg = registrations.find((r: any) => ['pending', 'deposit_pending', 'deposit_paid'].includes(r.status))
      setPendingRegistration(activeReg || null)
      const contracts: any[] = contractsRes.status === 'fulfilled' ? (contractsRes.value.data.data || []) : []
      setHasActiveContract(contracts.some((c: any) => c.status === 'active'))

      setStats({ room, currentInvoice, openIncidents, notifications: 0 })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { name: 'Đăng ký phòng', href: '/student/register', icon: Calendar, gradient: 'bg-primary-100 text-primary-600' },
    { name: 'Theo dõi đơn', href: '/student/registrations', icon: ClipboardCheck, gradient: 'bg-blue-100 text-blue-600' },
    { name: 'Gia hạn HĐ', href: '/student/renewals', icon: RefreshCw, gradient: 'bg-success-100 text-success-600' },
    { name: 'Thanh toán', href: '/student/invoices', icon: FileText, gradient: 'bg-warning-100 text-warning-600' },
    { name: 'Báo sự cố', href: '/student/incidents', icon: Wrench, gradient: 'bg-danger-100 text-danger-600' },
    { name: 'Trợ lý AI', href: '/student/chatbot', icon: MessageCircle, gradient: 'bg-navy-100 text-navy-600' },
  ].filter((action) => !(hasActiveContract && action.href === '/student/register'))

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-sans text-navy-700">Xin chào!</h1>
        <p className="text-navy-400 mt-0.5 font-body">Chào mừng bạn đến với hệ thống quản lý Ký túc xá</p>
      </div>

      {/* Pending Registration Alert */}
      {pendingRegistration && (
        <div className={`rounded-2xl border p-4 ${
          pendingRegistration.status === 'deposit_pending'
            ? 'bg-primary-50 border-primary-200'
            : pendingRegistration.status === 'deposit_paid'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-warning-50 border-warning-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              pendingRegistration.status === 'deposit_pending'
                ? 'bg-primary-100'
                : pendingRegistration.status === 'deposit_paid'
                  ? 'bg-blue-100'
                  : 'bg-warning-100'
            }`}>
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold font-sans text-navy-700">
                  {pendingRegistration.status === 'pending' && 'Đơn đăng ký đang chờ duyệt'}
                  {pendingRegistration.status === 'deposit_pending' && 'Cần nộp tiền cọc'}
                  {pendingRegistration.status === 'deposit_paid' && 'Đã nộp cọc - chờ xác nhận'}
                </p>
                <Link href="/student/registrations" className="text-xs text-primary-600 hover:text-primary-700 font-semibold font-sans cursor-pointer">
                  Xem chi tiết <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <p className="text-xs text-navy-500 mt-1">
                {pendingRegistration.status === 'pending' && `Đăng ký phòng ${pendingRegistration.preferredRoomType?.name || ''} - đang chờ quản lý duyệt.`}
                {pendingRegistration.status === 'deposit_pending' && `Đã được duyệt phòng. Vui lòng nộp tiền cọc ${formatVnd(pendingRegistration.depositAmount || 0)} trong vòng 3 ngày.`}
                {pendingRegistration.status === 'deposit_paid' && `Biên lai cọc đã được gửi. Đang chờ quản lý xác nhận.`}
              </p>
              {pendingRegistration.status === 'deposit_pending' && (
                <Link href="/student/registrations" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                  Nộp tiền cọc ngay
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Phòng của bạn"
          value={stats.room?.roomNumber || 'Chưa có'}
          icon={<Building2 className="w-6 h-6 text-white" />}
          gradient="navy"
          subtitle={stats.room ? `Tòa ${stats.room.building} · Tầng ${stats.room.floor}` : 'Vui lòng đăng ký phòng'}
        />
        <StatsCard
          title="Hóa đơn tháng này"
          value={stats.currentInvoice ? formatVnd(stats.currentInvoice.totalAmount) : 'Chưa có'}
          icon={<FileText className="w-6 h-6 text-white" />}
          gradient={stats.currentInvoice?.status === 'overdue' ? 'red' : 'amber'}
          subtitle={stats.currentInvoice ? (stats.currentInvoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán') : ''}
        />
        <StatsCard
          title="Sự cố đang mở"
          value={stats.openIncidents}
          icon={<Wrench className="w-6 h-6 text-white" />}
          gradient="blue"
          subtitle={stats.openIncidents > 0 ? 'Đang chờ xử lý' : 'Không có sự cố'}
        />
        <StatsCard
          title="Thông báo mới"
          value={stats.notifications}
          icon={<Bell className="w-6 h-6 text-white" />}
          gradient="green"
          subtitle="Cập nhật mới nhất"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold font-sans text-navy-700 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Card hover className="p-4 text-center group cursor-pointer">
                <div className={`w-12 h-12 mx-auto rounded-xl ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium font-sans text-navy-600 group-hover:text-navy-700 transition-colors">{action.name}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Room Info + Invoice */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-sans text-navy-700">Thông tin phòng</h2>
              {stats.room && (
                <Link href="/student/contract" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold font-sans cursor-pointer">
                  Xem hợp đồng <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
          <div className="p-5">
            {stats.room ? (
              <div className="space-y-3">
                {[
                  { label: 'Số phòng', value: stats.room.roomNumber },
                  { label: 'Tòa nhà', value: stats.room.building },
                  { label: 'Tầng', value: stats.room.floor },
                  { label: 'Loại phòng', value: stats.room.roomType?.name },
                  { label: 'Số người', value: `${stats.room.currentOccupancy}/${stats.room.roomType?.capacity}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-navy-400 font-body">{item.label}</span>
                    <span className="text-sm font-semibold font-sans text-navy-700">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-navy-200" />
                </div>
                <p className="text-sm font-medium font-sans text-navy-500 mb-3">Bạn chưa có phòng</p>
                <Link href="/student/register" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold font-sans cursor-pointer">
                  Đăng ký phòng ngay <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-surface-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-sans text-navy-700">Hóa đơn gần đây</h2>
              <Link href="/student/invoices" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold font-sans cursor-pointer">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            {stats.currentInvoice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-navy-400 font-body">Tháng</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">
                    {new Date(stats.currentInvoice.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-navy-400 font-body">Tổng tiền</span>
                  <span className="text-sm font-bold font-sans text-primary-600">
                    {formatVnd(stats.currentInvoice.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-navy-400 font-body">Hạn thanh toán</span>
                  <span className={`text-sm font-semibold font-sans ${new Date(stats.currentInvoice.dueDate) < new Date() ? 'text-danger-600' : 'text-navy-700'}`}>
                    {new Date(stats.currentInvoice.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-navy-400 font-body">Trạng thái</span>
                  <StatusBadge status={stats.currentInvoice.status} />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-navy-200" />
                </div>
                <p className="text-sm font-medium font-sans text-navy-500">Chưa có hóa đơn</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
