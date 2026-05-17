'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle, Camera, AlertCircle, Wrench, MessageCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

interface Ticket {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    fullName: string
    email: string
    phone: string
    avatarUrl?: string
  }
  room: {
    id: string
    roomNumber: string
    floor: number
    building: string
    roomType: {
      name: string
    }
  }
  assignee?: {
    id: string
    fullName: string
    email: string
    phone: string
  }
  images: string[]
  resolvedAt?: string
  resolutionNote?: string
}

export default function TechnicianDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all'
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status !== 'all') params.append('status', filter.status)
      if (filter.priority !== 'all') params.append('priority', filter.priority)

      
      const res = await api.get('/incidents', { params })
      setTickets(res.data.data.incidents || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await api.put(`/incidents/${ticketId}/status`, { status })
      alert('Cập nhật trạng thái thành công!')
      fetchTickets()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleResolve = async (ticketId: string, resolutionNote: string) => {
    try {
      await api.put(`/incidents/${ticketId}/resolve`, { resolutionNote })
      alert('Đã giải quyết sự cố thành công!')
      setShowDetailModal(false)
      fetchTickets()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: { [key: string]: { label: string; color: string } } = {
      low: { label: 'Thấp', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
    }
    return priorityMap[priority] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      electrical: 'Điện',
      plumbing: 'Nước',
      furniture: 'Nội thất',
      other: 'Khác'
    }
    return categoryMap[category] || category
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filter.status === 'all' || ticket.status === filter.status
    const matchesPriority = filter.priority === 'all' || ticket.priority === filter.priority
    return matchesStatus && matchesPriority
  })

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Kỹ thuật</h1>
        <p className="text-gray-600">Quản lý và xử lý các yêu cầu sửa chữa</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng ticket</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang xử lý</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã giải quyết</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Khẩn cấp</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tất cả mức độ</option>
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
          <option value="urgent">Khẩn cấp</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    ticket.priority === 'urgent' ? 'bg-red-100' :
                    ticket.priority === 'high' ? 'bg-orange-100' :
                    'bg-gray-100'
                  }`}>
                    <Wrench className={`w-5 h-5 ${
                      ticket.priority === 'urgent' ? 'text-red-600' :
                      ticket.priority === 'high' ? 'text-orange-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {ticket.room.roomNumber} - Tầng {ticket.room.floor}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority).color}`}>
                    {getPriorityBadge(ticket.priority).label}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status).color}`}>
                    {getStatusBadge(ticket.status).label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Ngày tạo: {formatDate(ticket.createdAt)}</span>
                <span>Bởi: {ticket.reporter.fullName}</span>
              </div>

              {ticket.assignee && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{ticket.assignee.fullName}</p>
                      <p className="text-gray-500">{ticket.assignee.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi tiết ticket
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                    <p className="text-sm text-gray-900">{selectedTicket.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự cố</label>
                    <p className="text-sm text-gray-900">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                    <p className="text-sm text-gray-900">
                      Phòng {selectedTicket.room.roomNumber} - Tầng {selectedTicket.room.floor} - Tòa {selectedTicket.room.building}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <p className="text-sm text-gray-900">{selectedTicket.description}</p>
                  </div>

                  {selectedTicket.images && selectedTicket.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTicket.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img src={img} alt="Image" className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'pending' && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedTicket.id, 'in_progress')
                          setShowDetailModal(false)
                        }}
                        className="w-full"
                      >
                        Nhận xử lý
                      </Button>
                    </div>
                  )}

                  {selectedTicket.status === 'in_progress' && (
                    <div className="pt-4 border-t">
                      <textarea
                        placeholder="Ghi chú giải quyết..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                        rows={3}
                        id="resolution-note"
                      />
                      <Button
                        onClick={() => {
                          const note = (document.getElementById('resolution-note') as HTMLTextAreaElement).value
                          handleResolve(selectedTicket.id, note)
                        }}
                        className="w-full"
                      >
                        Đánh dấu đã giải quyết
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
