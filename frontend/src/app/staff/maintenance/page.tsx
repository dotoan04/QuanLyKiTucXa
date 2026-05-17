'use client'

import { useState, useEffect } from 'react'
import { Plus, Wrench, Calendar, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react'
import api from '@/lib/api'

interface MaintenanceItem {
  id: string
  title: string
  description?: string
  type: string
  status: string
  scheduledAt: string
  completedAt?: string
  area?: string
  notes?: string
  cost?: number
  room?: { id: string; roomNumber: string; building: string; floor: number }
  assignee?: { id: string; fullName: string; email: string }
}

interface User {
  id: string
  fullName: string
  email: string
}

const TYPE_LABELS: Record<string, string> = {
  preventive: 'Phòng ngừa',
  corrective: 'Khắc phục',
  inspection: 'Kiểm tra',
  emergency: 'Khẩn cấp',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const TYPE_COLORS: Record<string, string> = {
  preventive: 'bg-purple-100 text-purple-700',
  corrective: 'bg-orange-100 text-orange-700',
  inspection: 'bg-sky-100 text-sky-700',
  emergency: 'bg-red-100 text-red-700',
}

export default function MaintenancePage() {
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<MaintenanceItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Create form
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'preventive',
    area: '',
    scheduledAt: '',
    assigneeId: '',
  })

  // Complete form
  const [completeForm, setCompleteForm] = useState({ notes: '', cost: '' })

  const LIMIT = 10

  useEffect(() => {
    fetchItems()
  }, [page, statusFilter, typeFilter])

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      const res = await api.get('/maintenance', { params })
      setItems(res.data.data.items ?? res.data.data)
      setTotal(res.data.data.total ?? res.data.meta?.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/auth/users', { params: { limit: 100 } })
      const users: User[] = res.data.data?.users ?? res.data.data ?? []
      setTechnicians(users.filter((u: User & { role?: string }) => u.role === 'technician' || u.role === 'staff'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.scheduledAt) return
    setSubmitting(true)
    try {
      await api.post('/maintenance', {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        assigneeId: form.assigneeId || undefined,
        description: form.description || undefined,
        area: form.area || undefined,
      })
      setShowCreate(false)
      setForm({ title: '', description: '', type: 'preventive', area: '', scheduledAt: '', assigneeId: '' })
      fetchItems()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await api.put(`/maintenance/${selected.id}/complete`, {
        notes: completeForm.notes || undefined,
        cost: completeForm.cost ? parseFloat(completeForm.cost) : undefined,
      })
      setShowComplete(false)
      setSelected(null)
      setCompleteForm({ notes: '', cost: '' })
      fetchItems()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch bảo trì</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý lịch bảo trì và sửa chữa cơ sở vật chất</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tạo lịch mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench className="w-12 h-12 mb-3 opacity-30" />
            <p>Chưa có lịch bảo trì nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tiêu đề</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Khu vực</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày lên lịch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phụ trách</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.room
                        ? `${item.room.building} - P.${item.room.roomNumber}`
                        : (item.area ?? '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(item.scheduledAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.assignee?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(item)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Chi tiết
                        </button>
                        {item.status !== 'completed' && item.status !== 'cancelled' && (
                          <button
                            onClick={() => { setSelected(item); setShowComplete(true) }}
                            className="text-green-600 hover:underline text-xs"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Tổng: {total} bản ghi</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="px-3 py-1">{page}/{totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && !showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết bảo trì</h2>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiêu đề</p>
                <p className="font-semibold text-gray-900">{selected.title}</p>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mô tả</p>
                  <p className="text-gray-700">{selected.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Loại</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[selected.type] ?? ''}`}>
                    {TYPE_LABELS[selected.type] ?? selected.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status] ?? ''}`}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày lên lịch</p>
                  <p className="text-gray-700">{new Date(selected.scheduledAt).toLocaleString('vi-VN')}</p>
                </div>
                {selected.completedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày hoàn thành</p>
                    <p className="text-gray-700">{new Date(selected.completedAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Khu vực</p>
                  <p className="text-gray-700">
                    {selected.room
                      ? `${selected.room.building} - Tầng ${selected.room.floor} - P.${selected.room.roomNumber}`
                      : (selected.area ?? '—')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phụ trách</p>
                  <p className="text-gray-700">{selected.assignee?.fullName ?? '—'}</p>
                </div>
                {selected.cost != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Chi phí</p>
                    <p className="font-semibold text-gray-900">{selected.cost.toLocaleString('vi-VN')}đ</p>
                  </div>
                )}
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                  <p className="text-gray-700">{selected.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                <button
                  onClick={() => setShowComplete(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Nghiệm thu
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showComplete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nghiệm thu bảo trì</h2>
              <button onClick={() => setShowComplete(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Xác nhận hoàn thành: <strong>{selected.title}</strong></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nghiệm thu</label>
                <textarea
                  rows={3}
                  value={completeForm.notes}
                  onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả công việc đã thực hiện..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí (đồng)</label>
                <input
                  type="number"
                  value={completeForm.cost}
                  onChange={e => setCompleteForm(f => ({ ...f, cost: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowComplete(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Đang lưu...' : 'Xác nhận hoàn thành'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Tạo lịch bảo trì mới</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả công việc bảo trì..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại bảo trì</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thực hiện <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực / địa điểm</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Khu A - Tầng 2, Hệ thống điện..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giao cho</label>
                <select
                  value={form.assigneeId}
                  onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chưa phân công --</option>
                  {technicians.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả thêm về công việc cần thực hiện..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.title || !form.scheduledAt}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                {submitting ? 'Đang tạo...' : 'Tạo lịch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
