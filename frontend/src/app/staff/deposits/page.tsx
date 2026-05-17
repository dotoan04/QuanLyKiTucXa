'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DollarSign, Eye, CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import api from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

function toAssetUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined
  const p = path.trim()
  if (/^https?:\/\//i.test(p)) return p
  return `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`
}

interface Registration {
  id: string
  status: string
  depositAmount: string | null
  paymentProofUrl: string | null
  createdAt: string
  depositConfirmedAt?: string | null
  assignedRoom: { id: string; roomNumber: string; floor: number; building: string } | null
  preferredRoom?: { id: string; roomNumber: string; floor: number; building: string } | null
  student: {
    id: string
    studentCode: string
    faculty: string
    user: { fullName: string; email: string; phone: string }
  }
  preferredRoomType: { id: string; name: string; capacity: number; monthlyPrice: string }
}

type DepositsTab = 'pending_confirm' | 'history'

export default function DepositsPage() {
  const [tab, setTab] = useState<DepositsTab>('pending_confirm')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [total, setTotal] = useState(0)

  const statusParam =
    tab === 'pending_confirm' ? 'deposit_paid' : 'deposit_confirmed,approved'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/registrations', {
        params: { status: statusParam, limit: 50, page: 1 },
      })
      setRegistrations(res.data.data.registrations || [])
      setTotal(res.data.data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusParam])

  useEffect(() => { fetchData() }, [fetchData])

  const handleConfirmDeposit = async (regId: string) => {
    if (!window.confirm('Xác nhận tiền cọc cho đơn đăng ký này?')) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/registrations/${regId}/confirm-deposit`)
      await fetchData()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectDeposit = async () => {
    if (!selectedReg) return
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setActionError('Lý do từ chối phải có ít nhất 5 ký tự.')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/registrations/${selectedReg.id}/reject-deposit`, { reason: rejectReason.trim() })
      setRejectModalOpen(false)
      setRejectReason('')
      setSelectedReg(null)
      await fetchData()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    )
  }

  const displayRoom = (reg: Registration) =>
    reg.assignedRoom || reg.preferredRoom || null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý tiền cọc</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xác nhận biên lai cọc sau khi sinh viên nộp; lịch sử gồm đơn đã xác nhận cọc hoặc đã lên hợp đồng.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('pending_confirm')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'pending_confirm'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Chờ xác nhận cọc
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Lịch sử cọc
        </button>
      </div>

      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
        <strong>Lưu ý:</strong> Tiền cọc đăng ký phòng không tự tạo hóa đơn tháng. Hóa đơn tiền phòng do bộ phận phát hành
        (mục Hóa đơn); đối soát cổng thanh toán so khớp với hóa đơn đã ghi nhận thanh toán.
      </p>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
          <button onClick={() => setActionError('')} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">x</button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
        {tab === 'pending_confirm'
          ? `Chờ kế toán xác nhận biên lai (${total} đơn)`
          : `Lịch sử (${total} đơn)`}
      </div>

      {registrations.length === 0 ? (
        <Card className="text-center py-10">
          <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {tab === 'pending_confirm'
              ? 'Không có đơn nào ở trạng thái “đã gửi biên lai — chờ kế toán”. Sinh viên cần ở bước deposit_paid sau khi tải biên lai lên.'
              : 'Chưa có đơn đã xác nhận cọc hoặc đã duyệt hợp đồng trong hệ thống.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <Card key={reg.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{reg.student.user.fullName}</span>
                    <span className="text-xs text-gray-500">({reg.student.studentCode})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                    <span>
                      Phòng:{' '}
                      <strong className="text-gray-700">
                        {displayRoom(reg)
                          ? `${displayRoom(reg)!.roomNumber} (Tòa ${displayRoom(reg)!.building})`
                          : 'Chưa phân'}
                      </strong>
                    </span>
                    <span>Loại: <strong className="text-gray-700">{reg.preferredRoomType.name}</strong></span>
                    <span>Số tiền: <strong className="text-green-700">{reg.depositAmount ? `${Number(reg.depositAmount).toLocaleString('vi-VN')}đ` : '—'}</strong></span>
                    <span>Ngày tạo đơn: {new Date(reg.createdAt).toLocaleDateString('vi-VN')}</span>
                    {reg.depositConfirmedAt && (
                      <span>
                        Xác nhận cọc:{' '}
                        {new Date(reg.depositConfirmedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  {reg.paymentProofUrl && toAssetUrl(reg.paymentProofUrl) && (
                    <div className="mt-1.5">
                      <a
                        href={toAssetUrl(reg.paymentProofUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                      >
                        <ExternalLink className="w-3 h-3" /> Xem biên lai
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {reg.paymentProofUrl && toAssetUrl(reg.paymentProofUrl) && (
                    <a href={toAssetUrl(reg.paymentProofUrl)} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {tab === 'pending_confirm' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmDeposit(reg.id)}
                        loading={actionLoading}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Xác nhận cọc
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedReg(reg)
                          setRejectReason('')
                          setActionError('')
                          setRejectModalOpen(true)
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedReg && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => { setRejectModalOpen(false); setActionError('') }}
          title="Từ chối biên lai cọc"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => { setRejectModalOpen(false); setActionError('') }} disabled={actionLoading}>
                Hủy
              </Button>
              <Button variant="danger" onClick={handleRejectDeposit} loading={actionLoading}>
                Xác nhận từ chối
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              Từ chối biên lai cọc của <strong>{selectedReg.student.user.fullName}</strong> ({selectedReg.student.studentCode}).
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
              Sinh viên sẽ cần upload lại biên lai cọc.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lý do từ chối * (ít nhất 5 ký tự)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="VD: Biên lai mờ không đọc được, sai thông tin, không đúng số tiền..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
