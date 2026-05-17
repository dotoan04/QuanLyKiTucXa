'use client'

import { useState, useEffect } from 'react'
import { ArrowRightLeft, X, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

interface Transfer {
  id: string
  status: string
  reason?: string
  transferFee?: number
  reviewNote?: string
  createdAt: string
  contract: {
    id: string
    student: { id: string; fullName: string; studentCode: string }
    room: { id: string; roomNumber: string; building: string; floor: number }
  }
  toRoom: { id: string; roomNumber: string; building: string; floor: number }
  reviewer?: { id: string; fullName: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function TransfersPage() {
  const [items, setItems] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Transfer | null>(null)
  const [processing, setProcessing] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [showProcess, setShowProcess] = useState<'approve' | 'reject' | null>(null)

  const LIMIT = 10

  useEffect(() => {
    fetchItems()
  }, [page, statusFilter])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/transfers', { params })
      const data = res.data.data
      const list = asArray<Transfer>(data?.items ?? data?.transfers ?? data)
      setItems(list)
      setTotal(Number(data?.total ?? res.data.meta?.total ?? list.length))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selected) return
    setProcessing(true)
    try {
      await api.put(`/transfers/${selected.id}/process`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewNote: reviewNote || undefined,
      })
      setShowProcess(null)
      setSelected(null)
      setReviewNote('')
      fetchItems()
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu chuyển phòng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xử lý các yêu cầu chuyển phòng của sinh viên</p>
        </div>
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
            <ArrowRightLeft className="w-12 h-12 mb-3 opacity-30" />
            <p>Chưa có yêu cầu chuyển phòng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sinh viên</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phòng hiện tại</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phòng muốn chuyển</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phí chuyển</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày yêu cầu</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.contract?.student?.fullName}</p>
                      <p className="text-xs text-gray-500">{item.contract?.student?.studentCode}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.contract?.room
                        ? `${item.contract.room.building} - P.${item.contract.room.roomNumber}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.toRoom
                        ? `${item.toRoom.building} - P.${item.toRoom.roomNumber}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.transferFee != null
                        ? `${item.transferFee.toLocaleString('vi-VN')}đ`
                        : '0đ'}
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
                      <button
                        onClick={() => { setSelected(item); setShowProcess(null) }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Chi tiết
                      </button>
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
          <span>Tổng: {total} yêu cầu</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
            <span className="px-3 py-1">{page}/{totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
          </div>
        </div>
      )}

      {/* Detail / Process Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết yêu cầu chuyển phòng</h2>
              <button onClick={() => { setSelected(null); setShowProcess(null); setReviewNote('') }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sinh viên</p>
                  <p className="font-medium text-gray-900">{selected.contract?.student?.fullName}</p>
                  <p className="text-gray-500 text-xs">{selected.contract?.student?.studentCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phòng hiện tại</p>
                  <p className="text-gray-700">
                    {selected.contract?.room
                      ? `${selected.contract.room.building} - Tầng ${selected.contract.room.floor} - P.${selected.contract.room.roomNumber}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phòng muốn chuyển</p>
                  <p className="text-gray-700">
                    {selected.toRoom
                      ? `${selected.toRoom.building} - Tầng ${selected.toRoom.floor} - P.${selected.toRoom.roomNumber}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phí chuyển phòng</p>
                  <p className="font-semibold text-gray-900">
                    {selected.transferFee != null ? `${selected.transferFee.toLocaleString('vi-VN')}đ` : '0đ'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày yêu cầu</p>
                  <p className="text-gray-700">{new Date(selected.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              {selected.reason && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Lý do</p>
                  <p className="text-gray-700 text-sm">{selected.reason}</p>
                </div>
              )}
              {selected.reviewNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ghi chú xét duyệt</p>
                  <p className="text-gray-700 text-sm">{selected.reviewNote}</p>
                </div>
              )}

              {/* Process action */}
              {selected.status === 'pending' && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Xử lý yêu cầu</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ghi chú (tùy chọn)</label>
                    <textarea
                      rows={2}
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú khi duyệt hoặc từ chối..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcess('approve')}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {processing ? 'Đang xử lý...' : 'Duyệt'}
                    </button>
                    <button
                      onClick={() => handleProcess('reject')}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {processing ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t">
              <button
                onClick={() => { setSelected(null); setShowProcess(null); setReviewNote('') }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
