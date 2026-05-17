'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Wrench, AlertTriangle, Clock, CheckCircle, User, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedIncidentForAssign, setSelectedIncidentForAssign] = useState<any>(null)
  const [assignTo, setAssignTo] = useState('')

  const [formData, setFormData] = useState({
    roomId: '',
    category: '',
    title: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (activeTab !== 'all') params.status = activeTab

      const response = await api.get('/incidents', { params })
      const raw = response.data.data
      setIncidents(Array.isArray(raw) ? raw : raw?.incidents || [])
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (incidentId: string, status: string) => {
    try {
      await api.put(`/incidents/${incidentId}/status`, { status })
      await fetchData()
    } catch (error) {
      console.error('Failed to update incident status:', error)
    }
  }

  const handleResolve = async (incidentId: string, resolutionNote: string) => {
    try {
      await api.put(`/incidents/${incidentId}/resolve`, { resolutionNote })
      await fetchData()
    } catch (error) {
      console.error('Failed to resolve incident:', error)
    }
  }

  const handleAssign = async (incidentId: string, assignedTo: string) => {
    try {
      await api.put(`/incidents/${incidentId}/assign`, { assignedTo })
      await fetchData()
      setAssignModalOpen(false)
    } catch (error) {
      console.error('Failed to assign incident:', error)
    }
  }

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự cố này?')) return

    try {
      await api.delete(`/incidents/${incidentId}`)
      await fetchData()
    } catch (error) {
      console.error('Failed to delete incident:', error)
    }
  }

  const openIncidentDetails = (incident: any) => {
    setSelectedIncident(incident)
  }

  const openAssignModal = (incident: any) => {
    setSelectedIncidentForAssign(incident)
    setAssignTo('')
    setAssignModalOpen(true)
  }

  const statuses = ['pending', 'in_progress', 'resolved']
  const categories = [
    { value: 'electrical', label: 'Điện' },
    { value: 'plumbing', label: 'Nước' },
    { value: 'furniture', label: 'Đồ nội thất' },
    { value: 'other', label: 'Khác' }
  ]

  const priorities = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' }
  ]

  const columns = [
    {
      key: 'title',
      label: 'Tiêu đề',
      sortable: true
    },
    {
      key: 'category',
      label: 'Loại',
      sortable: true
    },
    {
      key: 'room',
      label: 'Phòng',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.room?.roomNumber}</div>
          <div className="text-sm text-gray-600">Tòa {row.room?.building}</div>
        </div>
      )
    },
    {
      key: 'reporter',
      label: 'Người báo',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.reporter?.fullName}</div>
          <div className="text-sm text-gray-600">{row.reporter?.email}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Độ ưu tiên',
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'assignee',
      label: 'Người xử lý',
      render: (_: any, row: any) => (
        <div>
          {row.assignee ? (
            <div>
              <div className="font-medium text-gray-900">{row.assignee?.fullName}</div>
              <div className="text-sm text-gray-600">{row.assignee?.email}</div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Chưa gán</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openIncidentDetails(row)}
          >
            Xem chi tiết
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAssignModal(row)}
            >
              <User className="h-4 w-4 mr-2" />
              Gán
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const note = prompt('Nhập ghi chú giải quyết:')
                if (note) handleResolve(row.id, note)
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Giải quyết
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sự cố</h1>
          <p className="text-gray-600 mt-1">Xử lý và theo dõi sự cố của sinh viên</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'stats' ? 'primary' : 'outline'}
            onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Thống kê
          </Button>
        </div>
      </div>

      {viewMode === 'stats' ? (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sự cố</p>
                <p className="text-3xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang chờ xử lý</p>
                <p className="text-3xl font-bold text-gray-900">
                  {incidents.filter((i: any) => i.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                <p className="text-3xl font-bold text-gray-900">
                  {incidents.filter((i: any) => i.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã giải quyết</p>
                <p className="text-3xl font-bold text-gray-900">
                  {incidents.filter((i: any) => i.status === 'resolved').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="flex items-center gap-4 p-4 border-b border-gray-200">
            <Button
              variant={activeTab === 'all' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('pending')}
            >
              Đang chờ ({incidents.filter((i: any) => i.status === 'pending').length})
            </Button>
            <Button
              variant={activeTab === 'in_progress' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('in_progress')}
            >
              Đang xử lý ({incidents.filter((i: any) => i.status === 'in_progress').length})
            </Button>
            <Button
              variant={activeTab === 'resolved' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('resolved')}
            >
              Đã giải quyết ({incidents.filter((i: any) => i.status === 'resolved').length})
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={incidents}
            loading={loading}
            emptyMessage={`Không có sự cố ${activeTab}`}
          />
        </Card>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={`Chi tiết sự cố ${selectedIncident.id.slice(0, 8)}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <div className="text-lg font-semibold text-gray-900">{selectedIncident.title}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <StatusBadge status={selectedIncident.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự cố</label>
                <div className="text-gray-900">{selectedIncident.category}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                <StatusBadge status={selectedIncident.priority} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  Phòng {selectedIncident.room?.roomNumber} - Tòa {selectedIncident.room?.building}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người báo</label>
              <div className="bg-green-50 p-3 rounded-lg flex items-center gap-3">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">{selectedIncident.reporter?.fullName}</div>
                  <div className="text-sm text-gray-600">{selectedIncident.reporter?.email}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <div className="bg-gray-50 p-4 rounded-lg">{selectedIncident.description}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người xử lý</label>
              {selectedIncident.assignee ? (
                <div className="bg-yellow-50 p-3 rounded-lg flex items-center gap-3">
                  <User className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-gray-900">{selectedIncident.assignee?.fullName}</div>
                    <div className="text-sm text-gray-600">{selectedIncident.assignee?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Chưa gán người xử lý</div>
              )}
            </div>

            {selectedIncident.resolutionNote && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giải pháp</label>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">
                    Đã giải quyết vào {new Date(selectedIncident.resolvedAt!).toLocaleDateString('vi-VN')}
                  </div>
                  <div>{selectedIncident.resolutionNote}</div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Assign Incident Modal */}
      {selectedIncidentForAssign && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title={`Gán người xử lý cho sự cố ${selectedIncidentForAssign.title}`}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={() => handleAssign(selectedIncidentForAssign.id, assignTo)}>
                Gán người xử lý
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề sự cố</label>
              <div className="text-lg font-semibold text-gray-900">{selectedIncidentForAssign.title}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người xử lý</label>
              <input
                type="text"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nhập email người xử lý"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                Lưu ý: Sau khi gán, người được gán sẽ nhận thông báo và có thể bắt đầu xử lý sự cố này.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
