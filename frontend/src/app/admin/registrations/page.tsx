'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClipboardList, CheckCircle, XCircle, Eye, AlertCircle, RefreshCw, DollarSign, Building2, ExternalLink, Ban, CalendarCheck, Clock, FileText } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

/** Full URL for opening in browser (Google Drive public link or legacy `/uploads/...` path). */
function toAssetUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined
  const p = path.trim()
  if (/^https?:\/\//i.test(p)) return p
  return `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`
}

const DOC_LINK_LABELS = ['Minh chứng bản thân', 'Minh chứng hoàn cảnh']

/** Phòng gợi ý khi duyệt (có sức chứa / chỗ trống) */
interface ApproveRoomOption {
  id: string
  roomNumber: string
  floor: number
  building: string
  status?: string
  capacity?: number
  currentOccupancy?: number
  activeContracts?: number
  lockedBeds?: number
  slotsLeft?: number
}

function sortRoomsForApprove(rooms: ApproveRoomOption[], preferredId: string | null | undefined) {
  return [...rooms].sort((a, b) => {
    const ap = preferredId && a.id === preferredId
    const bp = preferredId && b.id === preferredId
    if (ap !== bp) return ap ? -1 : 1
    const sa = a.slotsLeft ?? 0
    const sb = b.slotsLeft ?? 0
    if (sb !== sa) return sb - sa
    if (a.building !== b.building) return a.building.localeCompare(b.building, 'vi')
    if (a.floor !== b.floor) return a.floor - b.floor
    return a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true })
  })
}

interface Registration {
  id: string; status: string; priorityScore: number; desiredStartDate: string | null
  desiredDuration: number | null; depositAmount: string | null; paymentProofUrl: string | null
  contractNotes: string | null; createdAt: string; reviewNote: string | null; documents: string[] | null
  student: {
    id: string; studentCode: string; faculty: string; priorityGroup: string
    idCardNumber: string | null
    gender?: string | null
    user: { fullName: string; email: string; phone: string }
  }
  preferredRoomType: {
    id: string; name: string; capacity: number; monthlyPrice: string
    rooms: ApproveRoomOption[]
  }
  preferredRoom: { id: string; roomNumber: string; floor: number; building: string } | null
  reviewer: { fullName: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  deposit_pending: 'Chờ cọc',
  deposit_paid: 'Chờ KT xác nhận',
  deposit_confirmed: 'Cọc đã xác nhận',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
}

export default function AdminRegistrationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const appointmentsHref = pathname.startsWith('/admin') ? '/admin/appointments' : '/staff/appointments'
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [total, setTotal] = useState(0)

  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [staffCancelModalOpen, setStaffCancelModalOpen] = useState(false)

  const [approveNote, setApproveNote] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [staffCancelNote, setStaffCancelNote] = useState('')
  const [confirmRoomId, setConfirmRoomId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const [assignableRooms, setAssignableRooms] = useState<ApproveRoomOption[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  const approveModalRooms = useMemo(
    () => sortRoomsForApprove(assignableRooms, selectedReg?.preferredRoom?.id),
    [assignableRooms, selectedReg?.preferredRoom?.id]
  )

  const fetchAssignableRooms = useCallback(async (roomTypeId: string, preferredRoomId?: string | null) => {
    if (!roomTypeId) return
    setLoadingRooms(true)
    setAssignableRooms([])
    try {
      const res = await api.get('/registrations/assignable-rooms', { params: { roomTypeId } })
      const rooms: ApproveRoomOption[] = res.data.data || []
      setAssignableRooms(rooms)
      const prefOk = preferredRoomId && rooms.some((x) => x.id === preferredRoomId && (x.slotsLeft ?? 0) > 0)
      const firstFree = rooms.find((x) => (x.slotsLeft ?? 0) > 0)
      setConfirmRoomId(prefOk ? preferredRoomId! : (firstFree?.id || ''))
    } catch (err) {
      console.error('Failed to load assignable rooms', err)
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { limit: 50 }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await api.get('/registrations', { params })
      setRegistrations(res.data.data.registrations || [])
      setTotal(res.data.data.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async () => {
    if (!selectedReg) return
    if (!confirmRoomId) {
      setActionError('Vui lòng chọn phòng để gán cho sinh viên.'); return
    }
    setActionLoading(true); setActionError('')
    try {
      await api.post(`/registrations/${selectedReg.id}/approve`, { 
        roomId: confirmRoomId,
        reviewNote: approveNote || undefined 
      })
      setApproveModalOpen(false)
      setStatusFilter('deposit_pending')
      setSelectedReg(null)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!selectedReg || !rejectNote.trim()) {
      setActionError('Vui lòng nhập lý do từ chối.'); return
    }
    setActionLoading(true); setActionError('')
    try {
      await api.post(`/registrations/${selectedReg.id}/reject`, { reviewNote: rejectNote.trim() })
      setRejectModalOpen(false)
      setStatusFilter('rejected')
      setSelectedReg(null)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally { setActionLoading(false) }
  }

  const handleConfirmPayment = async () => {
    if (!selectedReg) return
    setActionLoading(true); setActionError('')
    try {
      const res = await api.post(`/registrations/${selectedReg.id}/confirm-payment`, {})
      setConfirmModalOpen(false)
      const contractId = res.data?.data?.contract?.id || res.data?.data?.contractId
      if (contractId) {
        router.push(`/staff/handover/${contractId}`)
        return
      }
      setStatusFilter('approved')
      setSelectedReg(null)
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally { setActionLoading(false) }
  }

  const canStaffCancel = (status: string) =>
    ['pending', 'deposit_pending', 'deposit_paid', 'deposit_confirmed'].includes(status)

  const handleStaffCancel = async () => {
    if (!selectedReg) return
    setActionLoading(true); setActionError('')
    try {
      await api.post(`/registrations/${selectedReg.id}/cancel-by-staff`, {
        reviewNote: staffCancelNote.trim() || undefined,
      })
      setStaffCancelModalOpen(false)
      setViewModalOpen(false)
      setStaffCancelNote('')
      await fetchData()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Có lỗi xảy ra.'
      setActionError(msg)
    } finally { setActionLoading(false) }
  }

  const statusTabs = ['pending', 'deposit_pending', 'deposit_paid', 'deposit_confirmed', 'approved', 'rejected', 'cancelled', 'all']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đơn đăng ký phòng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Duyệt, xác nhận thanh toán và phân phòng</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-blue-950">
        <p className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 shrink-0" />
          Thứ tự nghiệp vụ gợi ý
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-blue-900/90">
          <li>Duyệt hồ sơ → gán phòng → sinh viên nộp tiền cọc (upload biên lai).</li>
          <li>Kế toán xác nhận đã nhận cọc.</li>
          <li>
            Quản lý có thể{' '}
            <Link href={appointmentsHref} className="font-semibold underline hover:no-underline">
              xếp lịch hẹn xem phòng
            </Link>{' '}
            (nếu quên có thể bổ sung ở bước này khi đơn vẫn là &quot;Cọc đã xác nhận&quot;).
          </li>
          <li>Tạo hợp đồng khi đã thống nhất — có thể tạo HĐ luôn nếu đã gặp sinh viên, không bắt buộc phải có lịch hẹn trên hệ thống.</li>
        </ol>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {statusTabs.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s] || 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : registrations.length === 0 ? (
        <Card className="text-center py-10">
          <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Không có đơn đăng ký nào</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {registrations.map((reg) => (
            <Card key={reg.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{reg.student.user.fullName}</span>
                    <span className="text-xs text-gray-500">({reg.student.studentCode})</span>
                    <StatusBadge status={reg.status} size="sm" />
                    {reg.student.priorityGroup && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">
                        Nhóm {reg.student.priorityGroup}
                      </span>
                    )}
                    {reg.documents && reg.documents.length > 0 && toAssetUrl(reg.documents[0]) && (
                      <a href={toAssetUrl(reg.documents[0])} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 ml-1">
                        <ExternalLink className="w-3 h-3" /> Minh chứng SV
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                    <span>Loại: <strong className="text-gray-700">{reg.preferredRoomType.name}</strong></span>
                    <span>ĐƯT: <strong className="text-gray-700">{reg.priorityScore}</strong></span>
                    {reg.desiredDuration && <span>TG: {reg.desiredDuration} tháng</span>}
                    <span>Nộp: {new Date(reg.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {reg.paymentProofUrl && toAssetUrl(reg.paymentProofUrl) && (
                    <p className="text-xs text-green-700 mt-1">
                      💰 <a href={toAssetUrl(reg.paymentProofUrl)} target="_blank" rel="noopener" className="underline">Xem biên lai</a>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedReg(reg); setViewModalOpen(true) }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {reg.status === 'pending' && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => {
                        setSelectedReg(reg)
                        setApproveNote('')
                        setActionError('')
                        setApproveModalOpen(true)
                        fetchAssignableRooms(reg.preferredRoomType.id, reg.preferredRoom?.id)
                      }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Duyệt
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => { setSelectedReg(reg); setRejectNote(''); setActionError(''); setRejectModalOpen(true) }}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Từ chối
                      </Button>
                    </>
                  )}
                  {reg.status === 'deposit_paid' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="h-3 w-3" /> Chờ kế toán xác nhận cọc
                    </span>
                  )}
                  {reg.status === 'deposit_confirmed' && (
                    <>
                      <Link href={appointmentsHref}>
                        <Button variant="outline" size="sm" type="button">
                          <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Lịch hẹn
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => {
                        setSelectedReg(reg)
                        setActionError('')
                        setConfirmModalOpen(true)
                      }}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Tạo hợp đồng
                      </Button>
                    </>
                  )}
                  {canStaffCancel(reg.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-200 text-amber-800 hover:bg-amber-50"
                      onClick={() => {
                        setSelectedReg(reg)
                        setStaffCancelNote('')
                        setActionError('')
                        setStaffCancelModalOpen(true)
                      }}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" /> Hủy đơn
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {selectedReg && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="Chi tiết đơn đăng ký"
          size="lg"
          footer={
            canStaffCancel(selectedReg.status) ? (
              <>
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>Đóng</Button>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-800 hover:bg-amber-50"
                  onClick={() => {
                    setStaffCancelNote('')
                    setActionError('')
                    setStaffCancelModalOpen(true)
                  }}
                >
                  <Ban className="h-4 w-4 mr-1" /> Hủy đơn
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Họ tên', selectedReg.student.user.fullName],
                ['Mã SV', selectedReg.student.studentCode],
                ['Email', selectedReg.student.user.email],
                ['SĐT', selectedReg.student.user.phone || '—'],
                ['CCCD', selectedReg.student.idCardNumber || '—'],
                ['Khoa', selectedReg.student.faculty || '—'],
                ['Nhóm ƯT', selectedReg.student.priorityGroup || '—'],
                ['Điểm ƯT', String(selectedReg.priorityScore)],
                ['Loại phòng', selectedReg.preferredRoomType.name],
                ['Thời gian', selectedReg.desiredDuration ? `${selectedReg.desiredDuration} tháng` : '—'],
                ['Nguyện vọng phòng', selectedReg.preferredRoom ? `${selectedReg.preferredRoom.roomNumber} (T${selectedReg.preferredRoom.floor})` : 'Không chọn'],
                ['Tiền cọc', selectedReg.depositAmount ? `${Number(selectedReg.depositAmount).toLocaleString('vi-VN')}đ` : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            {selectedReg.paymentProofUrl && toAssetUrl(selectedReg.paymentProofUrl) && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-700 mb-1 font-medium">Biên lai thanh toán</p>
                <a href={toAssetUrl(selectedReg.paymentProofUrl)} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline break-all">{selectedReg.paymentProofUrl}</a>
              </div>
            )}
            {selectedReg.documents && selectedReg.documents.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">Link minh chứng (Google Drive / file)</p>
                <ul className="space-y-1">
                  {selectedReg.documents.map((doc: string, idx: number) => {
                    const href = toAssetUrl(doc)
                    if (!href) return null
                    return (
                      <li key={idx}>
                        <a href={href} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline break-all">
                          {DOC_LINK_LABELS[idx] || `Tệp ${idx + 1}`}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {selectedReg.reviewNote && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-0.5">Ghi chú</p>
                <p className="text-gray-800">{selectedReg.reviewNote}</p>
              </div>
            )}
            {(selectedReg.status === 'deposit_paid' || selectedReg.status === 'deposit_confirmed') && (
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-xs text-blue-900">
                <p className="font-medium mb-1">Bước tiếp theo (quản lý)</p>
                {selectedReg.status === 'deposit_paid' ? (
                  <p>Đang chờ kế toán xác nhận cọc. Sau khi xác nhận, có thể xếp lịch hẹn xem phòng rồi mới tạo hợp đồng (hoặc tạo HĐ trực tiếp nếu đã gặp SV).</p>
                ) : (
                  <p>
                    Cọc đã xác nhận — có thể{' '}
                    <Link href={appointmentsHref} className="font-semibold underline">
                      tạo / bổ sung lịch hẹn xem phòng
                    </Link>{' '}
                    hoặc nhấn <strong>Tạo hợp đồng</strong> ở danh sách khi đã thống nhất với sinh viên.
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Approve Modal (pending → deposit_pending) */}
      {selectedReg && (
        <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Duyệt hồ sơ đăng ký & Phân phòng" size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>Hủy</Button>
              <Button onClick={handleApprove} loading={actionLoading}>Xác nhận duyệt</Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Họ tên', selectedReg.student.user.fullName],
                ['Mã SV', selectedReg.student.studentCode],
                ['Email', selectedReg.student.user.email],
                ['SĐT', selectedReg.student.user.phone || '—'],
                ['Khoa', selectedReg.student.faculty || '—'],
                ['Loại phòng', selectedReg.preferredRoomType.name],
                ['Thời gian', selectedReg.desiredDuration ? `${selectedReg.desiredDuration} tháng` : '—'],
                ['Nguyện vọng phòng', selectedReg.preferredRoom ? `${selectedReg.preferredRoom.roomNumber} (T${selectedReg.preferredRoom.floor})` : 'Không chọn'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {selectedReg.documents && selectedReg.documents.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">Link minh chứng (Google Drive / file)</p>
                {selectedReg.documents.map((doc: string, idx: number) => {
                  const href = toAssetUrl(doc)
                  if (!href) return null
                  return (
                    <a key={idx} href={href} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline break-all block">
                      {DOC_LINK_LABELS[idx] || doc}
                    </a>
                  )
                })}
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800">
              ⚠️ Duyệt sẽ chuyển sang trạng thái "Chờ nộp cọc". Tiền cọc = 2 tháng tiền phòng ({(Number(selectedReg.preferredRoomType.monthlyPrice) * 2).toLocaleString('vi-VN')}đ)
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                Phân phòng — chọn 1 phòng cùng loại đã đăng ký *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Mặc định là <strong>nguyện vọng</strong> của sinh viên (nếu còn chỗ). Có thể đổi sang phòng khác trong danh sách.
              </p>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 shrink-0" />
                  Đang tải danh sách phòng...
                </div>
              ) : approveModalRooms.length === 0 ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Không có phòng nào cùng loại (trừ bảo trì). Kiểm tra lại loại phòng trong DB.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {approveModalRooms.map((r) => {
                    const cap = r.capacity ?? '—'
                    const left = r.slotsLeft ?? '—'
                    const occ = r.currentOccupancy ?? '—'
                    const lock = r.lockedBeds ?? '—'
                    const disabled = (r.slotsLeft ?? 0) <= 0
                    const isPref = selectedReg.preferredRoom?.id === r.id
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm ${
                          confirmRoomId === r.id ? 'bg-blue-50/90' : 'hover:bg-gray-50'
                        } ${disabled ? 'opacity-55 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`assign-room-${selectedReg.id}`}
                          checked={confirmRoomId === r.id}
                          disabled={disabled}
                          onChange={() => setConfirmRoomId(r.id)}
                          className="shrink-0 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-900">{r.roomNumber}</span>
                          <span className="text-gray-500 text-xs ml-1">Tòa {r.building} · Tầng {r.floor}</span>
                          {isPref && (
                            <span className="ml-2 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Nguyện vọng</span>
                          )}
                          {disabled && (
                            <span className="ml-2 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Hết chỗ</span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600 shrink-0 tabular-nums text-right sm:text-left">
                          <span><span className="text-gray-400">Còn</span> <strong className="text-gray-900">{left}/{cap}</strong></span>
                          <span className="hidden sm:inline"><span className="text-gray-400">Ở</span> {occ}</span>
                          <span className="hidden sm:inline"><span className="text-gray-400">Cọc</span> {lock}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                Danh sách = mọi phòng <strong>cùng loại</strong> với đơn (trừ bảo trì), lọc theo giới tính SV. Sau duyệt, SV có 3 ngày để nộp cọc.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
              <textarea value={approveNote} onChange={(e) => setApproveNote(e.target.value)} rows={2} placeholder="Ghi chú cho sinh viên..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {actionError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {actionError}</p>}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedReg && (
        <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối đơn đăng ký"
          footer={
            <>
              <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>Hủy</Button>
              <Button variant="danger" onClick={handleReject} loading={actionLoading}>Xác nhận từ chối</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p>Từ chối đơn của <strong>{selectedReg.student.user.fullName}</strong> ({selectedReg.student.studentCode})</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lý do từ chối *</label>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Nhập lý do..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
            </div>
            {actionError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {actionError}</p>}
          </div>
        </Modal>
      )}

      {/* Confirm Payment + Create Contract Modal (deposit_paid → approved) */}
      {selectedReg && (
        <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Tạo hợp đồng" size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmModalOpen(false)} disabled={actionLoading}>Hủy</Button>
              <Button onClick={handleConfirmPayment} loading={actionLoading}>Xác nhận tạo hợp đồng</Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-xs text-green-700">
              Kế toán đã xác nhận tiền cọc. Nhấn &quot;Xác nhận tạo hợp đồng&quot; để tạo hợp đồng cho sinh viên.
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-900">
              Nếu chưa hẹn sinh viên xem phòng trên hệ thống, có thể{' '}
              <Link href={appointmentsHref} className="font-semibold underline">
                quay lại mục Lịch hẹn
              </Link>{' '}
              để tạo lịch trước; hoặc tiếp tục tạo HĐ tại đây nếu đã gặp trực tiếp.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs">Sinh viên</p>
                <p className="font-medium">{selectedReg.student.user.fullName} ({selectedReg.student.studentCode})</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Tiền cọc</p>
                <p className="font-medium text-green-700">{selectedReg.depositAmount ? `${Number(selectedReg.depositAmount).toLocaleString('vi-VN')}đ` : '—'}</p>
              </div>
            </div>

            {actionError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {actionError}</p>}
          </div>
        </Modal>
      )}

      {/* Staff cancel registration (pending / chờ cọc / đã nộp cọc) */}
      {selectedReg && (
        <Modal
          isOpen={staffCancelModalOpen}
          onClose={() => { setStaffCancelModalOpen(false); setActionError('') }}
          title="Hủy đơn đăng ký"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => { setStaffCancelModalOpen(false); setActionError('') }} disabled={actionLoading}>
                Đóng
              </Button>
              <Button variant="danger" onClick={handleStaffCancel} loading={actionLoading}>
                Xác nhận hủy đơn
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              Hủy đơn của <strong>{selectedReg.student.user.fullName}</strong> ({selectedReg.student.studentCode}) — trạng thái:{' '}
              <strong>{STATUS_LABELS[selectedReg.status] || selectedReg.status}</strong>.
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
              Giữ chỗ phòng (nếu có) sẽ được giải phóng. Sinh viên nhận thông báo trên hệ thống.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lý do hủy (tùy chọn)</label>
              <textarea
                value={staffCancelNote}
                onChange={(e) => setStaffCancelNote(e.target.value)}
                rows={3}
                placeholder="VD: Sai thông tin, sinh viên xin rút, hết phòng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            {actionError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {actionError}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
