'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { 
  Users, Building2, DollarSign, AlertTriangle, 
  TrendingUp, TrendingDown, Calendar, FileText 
} from 'lucide-react'
import api from '@/lib/api'

interface DashboardStats {
  totalStudents: number
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  totalRevenue: number
  pendingInvoices: number
  activeIncidents: number
  occupancyRate: number
  monthlyRevenue: { month: string; revenue: number }[]
  roomTypeOccupancy: { type: string; occupied: number; total: number }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.get('/dashboard/stats')
      setStats(res.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    { 
      title: 'Tổng sinh viên', 
      value: stats?.totalStudents || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      title: 'Phòng đang sử dụng', 
      value: `${stats?.occupiedRooms || 0}/${stats?.totalRooms || 0}`, 
      icon: Building2, 
      color: 'bg-green-500',
      change: `${stats?.occupancyRate || 0}%`
    },
    { 
      title: 'Doanh thu tháng này', 
      value: `${(stats?.totalRevenue || 0).toLocaleString('vi-VN')}đ`, 
      icon: DollarSign, 
      color: 'bg-purple-500',
      change: '+8%'
    },
    { 
      title: 'Sự cố chưa xử lý', 
      value: stats?.activeIncidents || 0, 
      icon: AlertTriangle, 
      color: 'bg-orange-500',
      change: '-5%'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hoạt động ký túc xá</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {card.change}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo tháng</h2>
          </div>
          <div className="p-6">
            {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
              <div className="space-y-4">
                {stats.monthlyRevenue.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{item.month}</span>
                    <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${Math.min((item.revenue / 100000000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{item.revenue.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tỷ lệ lấp đầy theo loại phòng</h2>
          </div>
          <div className="p-6">
            {stats?.roomTypeOccupancy && stats.roomTypeOccupancy.length > 0 ? (
              <div className="space-y-4">
                {stats.roomTypeOccupancy.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">{item.type}</span>
                      <span className="text-sm text-gray-500">{item.occupied}/{item.total}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(item.occupied / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Chưa có dữ liệu loại phòng
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Hóa đơn chờ thanh toán</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-bold text-orange-600">{stats?.pendingInvoices || 0}</span>
              <FileText className="h-12 w-12 text-orange-300" />
            </div>
            <p className="text-sm text-gray-600">Hóa đơn chưa thanh toán trong tháng này</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sự cố đang xử lý</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-bold text-red-600">{stats?.activeIncidents || 0}</span>
              <AlertTriangle className="h-12 w-12 text-red-300" />
            </div>
            <p className="text-sm text-gray-600">Sự cố cần được xử lý</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tỷ lệ lấp đầy</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-bold text-green-600">{stats?.occupancyRate || 0}%</span>
              <Building2 className="h-12 w-12 text-green-300" />
            </div>
            <p className="text-sm text-gray-600">Tỷ lệ phòng đang được sử dụng</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
