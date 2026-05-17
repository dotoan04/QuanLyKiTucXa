'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { Building2, Users, TrendingUp, PieChart, ArrowRight, FileText } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

export default function DirectorDashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalStudents: 0,
    activeContracts: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const [roomsRes, studentsRes, contractsRes, invoicesRes] = await Promise.allSettled([
        api.get('/rooms/stats/summary'),
        api.get('/students/stats/summary'),
        api.get('/contracts/stats/summary'),
        api.get('/invoices/stats/summary'),
      ])

      setStats({
        totalRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.total || 0) : 0,
        occupiedRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.occupied || 0) : 0,
        availableRooms: roomsRes.status === 'fulfilled' ? (roomsRes.value.data.data.available || 0) : 0,
        totalStudents: studentsRes.status === 'fulfilled' ? (studentsRes.value.data.data.totalStudents || 0) : 0,
        activeContracts: contractsRes.status === 'fulfilled' ? (contractsRes.value.data.data.active || 0) : 0,
        totalRevenue: invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data.data.paidAmount || 0) : 0,
        paidInvoices: invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data.data.paid || 0) : 0,
        unpaidInvoices: invoicesRes.status === 'fulfilled' ? ((invoicesRes.value.data.data.unpaid || 0) + (invoicesRes.value.data.data.overdue || 0)) : 0,
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
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều hành</h1>
        <p className="text-gray-500 mt-1">Tổng quan tình hình Ký túc xá</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng doanh thu"
          value={`${(stats.totalRevenue / 1_000_000).toFixed(1)}M`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          gradient="green"
          subtitle={`${stats.totalRevenue.toLocaleString('vi-VN')}đ`}
        />
        <StatsCard
          title="Tỷ lệ lấp đầy"
          value={`${occupancyRate}%`}
          icon={<PieChart className="w-6 h-6 text-white" />}
          gradient="blue"
          subtitle={`${stats.occupiedRooms}/${stats.totalRooms} phòng`}
        />
        <StatsCard
          title="Sinh viên"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-white" />}
          gradient="purple"
          subtitle={`${stats.activeContracts} hợp đồng HĐ`}
        />
        <StatsCard
          title="Hóa đơn chờ thu"
          value={stats.unpaidInvoices}
          icon={<FileText className="w-6 h-6 text-white" />}
          gradient="amber"
          subtitle={`${stats.paidInvoices} đã thu`}
        />
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy */}
        <Card>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Công suất phòng</h2>
              <Link href="/director/occupancy" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Chi tiết <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-8 mb-6">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={`${occupancyRate}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{occupancyRate}%</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { label: 'Đã thuê', value: stats.occupiedRooms, color: 'bg-purple-500' },
                  { label: 'Còn trống', value: stats.availableRooms, color: 'bg-emerald-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick reports */}
        <Card>
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Báo cáo</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { name: 'Báo cáo doanh thu', href: '/director/revenue', icon: TrendingUp, desc: 'Tổng hợp tình hình thu chi' },
              { name: 'Báo cáo công suất', href: '/director/occupancy', icon: PieChart, desc: 'Phân tích tỷ lệ sử dụng phòng' },
              { name: 'Duyệt chính sách giá', href: '/director/policies', icon: FileText, desc: 'Xem xét và phê duyệt giá phòng' },
              { name: 'Xuất báo cáo định kỳ', href: '/director/reports', icon: FileText, desc: 'Tạo và xuất báo cáo tổng hợp' },
            ].map((item) => (
              <Link key={item.name} href={item.href}>
                <div className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-200 group">
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-purple-100 transition-colors">
                    <item.icon className="w-5 h-5 text-gray-500 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
