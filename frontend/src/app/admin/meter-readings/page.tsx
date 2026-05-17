'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { 
  Search, 
  CheckCircle2,
  XCircle,
  Zap,
  Droplets,
  Filter,
  AlertTriangle
} from 'lucide-react'

interface Reading {
  id: string
  month: string
  electricityOld: string
  electricityNew: string
  waterOld: string
  waterNew: string
  isAnomaly: boolean
  anomalyNote: string | null
  unreadable: boolean
  unreadableReason: string | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'remeasure'
  recorder: { fullName: string }
  room: { roomNumber: string; building: string }
}

export default function AdminMeterReadingsPage() {
  const { user } = useAuthStore()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const fetchReadings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/meter-readings', { 
        params: { 
          month,
          status: statusFilter !== 'all' ? statusFilter : undefined
        } 
      })
      setReadings(res.data.data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadings()
  }, [month, statusFilter])

  const handleApprove = async (id: string) => {
    if (!confirm('Duyệt chỉ số này? Không thể hoàn tác sau khi duyệt.')) return
    try {
      setSubmitting(true)
      await api.post(`/meter-readings/${id}/approve`)
      fetchReadings()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi duyệt chỉ số')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenReject = (reading: Reading) => {
    setSelectedReading(reading)
    setRejectNote('')
    setIsRejectModalOpen(true)
  }

  const handleRejectSubmit = async () => {
    if (!selectedReading || !rejectNote.trim()) return
    
    try {
      setSubmitting(true)
      await api.post(`/meter-readings/${selectedReading.id}/request-remeasure`, {
        note: rejectNote
      })
      setIsRejectModalOpen(false)
      fetchReadings()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi yêu cầu đo lại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlockMonthForTechnician = async () => {
    if (!confirm(`Mở khóa tháng ${month} để kỹ thuật có thể ghi/sửa lại chỉ số (trừ bản ghi đã duyệt)?`)) return
    try {
      setUnlocking(true)
      await api.post('/meter-readings/unlock-month', { month })
      alert('Đã mở khóa tháng cho kỹ thuật.')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không mở khóa được')
    } finally {
      setUnlocking(false)
    }
  }

  const filteredReadings = readings.filter(r => 
    r.room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.room.building.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyệt Chỉ số Điện Nước</h1>
          <p className="text-gray-500 mt-1">Duyệt chỉ số do kỹ thuật gửi lên để tính tiền</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={handleUnlockMonthForTechnician}
              loading={unlocking}
              className="border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              Mở khóa tháng (kỹ thuật)
            </Button>
          )}
        </div>
      </div>

      {user?.role === 'admin' && (
        <p className="text-sm text-gray-600">
          Sau khi kỹ thuật <strong>chốt tháng</strong>, họ không sửa được chỉ số cho đến khi bạn mở khóa ở đây, hoặc khi kế toán gửi <strong>Đo lại</strong> từng phòng.
        </p>
      )}

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl gap-4 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'submitted', 'approved', 'remeasure'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'Tất cả' : 
                 status === 'submitted' ? 'Chờ duyệt' : 
                 status === 'approved' ? 'Đã duyệt' : 'Yêu cầu đo lại'}
              </button>
            ))}
          </div>

          <div className="relative w-64 lg:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm số phòng, tòa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-medium text-gray-500 text-sm">Phòng</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Chỉ số Điện</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Chỉ số Nước</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Ghi chú / Cảnh báo</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Trạng thái</th>
                <th className="p-4 font-medium text-gray-500 text-sm text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Không có dữ liệu cho tháng {month}
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">Phòng {r.room.roomNumber}</div>
                      <div className="text-sm text-gray-500">Tòa {r.room.building}</div>
                      <div className="text-xs text-gray-400 mt-1">Ghi bởi: {r.recorder?.fullName}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-500">{r.electricityOld}</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-medium ${r.isAnomaly ? 'text-orange-600' : 'text-gray-900'}`}>{r.electricityNew}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Tiêu thụ: {Number(r.electricityNew) - Number(r.electricityOld)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-500">{r.waterOld}</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-medium ${r.isAnomaly ? 'text-orange-600' : 'text-gray-900'}`}>{r.waterNew}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Tiêu thụ: {Number(r.waterNew) - Number(r.waterOld)}</div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      {r.unreadable ? (
                        <div className="text-xs text-red-600 flex items-start gap-1">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> 
                          {r.unreadableReason || 'Lỗi đồng hồ'}
                        </div>
                      ) : r.isAnomaly ? (
                        <div className="text-xs text-orange-600 flex items-start gap-1">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> 
                          {r.anomalyNote || 'Tăng đột biến'}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">--</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'submitted' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleOpenReject(r)}
                          >
                            Đo lại
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(r.id)}
                            disabled={submitting}
                          >
                            Duyệt
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Yêu cầu đo lại - Phòng ${selectedReading?.room?.roomNumber}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Hủy</Button>
            <Button onClick={handleRejectSubmit} variant="danger" disabled={submitting}>Gửi yêu cầu</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do yêu cầu đo lại <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="VD: Chỉ số điện tăng vô lý, cần kỹ thuật kiểm tra lại..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
