'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { FileText, XCircle, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Printer } from 'lucide-react'
import api from '@/lib/api'
import { handoverTemplatesFromRoomAndType } from '@/lib/handover-from-amenities'

function openContractPrint(contractId: string) {
  window.open(`/print/contract/${contractId}`, '_blank')
}

function isHandoverCompleted(handover: any): boolean {
  return Boolean(handover?.completedAt)
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AssetItem {
  name: string
  condition: 'good' | 'normal' | 'broken'
  note: string
}

interface StudentInfo {
  id: string
  studentCode: string
  faculty: string
  academicYear: string
  user: { fullName: string; email: string; phone: string }
  contracts?: any[]
  registrationRequests?: any[]
}

interface RoomOption {
  id: string
  roomNumber: string
  building: string
  floor: number
  slotsLeft: number
  /** CSVC theo phòng (ưu tiên khi bàn giao) */
  amenities?: unknown
  roomType: {
    id: string
    name: string
    capacity: number
    monthlyPrice: number
    amenities: any
  }
}

interface AvailableData {
  buildings: {
    name: string
    floors: { number: number; rooms: RoomOption[] }[]
  }[]
  rooms: RoomOption[]
}

// ─────────────────────────────────────────────────────────
// Terminate Modal
// ─────────────────────────────────────────────────────────
function TerminateModal({ contract, onClose, onDone }: { contract: any; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await api.put(`/contracts/${contract.id}/terminate`, { terminationReason: reason })
      onDone()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Chấm dứt hợp đồng" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="danger" onClick={handleSubmit} disabled={!reason.trim() || loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận chấm dứt'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Bạn sắp chấm dứt hợp đồng của sinh viên <strong>{contract.student?.user?.fullName}</strong> ({contract.student?.studentCode}).
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do chấm dứt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Nhập lý do chấm dứt hợp đồng..."
          />
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────
// Multi-step Create Contract Modal
// ─────────────────────────────────────────────────────────
function CreateContractModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [studentCode, setStudentCode] = useState('')
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [studentError, setStudentError] = useState('')
  const [loadingStudent, setLoadingStudent] = useState(false)

  const [availableData, setAvailableData] = useState<AvailableData | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('')
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [depositAmount, setDepositAmount] = useState('')

  const [assetItems, setAssetItems] = useState<AssetItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const studentInputRef = useRef<HTMLInputElement>(null)

  // Load available rooms on mount
  useEffect(() => {
    api.get('/rooms/available').then(res => {
      setAvailableData(res.data.data)
    }).catch(console.error)
  }, [])

  // When room is selected, auto-fill rent + CSVC (theo phòng, không thì theo loại phòng)
  useEffect(() => {
    if (!selectedRoom) return
    setMonthlyRent(String(selectedRoom.roomType.monthlyPrice))
    const templates = handoverTemplatesFromRoomAndType(
      selectedRoom.amenities,
      selectedRoom.roomType.amenities
    )
    setAssetItems(
      templates.map((t) => ({
        name: t.name,
        condition: (t.defaultCondition === 'normal' || t.defaultCondition === 'broken' ? t.defaultCondition : 'good') as AssetItem['condition'],
        note: ''
      }))
    )
  }, [selectedRoom])

  const handleStudentBlur = async () => {
    if (!studentCode.trim()) return
    setLoadingStudent(true)
    setStudentError('')
    setStudentInfo(null)
    try {
      const res = await api.get(`/students/by-code/${studentCode.trim()}`)
      const sv = res.data.data
      setStudentInfo(sv)
      if (sv.contracts && sv.contracts.length > 0) {
        setStudentError('Sinh viên này đã có hợp đồng đang hoạt động.')
      } else if (sv.registrationRequests && sv.registrationRequests.length > 0) {
        setStudentError('Sinh viên này đang có đơn đăng ký xin phòng, vui lòng duyệt đơn đó thay vì tạo mới.')
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setStudentError('Không tìm thấy sinh viên với mã này.')
      } else {
        setStudentError('Lỗi khi tra cứu sinh viên.')
      }
    } finally {
      setLoadingStudent(false)
    }
  }

  const floors = availableData?.buildings.find(b => b.name === selectedBuilding)?.floors || []
  const rooms = floors.find(f => f.number === selectedFloor)?.rooms || []

  const canGoStep2 = studentInfo && (!studentInfo.contracts || studentInfo.contracts.length === 0) && (!studentInfo.registrationRequests || studentInfo.registrationRequests.length === 0)
  const canGoStep3 = !!selectedRoom
  const canGoStep4 = startDate && monthlyRent

  const handleSubmit = async () => {
    if (!studentInfo || !selectedRoom || !startDate || !monthlyRent) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // 1) Create contract
      const contractRes = await api.post('/contracts', {
        studentId: studentInfo.id,
        roomId: selectedRoom.id,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        monthlyRent: Number(monthlyRent),
        depositAmount: depositAmount ? Number(depositAmount) : 0
      })
      const contractId = contractRes.data.data.id

      // 2) Create handover if items exist
      if (assetItems.length > 0) {
        await api.post(`/contracts/${contractId}/handover`, { items: assetItems })
      }

      onDone()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Tạo hợp đồng thất bại. Vui lòng thử lại.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitles = ['Sinh viên', 'Phòng', 'Thông tin hợp đồng', 'Bàn giao tài sản']

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Tạo hợp đồng mới"
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
            {step === 1 ? 'Hủy' : <><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</>}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !canGoStep2) ||
                (step === 2 && !canGoStep3) ||
                (step === 3 && !canGoStep4)
              }
            >
              Tiếp theo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang tạo...' : <><CheckCircle className="h-4 w-4 mr-2" />Hoàn tất tạo hợp đồng</>}
            </Button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {stepTitles.map((title, i) => {
          const num = i + 1
          const active = num === step
          const done = num < step
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${active ? 'text-primary-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 
                  ${active ? 'border-primary-600 bg-primary-50' : done ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                  {done ? '✓' : num}
                </div>
                <span className="text-xs font-medium hidden sm:block">{title}</span>
              </div>
              {i < stepTitles.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Bước 1: Sinh viên ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã sinh viên <span className="text-red-500">*</span>
            </label>
            <input
              ref={studentInputRef}
              type="text"
              value={studentCode}
              onChange={(e) => { setStudentCode(e.target.value); setStudentInfo(null); setStudentError('') }}
              onBlur={handleStudentBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentBlur()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="VD: SV2024001"
            />
            <p className="text-xs text-gray-500 mt-1">Nhấn Enter hoặc click ra ngoài để tra cứu</p>
          </div>

          {loadingStudent && <p className="text-sm text-blue-600">Đang tra cứu sinh viên...</p>}

          {studentError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {studentError}
            </div>
          )}

          {studentInfo && (!studentInfo.contracts || studentInfo.contracts.length === 0) && (!studentInfo.registrationRequests || studentInfo.registrationRequests.length === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
              <div className="font-semibold text-gray-900 text-base">{studentInfo.user.fullName}</div>
              <div className="text-sm text-gray-600">Mã SV: <span className="font-medium">{studentInfo.studentCode}</span></div>
              {studentInfo.faculty && <div className="text-sm text-gray-600">Khoa: {studentInfo.faculty}</div>}
              {studentInfo.academicYear && <div className="text-sm text-gray-600">Năm học: {studentInfo.academicYear}</div>}
              <div className="text-sm text-gray-600">Email: {studentInfo.user.email}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Bước 2: Phòng ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tòa nhà <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => { setSelectedBuilding(e.target.value); setSelectedFloor(''); setSelectedRoom(null) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn tòa --</option>
              {availableData?.buildings.map(b => (
                <option key={b.name} value={b.name}>Tòa {b.name}</option>
              ))}
            </select>
          </div>

          {selectedBuilding && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tầng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => { setSelectedFloor(Number(e.target.value)); setSelectedRoom(null) }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn tầng --</option>
                {floors.map(f => (
                  <option key={f.number} value={f.number}>Tầng {f.number}</option>
                ))}
              </select>
            </div>
          )}

          {selectedFloor !== '' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRoom?.id || ''}
                onChange={(e) => setSelectedRoom(rooms.find(r => r.id === e.target.value) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.roomNumber} — {r.roomType.name} ({r.slotsLeft}/{r.roomType.capacity} chỗ trống)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedRoom && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1 text-sm">
              <div className="font-semibold text-gray-900">Phòng {selectedRoom.roomNumber}</div>
              <div className="text-gray-600">Loại phòng: {selectedRoom.roomType.name}</div>
              <div className="text-gray-600">Sức chứa: {selectedRoom.roomType.capacity} người • Còn {selectedRoom.slotsLeft} chỗ</div>
              <div className="text-gray-600">Giá thuê: {Number(selectedRoom.roomType.monthlyPrice).toLocaleString('vi-VN')} đ/tháng</div>
            </div>
          )}
        </div>
      )}

      {/* ── Bước 3: Thông tin hợp đồng ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền thuê/tháng (đ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="VNĐ"
              />
              <p className="text-xs text-gray-500 mt-1">Tự động lấy từ loại phòng</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền đặt cọc (đ)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="VNĐ"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-gray-700">Tóm tắt hợp đồng</p>
            <div className="text-gray-600">Sinh viên: <span className="font-medium">{studentInfo?.user.fullName}</span> ({studentInfo?.studentCode})</div>
            <div className="text-gray-600">Phòng: <span className="font-medium">{selectedRoom?.roomNumber}</span> — Tòa {selectedRoom?.building}, Tầng {selectedRoom?.floor}</div>
          </div>
        </div>
      )}

      {/* ── Bước 4: Bàn giao tài sản ── */}
      {step === 4 && (
        <div className="space-y-4">
          {assetItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có danh sách CSVC cho phòng này.</p>
              <p className="text-sm mt-1">
                Thêm CSVC tại Quản lý phòng (theo phòng) hoặc Quản lý loại phòng, rồi chọn lại phòng ở bước 2. Bạn vẫn có thể hoàn tất tạo hợp đồng mà không ghi bàn giao.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Ghi nhận tình trạng tài sản khi bàn giao cho sinh viên:
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {assetItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-start bg-gray-50 rounded-lg p-3">
                    <div className="col-span-4 text-sm font-medium text-gray-800 pt-1">{item.name}</div>
                    <div className="col-span-4">
                      <select
                        value={item.condition}
                        onChange={(e) => {
                          const updated = [...assetItems]
                          updated[idx] = { ...updated[idx], condition: e.target.value as any }
                          setAssetItems(updated)
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="good">Tốt</option>
                        <option value="normal">Bình thường</option>
                        <option value="broken">Hỏng</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => {
                          const updated = [...assetItems]
                          updated[idx] = { ...updated[idx], note: e.target.value }
                          setAssetItems(updated)
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ghi chú..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {submitError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {submitError}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────
// Contract Detail Modal (với AssetHandover)
// ─────────────────────────────────────────────────────────
function ContractDetailModal({ contract, onClose, onTerminate }: { contract: any; onClose: () => void; onTerminate: () => void }) {
  const [handover, setHandover] = useState<any>(null)
  const [loadingHandover, setLoadingHandover] = useState(true)
  const [showTerminate, setShowTerminate] = useState(false)

  useEffect(() => {
    api.get(`/contracts/${contract.id}/handover`)
      .then(res => setHandover(res.data.data))
      .catch(() => setHandover(null))
      .finally(() => setLoadingHandover(false))
  }, [contract.id])

  const conditionLabel: Record<string, string> = { good: 'Tốt', normal: 'Bình thường', broken: 'Hỏng' }
  const conditionColor: Record<string, string> = { good: 'text-green-600', normal: 'text-yellow-600', broken: 'text-red-600' }

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Chi tiết hợp đồng — ${contract.id.slice(0, 8).toUpperCase()}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Sinh viên + Phòng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Sinh viên</p>
              <div className="font-semibold text-gray-900">{contract.student?.user?.fullName}</div>
              <div className="text-sm text-gray-600">{contract.student?.studentCode}</div>
              <div className="text-sm text-gray-600">{contract.student?.user?.email}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Phòng</p>
              <div className="font-semibold text-gray-900">{contract.room?.roomNumber}</div>
              <div className="text-sm text-gray-600">Tòa {contract.room?.building} — Tầng {contract.room?.floor}</div>
              <div className="text-sm text-gray-600">{contract.room?.roomType?.name}</div>
            </div>
          </div>

          {/* Ngày + Giá */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-0.5">Ngày bắt đầu</p>
              <p className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Ngày kết thúc</p>
              <p className="font-medium">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Tiền thuê/tháng</p>
              <p className="font-medium">{Number(contract.monthlyRent).toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Tiền đặt cọc</p>
              <p className="font-medium">{Number(contract.depositAmount).toLocaleString('vi-VN')} đ</p>
            </div>
          </div>

          {/* Trạng thái + actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status={contract.status} />
            {contract.status === 'active' && (
              <Button variant="danger" size="sm" onClick={() => setShowTerminate(true)}>
                <XCircle className="h-4 w-4 mr-1" />
                Chấm dứt hợp đồng
              </Button>
            )}
            {isHandoverCompleted(handover) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openContractPrint(contract.id)}
              >
                <Printer className="h-4 w-4 mr-1" />
                In hợp đồng
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled title="Cần hoàn tất bàn giao cơ sở vật chất trước khi in hợp đồng">
                <Printer className="h-4 w-4 mr-1" />
                Chờ bàn giao
              </Button>
            )}
          </div>

          {/* Bàn giao tài sản */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Bàn giao cơ sở vật chất</h3>
            {loadingHandover ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : handover ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Ngày bàn giao: {new Date(handover.handoverAt).toLocaleDateString('vi-VN')}</span>
                  <span>{isHandoverCompleted(handover) ? 'Đã hoàn tất bàn giao' : 'Chưa hoàn tất bàn giao'}</span>
                  {handover.confirmer && <span>Xác nhận: {handover.confirmer.fullName}</span>}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 font-medium text-gray-700">Tài sản</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Tình trạng</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(handover.items as AssetItem[]).map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">{item.name}</td>
                        <td className={`px-4 py-2 font-medium ${conditionColor[item.condition] || ''}`}>
                          {conditionLabel[item.condition] || item.condition}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{item.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Chưa có biên bản bàn giao tài sản.</p>
            )}
          </div>
        </div>
      </Modal>

      {showTerminate && (
        <TerminateModal
          contract={contract}
          onClose={() => setShowTerminate(false)}
          onDone={() => { onTerminate(); onClose() }}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'all'>('active')

  useEffect(() => { fetchData() }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab !== 'all') params.status = activeTab

      const res = await api.get('/contracts', { params })

      const rawContracts = res.data.data
      setContracts(Array.isArray(rawContracts) ? rawContracts : rawContracts?.contracts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const contractColumns = [
    {
      key: 'student',
      label: 'Sinh viên',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.student?.user?.fullName}</div>
          <div className="text-sm text-gray-500">{row.student?.studentCode}</div>
        </div>
      )
    },
    {
      key: 'room',
      label: 'Phòng',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.room?.roomNumber}</div>
          <div className="text-sm text-gray-500">Tòa {row.room?.building} — Tầng {row.room?.floor}</div>
        </div>
      )
    },
    {
      key: 'startDate',
      label: 'Bắt đầu',
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN')
    },
    {
      key: 'monthlyRent',
      label: 'Giá thuê',
      render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (v: string) => <StatusBadge status={v} />
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: any, row: any) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedContract(row)}>
          <FileText className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hợp đồng</h1>
          <p className="text-gray-600 mt-1">Quản lý hợp đồng và đơn đăng ký phòng ở</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Tạo hợp đồng mới
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 p-4 pb-2">
          <span className="text-sm text-gray-600">Lọc:</span>
          {(['all', 'active', 'expired'] as const).map(tab => (
            <Button key={tab} variant={activeTab === tab ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab === 'all' ? 'Tất cả' : tab === 'active' ? 'Đang hoạt động' : 'Đã hết hạn'}
            </Button>
          ))}
        </div>

        <DataTable
          columns={contractColumns}
          data={contracts}
          loading={loading}
          emptyMessage="Không có hợp đồng nào"
        />
      </Card>

      {/* Create modal */}
      {createModalOpen && (
        <CreateContractModal
          onClose={() => setCreateModalOpen(false)}
          onDone={fetchData}
        />
      )}

      {/* Contract detail modal */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onTerminate={fetchData}
        />
      )}
    </div>
  )
}
