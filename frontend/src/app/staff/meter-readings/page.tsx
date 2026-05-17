'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import api from '@/lib/api'
import { 
  Search, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Droplets,
  Ban
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

interface RoomToRead {
  room: {
    id: string
    roomNumber: string
    building: string
    floor: number
  }
  status: 'not_started' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'remeasure'
  readingId?: string
  prevElectricity: number
  prevWater: number
  currentReading: {
    electricityNew: number
    waterNew: number
    electricityPhoto?: string
    waterPhoto?: string
    isAnomaly: boolean
    unreadable: boolean
  } | null
}

export default function MeterReadingsPage() {
  const { user } = useAuthStore()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [rooms, setRooms] = useState<RoomToRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomToRead | null>(null)
  
  // Forms
  const [recordForm, setRecordForm] = useState({
    electricityNew: '',
    waterNew: '',
    photoUrl: ''
  })
  const [issueForm, setIssueForm] = useState({
    reason: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [monthSubmittedToAccountant, setMonthSubmittedToAccountant] = useState(false)

  const effectiveMonthLocked = monthSubmittedToAccountant && user?.role !== 'admin'

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await api.get('/meter-readings/rooms-to-read', { params: { month } })
      const payload = res.data.data
      const list = Array.isArray(payload) ? payload : payload?.rooms
      setRooms(Array.isArray(list) ? list : [])
      setMonthSubmittedToAccountant(
        Array.isArray(payload) ? false : Boolean(payload?.monthSubmittedToAccountant)
      )
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [month])

  const handleOpenRecordModal = (room: RoomToRead) => {
    setSelectedRoom(room)
    setRecordForm({
      electricityNew: room.currentReading?.electricityNew?.toString() || '',
      waterNew: room.currentReading?.waterNew?.toString() || '',
      photoUrl: ''
    })
    setIsRecordModalOpen(true)
  }

  const handleOpenIssueModal = (room: RoomToRead) => {
    setSelectedRoom(room)
    setIssueForm({ reason: '' })
    setIsIssueModalOpen(true)
  }

  const handleRecordSubmit = async () => {
    if (!selectedRoom) return
    
    const elecNew = Number(recordForm.electricityNew)
    const waterNew = Number(recordForm.waterNew)
    
    if (elecNew < selectedRoom.prevElectricity) {
      alert(`Chỉ số điện mới (${elecNew}) không được nhỏ hơn chỉ số cũ (${selectedRoom.prevElectricity})`)
      return
    }
    if (waterNew < selectedRoom.prevWater) {
      alert(`Chỉ số nước mới (${waterNew}) không được nhỏ hơn chỉ số cũ (${selectedRoom.prevWater})`)
      return
    }

    try {
      setSubmitting(true)
      await api.post('/meter-readings/record', {
        roomId: selectedRoom.room.id,
        month,
        electricityNew: elecNew,
        waterNew: waterNew,
        photoUrl: recordForm.photoUrl || undefined
      })
      setIsRecordModalOpen(false)
      fetchRooms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi ghi chỉ số')
    } finally {
      setSubmitting(false)
    }
  }

  const handleIssueSubmit = async () => {
    if (!selectedRoom || !issueForm.reason.trim()) return

    try {
      setSubmitting(true)
      await api.post('/meter-readings/mark-unreadable', {
        roomId: selectedRoom.room.id,
        month,
        reason: issueForm.reason
      })
      setIsIssueModalOpen(false)
      fetchRooms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi báo sự cố')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitMonth = async () => {
    if (!confirm(`Bạn có chắc muốn chốt khối lượng tháng ${month} và gửi cho kế toán? Sau khi chốt, kỹ thuật không thể sửa chỉ số trừ khi kế toán yêu cầu đo lại.`)) return
    
    try {
      setSubmitting(true)
      const res = await api.post('/meter-readings/submit-month', { month })
      const { submitted, alreadySubmitted } = res.data.data || {}
      if (alreadySubmitted) {
        alert('Tháng này đã được chốt trước đó. Nếu cần cho kỹ thuật sửa lại, quản trị viên dùng chức năng mở khóa tháng trên trang Duyệt chỉ số (admin).')
      } else {
        alert(`Đã chốt tháng và gửi thông báo cho kế toán. Số bản ghi chờ duyệt: ${submitted ?? 0}`)
      }
      fetchRooms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi thông báo')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRooms = rooms.filter(r => 
    r.room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.room.building.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: rooms.length,
    completed: rooms.filter(r => ['submitted', 'approved'].includes(r.status)).length,
    issues: rooms.filter(r => r.currentReading?.unreadable).length,
    pending: rooms.filter(r => ['not_started', 'draft', 'remeasure'].includes(r.status)).length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ghi chỉ số Định kỳ</h1>
          <p className="text-gray-500 mt-1">Ghi chỉ số điện nước hàng tháng cho các phòng</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            onClick={handleSubmitMonth}
            disabled={submitting || stats.completed === 0 || effectiveMonthLocked}
            title={effectiveMonthLocked ? 'Tháng đã chốt gửi kế toán' : undefined}
          >
            Chốt tháng & Báo kế toán
          </Button>
        </div>
      </div>

      {monthSubmittedToAccountant && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            user?.role === 'admin'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          {user?.role === 'admin' ? (
            <p>
              Tháng <strong>{month}</strong> đã được chốt gửi kế toán. Bạn (admin) vẫn có thể ghi/sửa chỉ số; kỹ thuật viên thì không, trừ các phòng đang trạng thái <strong>Đo lại</strong> do kế toán yêu cầu.
            </p>
          ) : (
            <p>
              Tháng <strong>{month}</strong> đã chốt gửi kế toán — không thể sửa hoặc thêm chỉ số, trừ phòng đang <strong>Đo lại</strong>. Cần chỉnh toàn bộ tháng: nhờ quản trị mở khóa tháng.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng phòng</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </Card>
        
        <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đã ghi</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
        </Card>

        <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ghi lại / Chưa ghi</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </Card>

        <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sự cố công tơ</p>
            <p className="text-2xl font-bold text-gray-900">{stats.issues}</p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="relative w-64">
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
                <th className="p-4 font-medium text-gray-500 text-sm">Chỉ số Điện (Cũ → Mới)</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Chỉ số Nước (Cũ → Mới)</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Trạng thái</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Không có phòng nào cần ghi cho tháng {month}
                  </td>
                </tr>
              ) : (
                filteredRooms.map((r) => (
                  <tr key={r.room.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">Phòng {r.room.roomNumber}</div>
                      <div className="text-sm text-gray-500">Tòa {r.room.building} - Tầng {r.room.floor}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-500">{r.prevElectricity}</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-medium ${r.currentReading?.isAnomaly ? 'text-orange-600' : 'text-gray-900'}`}>
                          {r.currentReading?.electricityNew ?? '--'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-500">{r.prevWater}</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-medium ${r.currentReading?.isAnomaly ? 'text-orange-600' : 'text-gray-900'}`}>
                          {r.currentReading?.waterNew ?? '--'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                      {r.currentReading?.unreadable && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Lỗi đồng hồ
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenRecordModal(r)}
                          disabled={
                            r.status === 'approved' ||
                            (effectiveMonthLocked && r.status !== 'remeasure')
                          }
                          title={
                            effectiveMonthLocked && r.status !== 'remeasure'
                              ? 'Tháng đã chốt — chỉ ghi được khi kế toán yêu cầu đo lại'
                              : undefined
                          }
                        >
                          Ghi
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleOpenIssueModal(r)}
                          disabled={
                            r.status === 'approved' ||
                            (effectiveMonthLocked && r.status !== 'remeasure')
                          }
                          title={
                            effectiveMonthLocked && r.status !== 'remeasure'
                              ? 'Tháng đã chốt'
                              : undefined
                          }
                        >
                          Báo lỗi
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={`Ghi chốt phòng ${selectedRoom?.room?.roomNumber}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRecordModalOpen(false)}>Hủy</Button>
            <Button onClick={handleRecordSubmit} disabled={submitting}>Lưu chỉ số</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-500">Tháng</p>
              <p className="font-medium">{month}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Chỉ số cũ</p>
              <p className="font-medium text-yellow-600">⚡ {selectedRoom?.prevElectricity}</p>
              <p className="font-medium text-blue-600">💧 {selectedRoom?.prevWater}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chỉ số Điện MỚI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={selectedRoom?.prevElectricity}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={recordForm.electricityNew}
                  onChange={e => setRecordForm({...recordForm, electricityNew: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chỉ số Nước MỚI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={selectedRoom?.prevWater}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={recordForm.waterNew}
                  onChange={e => setRecordForm({...recordForm, waterNew: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh chụp đồng hồ (URL)</label>
              <input
                type="url"
                placeholder="https://example.com/anh-dong-ho.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={recordForm.photoUrl || ''}
                onChange={e => setRecordForm({...recordForm, photoUrl: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Dán URL ảnh minh chứng (tùy chọn)</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={`Báo lỗi đồng hồ phòng ${selectedRoom?.room?.roomNumber}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsIssueModalOpen(false)}>Hủy</Button>
            <Button onClick={handleIssueSubmit} variant="danger" disabled={submitting}>Báo sự cố</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Hành động này sẽ tạo một ticket sửa chữa khẩn cấp cho phòng này tới bộ phận kỹ thuật.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết sự cố <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="VD: Không đọc được số, mờ, đồng hồ chạy ngược, hoặc bị hỏng..."
              value={issueForm.reason}
              onChange={e => setIssueForm({ reason: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
