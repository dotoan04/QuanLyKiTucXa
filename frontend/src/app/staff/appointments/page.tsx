'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  CalendarDays, Clock, MapPin, Users, Plus, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Search, UserCheck, UserX, Trash2, RefreshCw,
  Building2, Filter, Eye, CalendarCheck
} from 'lucide-react'
import api from '@/lib/api'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface StudentInfo {
  id: string
  studentCode: string
  faculty: string
  user: { id: string; fullName: string; email: string; phone: string }
}

interface RegInfo {
  id: string
  status: string
  desiredStartDate: string
  preferredRoomType: { id: string; name: string }
  assignedRoom?: { id: string; roomNumber: string; building: string; floor: number } | null
  student: StudentInfo
}

interface AptItem {
  id: string
  registrationId: string
  status: 'pending' | 'attended' | 'absent'
  note?: string
  registration: RegInfo
}

interface Appointment {
  id: string
  scheduledAt: string
  location?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdBy: { fullName: string }
  room?: { id: string; roomNumber: string; building: string; floor: number } | null
  items: AptItem[]
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const APT_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Đã lên lịch',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}
const APT_STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
}
const ITEM_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ đến',
  attended: 'Đã đến',
  absent: 'Vắng mặt'
}
const ITEM_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  attended: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-600'
}

/** Trạng thái đơn đăng ký khi xếp lịch (khớp backend) */
const REG_STATUS_FOR_APT: Record<string, string> = {
  deposit_paid: 'Chờ KT xác nhận cọc',
  deposit_confirmed: 'Cọc đã xác nhận — có thể hẹn xem phòng / tạo HĐ',
}

// ─────────────────────────────────────────────────────────
// Create Appointment Modal
// ─────────────────────────────────────────────────────────
function CreateAppointmentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pendingRegs, setPendingRegs] = useState<RegInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    scheduledAt: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    api.get('/appointments/pending-registrations')
      .then(r => setPendingRegs(r.data.data || []))
      .catch(() => setPendingRegs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = pendingRegs.filter(r =>
    r.student.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    r.student.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    (r.student.faculty || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(r => r.id)))
    }
  }

  const handleSubmit = async () => {
    if (!form.scheduledAt) { setError('Vui lòng chọn ngày giờ hẹn'); return }
    if (selected.size === 0) { setError('Vui lòng chọn ít nhất 1 sinh viên'); return }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/appointments', {
        ...form,
        registrationIds: Array.from(selected)
      })
      onDone()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Tạo lịch hẹn xem phòng"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting || selected.size === 0 || !form.scheduledAt}>
            {submitting ? 'Đang tạo...' : `Tạo lịch hẹn (${selected.size} SV)`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Thời gian & địa điểm */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày giờ hẹn <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="VD: Văn phòng KTX, Phòng A101..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="Lưu ý, hướng dẫn cho sinh viên..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-900">
          <strong>Quy trình gợi ý:</strong> SV nộp biên lai → kế toán xác nhận cọc → quản lý{' '}
          <strong>có thể hẹn xem phòng</strong> (bước này) → tạo hợp đồng ở mục Đăng ký phòng. Nếu đã gặp SV trực tiếp, có thể bỏ qua lịch hẹn và tạo HĐ luôn.
        </div>

        {/* Danh sách sinh viên chờ xếp lịch */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Chọn sinh viên (đã nộp cọc hoặc cọc đã xác nhận) ({selected.size}/{pendingRegs.length})
            </p>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary-600 hover:underline"
            >
              {selected.size === filtered.length && filtered.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, MSSV, khoa..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Không có sinh viên nào chờ xếp lịch</p>
                <p className="text-xs mt-1 text-center max-w-md">
                  Danh sách gồm đơn ở trạng thái <strong>chờ kế toán xác nhận cọc</strong> hoặc{' '}
                  <strong>cọc đã xác nhận</strong>, chưa nằm trong lịch đang &quot;Đã lên lịch&quot;, và chưa tạo hợp đồng.
                </p>
              </div>
            ) : (
              filtered.map(reg => (
                <label
                  key={reg.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${selected.has(reg.id) ? 'bg-blue-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(reg.id)}
                    onChange={() => toggleSelect(reg.id)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{reg.student.user.fullName}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{reg.student.studentCode}</span>
                      {REG_STATUS_FOR_APT[reg.status] && (
                        <span className="text-[10px] font-medium text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                          {REG_STATUS_FOR_APT[reg.status]}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{reg.student.faculty || 'Chưa có khoa'}</span>
                      <span>•</span>
                      <span className="text-blue-600">{reg.preferredRoomType.name}</span>
                      {reg.assignedRoom && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Phòng {reg.assignedRoom.roomNumber} - Tòa {reg.assignedRoom.building}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(reg.desiredStartDate).toLocaleDateString('vi-VN')}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────
// Appointment Detail Modal
// ─────────────────────────────────────────────────────────
function AppointmentDetailModal({ apt, onClose, onRefresh }: { apt: Appointment; onClose: () => void; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const updateItemStatus = async (registrationId: string, status: 'pending' | 'attended' | 'absent') => {
    setUpdatingItem(registrationId)
    try {
      await api.put(`/appointments/${apt.id}/items/${registrationId}/status`, { status })
      onRefresh()
    } catch {
      alert('Không thể cập nhật trạng thái')
    } finally {
      setUpdatingItem(null)
    }
  }

  const handleComplete = async () => {
    if (!confirm('Đánh dấu lịch hẹn này là hoàn thành?')) return
    setCompleting(true)
    try {
      await api.post(`/appointments/${apt.id}/complete`)
      onRefresh()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Hủy lịch hẹn này?')) return
    setCancelling(true)
    try {
      await api.post(`/appointments/${apt.id}/cancel`)
      onRefresh()
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi')
    } finally {
      setCancelling(false)
    }
  }

  const attendedCount = apt.items.filter(i => i.status === 'attended').length
  const absentCount = apt.items.filter(i => i.status === 'absent').length

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Chi tiết lịch hẹn — ${new Date(apt.scheduledAt).toLocaleString('vi-VN')}`}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 text-sm text-gray-500">
            {apt.items.length} sinh viên • {attendedCount} đã đến • {absentCount} vắng
          </div>
          {apt.status === 'scheduled' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={cancelling}>
                <XCircle className="h-4 w-4 mr-1" />
                Hủy lịch
              </Button>
              <Button onClick={handleComplete} disabled={completing}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Hoàn thành
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Thông tin lịch hẹn */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Thời gian
            </p>
            <p className="font-semibold text-gray-900 text-sm">
              {new Date(apt.scheduledAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(apt.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Địa điểm
            </p>
            <p className="font-semibold text-gray-900 text-sm">{apt.location || '—'}</p>
            {apt.room && (
              <p className="text-xs text-gray-500 mt-1">Phòng {apt.room.roomNumber} - Tòa {apt.room.building}</p>
            )}
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> Sinh viên
            </p>
            <p className="font-semibold text-gray-900 text-sm">{apt.items.length} sinh viên</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${APT_STATUS_COLOR[apt.status]}`}>
              {APT_STATUS_LABEL[apt.status]}
            </span>
          </div>
        </div>

        {apt.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Ghi chú:</strong> {apt.notes}
          </div>
        )}

        {/* Danh sách sinh viên */}
        <div>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-800 w-full text-left"
          >
            <Users className="h-4 w-4" />
            Danh sách sinh viên
            {expanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>

          {expanded && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Sinh viên</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Phòng được phân</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Trạng thái</th>
                    {apt.status === 'scheduled' && (
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Cập nhật</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {apt.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.registration.student.user.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {item.registration.student.studentCode} • {item.registration.student.faculty || ''}
                        </div>
                        <div className="text-xs text-gray-400">{item.registration.student.user.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        {item.registration.assignedRoom ? (
                          <div>
                            <div className="font-medium text-green-700">Phòng {item.registration.assignedRoom.roomNumber}</div>
                            <div className="text-xs text-gray-500">Tòa {item.registration.assignedRoom.building} - Tầng {item.registration.assignedRoom.floor}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Chưa phân phòng</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${ITEM_STATUS_COLOR[item.status]}`}>
                          {ITEM_STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      {apt.status === 'scheduled' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateItemStatus(item.registrationId, 'attended')}
                              disabled={updatingItem === item.registrationId}
                              title="Đã đến"
                              className={`p-1.5 rounded-lg transition-colors ${item.status === 'attended' ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateItemStatus(item.registrationId, 'absent')}
                              disabled={updatingItem === item.registrationId}
                              title="Vắng mặt"
                              className={`p-1.5 rounded-lg transition-colors ${item.status === 'absent' ? 'bg-red-100 text-red-600' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<'date' | 'list'>('date')

  // Filters
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100 }
      if (filterStatus) params.status = filterStatus
      if (filterDate) params.date = filterDate
      const res = await api.get('/appointments', { params })
      setAppointments(res.data.data?.items || [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterDate])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredApts = appointments.filter(apt => {
    if (!searchText) return true
    const q = searchText.toLowerCase()
    return apt.items.some(item =>
      item.registration.student.user.fullName.toLowerCase().includes(q) ||
      item.registration.student.studentCode.toLowerCase().includes(q)
    ) || (apt.location || '').toLowerCase().includes(q)
  })

  // Group by date for calendar view
  const groupedByDate: Record<string, Appointment[]> = {}
  filteredApts.forEach(apt => {
    const key = new Date(apt.scheduledAt).toLocaleDateString('vi-VN')
    if (!groupedByDate[key]) groupedByDate[key] = []
    groupedByDate[key].push(apt)
  })

  const totalStudents = filteredApts.reduce((s, a) => s + a.items.length, 0)
  const scheduledCount = filteredApts.filter(a => a.status === 'scheduled').length
  const completedCount = filteredApts.filter(a => a.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary-600" />
            Lịch hẹn xem phòng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hẹn sinh viên đến xem phòng sau khi đã nộp chứng từ cọc; vẫn có thể xếp lịch khi kế toán đã xác nhận cọc và trước khi tạo hợp đồng.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo lịch hẹn
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredApts.length}</p>
              <p className="text-sm text-gray-500">Tổng lịch hẹn</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{scheduledCount}</p>
              <p className="text-sm text-gray-500">Sắp diễn ra</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-sm text-gray-500">Tổng sinh viên</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters + Toggle */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('date')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${viewMode === 'date' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays className="h-4 w-4 inline mr-1" />
              Theo ngày
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Filter className="h-4 w-4 inline mr-1" />
              Danh sách
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Tìm sinh viên, địa điểm..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="scheduled">Đã lên lịch</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <button onClick={() => { setFilterDate(''); setFilterStatus(''); setSearchText('') }}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Đang tải...</p>
          </div>
        </Card>
      ) : filteredApts.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
          <CalendarDays className="h-12 w-12 opacity-50" />
          <p className="text-lg font-medium">Chưa có lịch hẹn nào</p>
          <p className="text-sm">Tạo lịch hẹn mới để bắt đầu</p>
          <Button onClick={() => setShowCreate(true)} className="mt-2">
            <Plus className="h-4 w-4 mr-2" /> Tạo lịch hẹn đầu tiên
          </Button>
        </Card>
      ) : viewMode === 'date' ? (
        /* Calendar view - grouped by date */
        <div className="space-y-6">
          {Object.entries(groupedByDate).sort(([a], [b]) => {
            const da = appointments.find(ap => new Date(ap.scheduledAt).toLocaleDateString('vi-VN') === a)
            const db = appointments.find(ap => new Date(ap.scheduledAt).toLocaleDateString('vi-VN') === b)
            return new Date(da!.scheduledAt).getTime() - new Date(db!.scheduledAt).getTime()
          }).map(([date, apts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {date}
                </div>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">{apts.reduce((s, a) => s + a.items.length, 0)} sinh viên</span>
              </div>
              <div className="grid gap-3">
                {apts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} onClick={() => setSelectedApt(apt)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {filteredApts.map(apt => (
            <AppointmentCard key={apt.id} apt={apt} onClick={() => setSelectedApt(apt)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAppointmentModal
          onClose={() => setShowCreate(false)}
          onDone={fetchData}
        />
      )}

      {selectedApt && (
        <AppointmentDetailModal
          apt={selectedApt}
          onClose={() => setSelectedApt(null)}
          onRefresh={() => { fetchData(); setSelectedApt(null) }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Appointment Card
// ─────────────────────────────────────────────────────────
function AppointmentCard({ apt, onClick }: { apt: Appointment; onClick: () => void }) {
  const attendedCount = apt.items.filter(i => i.status === 'attended').length
  const absentCount = apt.items.filter(i => i.status === 'absent').length
  const pendingCount = apt.items.filter(i => i.status === 'pending').length

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
        apt.status === 'completed' ? 'border-l-green-400' :
        apt.status === 'cancelled' ? 'border-l-gray-300' :
        'border-l-blue-400'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Time */}
          <div className="text-center min-w-[56px]">
            <div className="text-xl font-bold text-gray-900 leading-none">
              {new Date(apt.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(apt.scheduledAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APT_STATUS_COLOR[apt.status]}`}>
                {APT_STATUS_LABEL[apt.status]}
              </span>
              {apt.location && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {apt.location}
                </span>
              )}
            </div>

            {/* Student list preview */}
            <div className="mt-2 flex flex-wrap gap-1">
              {apt.items.slice(0, 5).map(item => (
                <span
                  key={item.id}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'attended' ? 'bg-green-100 text-green-700' :
                    item.status === 'absent' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.registration.student.user.fullName.split(' ').slice(-1)[0]}
                </span>
              ))}
              {apt.items.length > 5 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  +{apt.items.length - 5} SV khác
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm shrink-0">
          <div className="text-center">
            <div className="font-bold text-gray-900">{apt.items.length}</div>
            <div className="text-xs text-gray-400">SV</div>
          </div>
          {apt.status !== 'scheduled' && (
            <div className="flex gap-2 text-xs">
              <span className="text-green-600 font-medium">{attendedCount} đến</span>
              <span className="text-red-500">{absentCount} vắng</span>
            </div>
          )}
          <Eye className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </Card>
  )
}
