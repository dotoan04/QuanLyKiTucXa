'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, X, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

interface Violation {
  id: string
  violationType: string
  description: string
  penaltyLevel: string
  penaltyAmount: number
  status: string
  createdAt: string
  student: { id: string; fullName: string; studentCode: string }
  reportedByUser?: { id: string; fullName: string }
  incident?: { id: string; title: string }
}

interface Student {
  id: string
  fullName: string
  studentCode: string
}

const TYPE_LABELS: Record<string, string> = {
  noise: 'Gây ồn ào',
  damage: 'Phá hoại tài sản',
  unauthorized_guest: 'Khách không phép',
  theft: 'Trộm cắp',
  assault: 'Bạo lực',
  drug: 'Ma túy',
  gambling: 'Cờ bạc',
  other: 'Khác',
}

const LEVEL_LABELS: Record<string, string> = {
  low: 'Nhẹ',
  medium: 'Trung bình',
  high: 'Nặng',
  severe: 'Rất nặng',
}

const LEVEL_COLORS: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  severe: 'bg-red-200 text-red-900',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  appealed: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processed: 'Đã xử lý',
  appealed: 'Đang khiếu nại',
}

export default function ViolationsPage() {
  const [items, setItems] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Violation | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [form, setForm] = useState({ violationType: 'noise', description: '' })

  const LIMIT = 10

  useEffect(() => { fetchItems() }, [page, statusFilter])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/violations', { params })
      const data = res.data.data as Record<string, unknown> | undefined
      const rawList = Array.isArray(data?.violations)
        ? data.violations
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : []
      setItems(rawList as Violation[])
      setTotal(
        typeof data?.total === 'number'
          ? data.total
          : typeof res.data.meta?.total === 'number'
            ? res.data.meta.total
            : 0
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchStudents = async (q: string) => {
    if (!q.trim()) { setStudentResults([]); return }
    try {
      const res = await api.get('/students', { params: { search: q, limit: 10 } })
      setStudentResults(res.data.data?.students ?? res.data.data ?? [])
    } catch { setStudentResults([]) }
  }

  const handleCreate = async () => {
    if (!selectedStudent || !form.description) return
    setSubmitting(true)
    try {
      await api.post('/violations', {
        studentId: selectedStudent.id,
        type: form.violationType,
        description: form.description,
      })
      setShowCreate(false)
      setForm({ violationType: 'noise', description: '' })
      setSelectedStudent(null)
      setStudentSearch('')
      fetchItems()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleProcess = async (id: string) => {
    setSubmitting(true)
    try {
      await api.put(`/violations/${id}/process`, { violationId: id, penaltyAmount: 0 })
      setSelected(null)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biên bản vi phạm</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các vi phạm nội quy ký túc xá</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Lập biên bản
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p>Chưa có biên bản vi phạm nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sinh viên</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Loại vi phạm</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mức độ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phạt tiền</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày lập</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.student?.fullName}</p>
                      <p className="text-xs text-gray-500">{item.student?.studentCode}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[(item as any).type || item.violationType] ?? (item as any).type ?? item.violationType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[item.penaltyLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                        {LEVEL_LABELS[item.penaltyLevel] ?? item.penaltyLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {item.penaltyAmount > 0 ? `${item.penaltyAmount.toLocaleString('vi-VN')}đ` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(item)} className="text-blue-600 hover:underline text-xs">Chi tiết</button>
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
          <span>Tổng: {total} biên bản</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
            <span className="px-3 py-1">{page}/{totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết biên bản vi phạm</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sinh viên</p>
                  <p className="font-medium text-gray-900">{selected.student?.fullName}</p>
                  <p className="text-gray-500 text-xs">{selected.student?.studentCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Loại vi phạm</p>
                  <p className="text-gray-700">{TYPE_LABELS[(selected as any).type || selected.violationType] ?? (selected as any).type ?? selected.violationType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mức độ</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[selected.penaltyLevel]}`}>
                    {LEVEL_LABELS[selected.penaltyLevel]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phạt tiền</p>
                  <p className="font-semibold text-gray-900">
                    {selected.penaltyAmount > 0 ? `${selected.penaltyAmount.toLocaleString('vi-VN')}đ` : 'Không phạt tiền'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày lập</p>
                  <p className="text-gray-700">{new Date(selected.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Mô tả vi phạm</p>
                <p className="text-gray-700">{selected.description}</p>
              </div>
              {selected.reportedByUser && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Người lập biên bản</p>
                  <p className="text-gray-700">{selected.reportedByUser.fullName}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              {selected.status === 'pending' && (
                <button
                  onClick={() => handleProcess(selected.id)}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Đang xử lý...' : 'Đánh dấu đã xử lý'}
                </button>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Lập biên bản vi phạm</h2>
              <button onClick={() => { setShowCreate(false); setSelectedStudent(null); setStudentSearch('') }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinh viên <span className="text-red-500">*</span></label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-blue-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedStudent.fullName}</p>
                      <p className="text-xs text-gray-500">{selectedStudent.studentCode}</p>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value) }}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tìm theo tên hoặc mã sinh viên..."
                    />
                    {studentResults.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {studentResults.map(s => (
                          <li
                            key={s.id}
                            onClick={() => { setSelectedStudent(s); setStudentResults([]) }}
                            className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                          >
                            <span className="font-medium">{s.fullName}</span>
                            <span className="text-gray-500 ml-2">{s.studentCode}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại vi phạm</label>
                <select
                  value={form.violationType}
                  onChange={e => setForm(f => ({ ...f, violationType: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả hành vi vi phạm, thời gian, địa điểm..."
                />
              </div>
              <div className="bg-yellow-50 rounded-lg px-3 py-2 text-xs text-yellow-700">
                Mức phạt sẽ được tự động xác định dựa trên loại vi phạm và lịch sử vi phạm của sinh viên.
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => { setShowCreate(false); setSelectedStudent(null); setStudentSearch('') }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !selectedStudent || !form.description}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                {submitting ? 'Đang lưu...' : 'Lập biên bản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
