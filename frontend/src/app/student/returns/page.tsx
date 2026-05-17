'use client'

import { useState, useEffect } from 'react'
import { LogOut, X, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

interface ReturnRequest {
  id: string
  status: string
  requestedReturnDate: string
  scheduledDate?: string
  actualReturnDate?: string
  damageNotes?: string
  damageAmount?: number
  refundAmount?: number
  depositAmount?: number
  createdAt: string
  contract?: {
    id: string
    room?: { roomNumber: string; building: string; floor: number }
    depositAmount?: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xét duyệt',
  scheduled: 'Đã lên lịch kiểm tra',
  inspected: 'Đã kiểm tra',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
  inspected: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  scheduled: <Clock className="w-4 h-4" />,
  inspected: <AlertCircle className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
}

export default function StudentReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<ReturnRequest | null>(null)
  const [requestedDate, setRequestedDate] = useState('')
  const [activeContractId, setActiveContractId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [returnsRes, contractRes] = await Promise.allSettled([
        api.get('/returns/my'),
        api.get('/contracts', { params: { status: 'active', limit: 1 } }),
      ])
      if (returnsRes.status === 'fulfilled') {
        setRequests(returnsRes.value.data.data ?? [])
      }
      if (contractRes.status === 'fulfilled') {
        const contracts = contractRes.value.data.data?.contracts ?? contractRes.value.data.data ?? []
        const active = contracts.find((c: any) => c.status === 'active')
        setActiveContractId(active?.id || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!requestedDate) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/returns', { contractId: activeContractId, returnDate: requestedDate })
      setShowCreate(false)
      setRequestedDate('')
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await api.delete(`/returns/${id}`)
      setSelected(null)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const hasPending = requests.some(r => r.status === 'pending' || r.status === 'scheduled')

  // Minimum return date: 7 days from today
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 7)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trả phòng</h1>
          <p className="text-sm text-gray-500 mt-1">Đăng ký thủ tục trả phòng ký túc xá</p>
        </div>
        {activeContractId && !hasPending && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng ký trả phòng
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Lưu ý khi trả phòng:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>Đăng ký trước ít nhất 7 ngày trước ngày muốn trả phòng.</li>
          <li>Đảm bảo không có hóa đơn chưa thanh toán.</li>
          <li>Tài sản hư hỏng sẽ bị trừ vào tiền cọc khi hoàn trả.</li>
        </ul>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Lịch sử yêu cầu trả phòng</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <LogOut className="w-10 h-10 mb-3 opacity-30" />
            <p>Chưa có yêu cầu trả phòng nào</p>
          </div>
        ) : (
          <div className="divide-y">
            {requests.map(req => (
              <div
                key={req.id}
                onClick={() => setSelected(req)}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[req.status]}`}>
                    {STATUS_ICONS[req.status] ?? <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Yêu cầu trả phòng ngày {new Date(req.requestedReturnDate).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Đăng ký: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      {req.contract?.room && ` · Phòng ${req.contract.room.building}-${req.contract.room.roomNumber}`}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                  {STATUS_LABELS[req.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết yêu cầu trả phòng</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                {selected.contract?.room && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phòng</p>
                    <p className="text-gray-700">{selected.contract.room.building} - P.{selected.contract.room.roomNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày muốn trả</p>
                  <p className="text-gray-700">{new Date(selected.requestedReturnDate).toLocaleDateString('vi-VN')}</p>
                </div>
                {selected.scheduledDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày kiểm tra</p>
                    <p className="text-gray-700">{new Date(selected.scheduledDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {selected.depositAmount != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tiền cọc</p>
                    <p className="font-semibold text-gray-900">{formatVnd(selected.depositAmount)}</p>
                  </div>
                )}
                {selected.damageAmount != null && selected.damageAmount > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phí bồi thường</p>
                    <p className="font-semibold text-red-600">{formatVnd(selected.damageAmount)}</p>
                  </div>
                )}
                {selected.refundAmount != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tiền hoàn trả</p>
                    <p className="font-semibold text-green-600">{formatVnd(selected.refundAmount)}</p>
                  </div>
                )}
              </div>
              {selected.damageNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ghi chú kiểm tra</p>
                  <p className="text-gray-700">{selected.damageNotes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              {selected.status === 'pending' && (
                <button
                  onClick={() => handleCancel(selected.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  Hủy yêu cầu
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
              <h2 className="text-lg font-semibold text-gray-900">Đăng ký trả phòng</h2>
              <button onClick={() => { setShowCreate(false); setError('') }}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày muốn trả phòng <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={requestedDate}
                  min={minDateStr}
                  onChange={e => setRequestedDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Phải đăng ký trước ít nhất 7 ngày</p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => { setShowCreate(false); setError('') }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button
                onClick={handleCreate}
                disabled={submitting || !requestedDate}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
