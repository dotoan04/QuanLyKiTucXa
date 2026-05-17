'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'
import {
  FileText, Upload, Clock, CheckCircle2, XCircle, AlertTriangle,
  CreditCard, Eye, Loader2, ArrowLeft, ArrowRight, Image, Info, Ban, ExternalLink, X
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

function toFileUrl(relativePath: string | undefined): string | undefined {
  if (!relativePath) return undefined
  if (relativePath.startsWith('http')) return relativePath
  return `${API_BASE}${relativePath}`
}

function isExternalDocUrl(doc: string): boolean {
  return /^https?:\/\//i.test(doc.trim())
}

const DOC_LABELS = ['Minh chứng bản thân', 'Minh chứng hoàn cảnh']

interface Registration {
  id: string
  status: 'pending' | 'deposit_pending' | 'deposit_paid' | 'deposit_confirmed' | 'approved' | 'rejected' | 'cancelled'
  desiredStartDate: string
  desiredDuration?: number
  depositAmount?: number
  paymentProofUrl?: string
  reviewNote?: string
  reviewedAt?: string
  depositRejectReason?: string
  assignedRoom?: { id: string; roomNumber: string; floor: number; building: string } | null
  preferredRoomType: { id: string; name: string; monthlyPrice: string; capacity: number }
  preferredRoom?: { id: string; roomNumber: string; floor: number; building: string } | null
  documents?: string[]
  createdAt: string
  priorityScore: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-warning-100 text-warning-700', icon: <Clock className="w-4 h-4" /> },
  deposit_pending: { label: 'Chờ nộp cọc', color: 'bg-primary-100 text-primary-700', icon: <CreditCard className="w-4 h-4" /> },
  deposit_paid: { label: 'Chờ KT xác nhận', color: 'bg-blue-100 text-blue-700', icon: <Upload className="w-4 h-4" /> },
  deposit_confirmed: { label: 'Cọc đã xác nhận', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  approved: { label: 'Đã duyệt', color: 'bg-success-100 text-success-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected: { label: 'Bị từ chối', color: 'bg-danger-100 text-danger-700', icon: <XCircle className="w-4 h-4" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-surface-200 text-navy-500', icon: <XCircle className="w-4 h-4" /> },
}

const statusSteps = ['pending', 'deposit_pending', 'deposit_paid', 'deposit_confirmed', 'approved']

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [hasActiveContract, setHasActiveContract] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadRegId, setUploadRegId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [qrData, setQrData] = useState<any>(null)
  const [loadingQr, setLoadingQr] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      const [regRes, contractsRes] = await Promise.allSettled([
        api.get('/registrations/my'),
        api.get('/students/my-contracts'),
      ])
      const regData = regRes.status === 'fulfilled' ? (regRes.value.data.data || []) : []
      const contracts = contractsRes.status === 'fulfilled' ? (contractsRes.value.data.data || []) : []
      setRegistrations(regData)
      setHasActiveContract(contracts.some((c: any) => c.status === 'active'))
    } catch (err) {
      console.error('Failed to fetch registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadPayment = async (regId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf'
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('File quá lớn. Tối đa 10MB.')
        return
      }

      setUploading(true)
      setUploadRegId(regId)
      setErrorMsg('')

      try {
        const formData = new FormData()
        formData.append('paymentProof', file)
        await api.post(`/registrations/${regId}/upload-payment`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        await fetchRegistrations()
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Upload thất bại.'
        setErrorMsg(msg)
      } finally {
        setUploading(false)
        setUploadRegId(null)
      }
    }
    input.click()
  }

  const handleCancelPending = async (regId: string) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn đăng ký này? Chỉ áp dụng khi đơn chưa được quản lý duyệt.')) return
    setCancellingId(regId)
    setErrorMsg('')
    try {
      await api.post(`/registrations/${regId}/cancel`)
      await fetchRegistrations()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Hủy đơn thất bại.'
      setErrorMsg(msg)
    } finally {
      setCancellingId(null)
    }
  }

  const getStepIndex = (status: string) => statusSteps.indexOf(status)

  const getDepositDeadline = (reviewedAt?: string) => {
    if (!reviewedAt) return null
    const deadline = new Date(new Date(reviewedAt).getTime() + 3 * 24 * 60 * 60 * 1000)
    return deadline
  }

  const getTimeRemaining = (reviewedAt?: string) => {
    if (!reviewedAt) return null
    const deadline = getDepositDeadline(reviewedAt)!
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    if (diff <= 0) return 'Đã hết hạn'
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${days} ngày ${hours} giờ`
  }

  const handleShowQR = async (regId: string) => {
    setShowQRModal(regId)
    setLoadingQr(true)
    setErrorMsg('')
    try {
      const res = await api.get(`/payments/qr/registration/${regId}`)
      setQrData(res.data.data)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Không thể tải mã QR.'
      setErrorMsg(msg)
    } finally {
      setLoadingQr(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 bg-surface-200 rounded-xl animate-pulse" />
          <div className="h-7 w-48 bg-surface-200 rounded-xl animate-pulse" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-surface-200 rounded-2xl animate-pulse mb-4" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-navy-400 mb-6">
        <Link href="/student" className="hover:text-navy-600 transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-navy-600 font-medium">Đơn đăng ký</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Theo dõi đơn đăng ký</h1>
          <p className="text-navy-400 mt-1 text-sm">Xem trạng thái đơn đăng ký phòng và nộp tiền cọc</p>
        </div>
        {hasActiveContract ? (
          <Link href="/student/transfer">
            <Button>
              <ArrowRight className="w-4 h-4" />
              Đổi phòng
            </Button>
          </Link>
        ) : (
          <Link href="/student/register">
            <Button>
              <FileText className="w-4 h-4" />
              Đăng ký mới
            </Button>
          </Link>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 text-danger-700 p-4 rounded-xl text-sm mb-6">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto text-danger-400 hover:text-danger-600 cursor-pointer">x</button>
        </div>
      )}

      {/* Registration List */}
      {registrations.length === 0 ? (
        <Card padding>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-navy-300" />
            </div>
            <p className="text-sm font-medium text-navy-500 mb-3">Bạn chưa có đơn đăng ký nào</p>
            {hasActiveContract ? (
              <Link href="/student/transfer">
                <Button>
                  Chuyển phòng
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/student/register">
                <Button>
                  Đăng ký phòng ngay
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const cfg = statusConfig[reg.status] || statusConfig.pending
            const currentStep = getStepIndex(reg.status)
            const isDepositPending = reg.status === 'deposit_pending'
            const timeLeft = isDepositPending ? getTimeRemaining(reg.reviewedAt) : null
            const isExpired = isDepositPending && timeLeft === 'Đã hết hạn'

            return (
              <Card key={reg.id} padding>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-sans text-navy-700">
                        Đăng ký phòng {reg.preferredRoomType.name}
                      </p>
                      <p className="text-xs text-navy-400">
                        Ngày gửi: {new Date(reg.createdAt).toLocaleDateString('vi-VN')} &middot; Mã: {reg.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Progress Steps - only for non-terminal statuses */}
                {!['rejected', 'cancelled'].includes(reg.status) && (
                  <div className="flex items-center gap-1 mb-4 px-1">
                    {statusSteps.map((step, idx) => {
                      const stepCfg = statusConfig[step]
                      const isActive = currentStep >= idx
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentStep > idx ? 'bg-success-500 text-white' :
                              currentStep === idx ? 'bg-primary-500 text-white ring-2 ring-primary-200' :
                              'bg-surface-200 text-navy-400'
                            }`}>
                              {currentStep > idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={`text-[11px] font-medium hidden sm:block ${
                              isActive ? 'text-navy-700' : 'text-navy-400'
                            }`}>
                              {stepCfg.label}
                            </span>
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 rounded-full ${
                              currentStep > idx ? 'bg-success-400' : 'bg-surface-200'
                            }`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-[11px] text-navy-400">Loại phòng</p>
                    <p className="text-sm font-semibold text-navy-700">{reg.preferredRoomType.name}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-[11px] text-navy-400">Giá phòng</p>
                    <p className="text-sm font-semibold text-navy-700">
                      {formatVnd(reg.preferredRoomType.monthlyPrice)}/tháng
                    </p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-[11px] text-navy-400">Ngày nhận phòng</p>
                    <p className="text-sm font-semibold text-navy-700">
                      {new Date(reg.desiredStartDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-[11px] text-navy-400">Phòng được gán</p>
                    <p className="text-sm font-semibold text-navy-700">
                      {reg.assignedRoom
                        ? `${reg.assignedRoom.roomNumber} (T${reg.assignedRoom.building})`
                        : reg.preferredRoom
                          ? `${reg.preferredRoom.roomNumber} (T${reg.preferredRoom.building})*`
                          : 'Chưa phân'}
                    </p>
                  </div>
                </div>

                {/* Pending — student can cancel before staff approves */}
                {reg.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-50 border border-surface-200/60 rounded-xl p-4 mb-4">
                    <p className="text-xs text-navy-600 font-body">
                      Đơn đang chờ quản lý duyệt. Bạn có thể hủy để gửi đơn mới hoặc chỉnh sửa lựa chọn.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-danger-200 text-danger-600 hover:bg-danger-50 shrink-0"
                      loading={cancellingId === reg.id}
                      disabled={!!cancellingId}
                      onClick={() => handleCancelPending(reg.id)}
                    >
                      <Ban className="w-4 h-4" />
                      Hủy đơn
                    </Button>
                  </div>
                )}

                {/* Deposit amount & Payment section */}
                {(isDepositPending || reg.status === 'deposit_paid' || reg.status === 'deposit_confirmed') && reg.depositAmount && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-semibold text-primary-700">
                          Tiền cọc: <span className="text-base">{formatVnd(reg.depositAmount)}</span>
                        </span>
                      </div>
                      {isDepositPending && timeLeft && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isExpired ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'
                        }`}>
                          {isExpired ? 'Hết hạn' : `Còn ${timeLeft}`}
                        </span>
                      )}
                    </div>
                    {isDepositPending && !reg.depositRejectReason && (
                      <p className="text-xs text-primary-600 mb-3">
                        Vui lòng nộp tiền cọc và tải biên lai lên để hoàn tất đăng ký. Đơn sẽ bị hủy sau 3 ngày không nộp cọc.
                      </p>
                    )}
                    {reg.status === 'deposit_paid' && (
                      <p className="text-xs text-blue-600 mb-3">
                        Biên lai đã được gửi. Đang chờ kế toán xác nhận tiền cọc...
                      </p>
                    )}
                    {reg.status === 'deposit_confirmed' && (
                      <p className="text-xs text-green-600 mb-3">
                        Cọc đã được xác nhận. Hệ thống đang chuẩn bị hợp đồng cho bạn.
                      </p>
                    )}

                    {reg.status === 'deposit_paid' && reg.paymentProofUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <button
                          onClick={() => setPreviewDoc(toFileUrl(reg.paymentProofUrl)!)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Xem biên lai đã gửi
                        </button>
                      </div>
                    )}

                    {isDepositPending && !reg.depositRejectReason && !isExpired && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleShowQR(reg.id)}
                          variant="outline"
                          size="sm"
                        >
                          <CreditCard className="w-4 h-4" />
                          Quét QR nộp cọc
                        </Button>
                        <Button
                          onClick={() => handleUploadPayment(reg.id)}
                          loading={uploading && uploadRegId === reg.id}
                          disabled={uploading}
                          size="sm"
                        >
                          <Upload className="w-4 h-4" />
                          Tải biên lai nộp cọc
                        </Button>
                      </div>
                    )}
                    {isExpired && (
                      <div className="flex items-center gap-2 text-xs text-danger-600">
                        <AlertTriangle className="w-4 h-4" />
                        Đơn đăng ký đã hết hạn. Vui lòng liên hệ quản lý hoặc đăng ký lại.
                      </div>
                    )}
                  </div>
                )}

                {/* Deposit reject reason - upload lại */}
                {isDepositPending && reg.depositRejectReason && (
                  <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-danger-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-danger-700">Biên lai cọc bị từ chối</p>
                        <p className="text-xs text-danger-600 mt-1">Lý do: {reg.depositRejectReason}</p>
                        <Button
                          onClick={() => handleUploadPayment(reg.id)}
                          loading={uploading && uploadRegId === reg.id}
                          disabled={uploading}
                          size="sm"
                          className="mt-3"
                        >
                          <Upload className="w-4 h-4" />
                          Upload lại biên lai
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approved - show contract link */}
                {reg.status === 'approved' && (
                  <div className="flex items-start gap-2 bg-success-50 border border-success-200 text-success-700 p-4 rounded-xl mb-4">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Đăng ký đã hoàn tất!</p>
                      <p className="text-xs mt-1">Hợp đồng đã được tạo. Vui lòng xem chi tiết hợp đồng.</p>
                      <Link href="/student/contract">
                        <Button size="sm" variant="outline" className="mt-2">
                          Xem hợp đồng
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {reg.status === 'rejected' && reg.reviewNote && (
                  <div className="flex items-start gap-2 bg-danger-50 border border-danger-200 text-danger-700 p-4 rounded-xl mb-4">
                    <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Đơn bị từ chối</p>
                      <p className="text-xs mt-1">Lý do: {reg.reviewNote}</p>
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {reg.status === 'cancelled' && (
                  <div className="flex items-start gap-2 bg-surface-100 border border-surface-200 text-navy-600 p-4 rounded-xl mb-4">
                    <Ban className="w-5 h-5 mt-0.5 shrink-0 text-navy-400" />
                    <div>
                      <p className="text-sm font-semibold">Đơn đã hủy</p>
                      {reg.reviewNote && <p className="text-xs mt-1">{reg.reviewNote}</p>}
                    </div>
                  </div>
                )}

                {/* Documents: link Drive hoặc file cũ trên server */}
                {reg.documents && reg.documents.length > 0 && (
                  <div className="border-t border-surface-200 pt-3 mt-2">
                    <p className="text-xs font-semibold text-navy-500 mb-2">Minh chứng (link / tệp):</p>
                    <div className="flex flex-wrap gap-2">
                      {reg.documents.map((doc, idx) => {
                        const label = DOC_LABELS[idx] || `Tài liệu ${idx + 1}`
                        if (isExternalDocUrl(doc)) {
                          return (
                            <a
                              key={idx}
                              href={doc.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg text-xs font-medium text-primary-700 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              {label}
                            </a>
                          )
                        }
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewDoc(toFileUrl(doc)!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 rounded-lg text-xs font-medium text-navy-600 transition-colors cursor-pointer"
                          >
                            <Image className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Info note at bottom */}
      <div className="mt-6">
        <div className="flex items-start gap-2 bg-surface-50 border border-surface-200/60 p-4 rounded-xl">
          <Info className="w-4 h-4 text-navy-400 mt-0.5 shrink-0" />
          <div className="text-xs text-navy-500 space-y-1">
            <p><strong>Quy trình đăng ký phòng:</strong></p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Gửi đơn đăng ký &rarr; Chờ quản lý duyệt (có thể hủy đơn hoặc gửi đơn mới sẽ tự hủy đơn cũ)</li>
              <li>Được duyệt &rarr; Nộp tiền cọc (2 tháng tiền phòng) trong 3 ngày</li>
              <li>Tải biên lai lên hệ thống &rarr; Chờ kế toán xác nhận cọc</li>
              <li>Cọc được xác nhận &rarr; Quản lý tạo hợp đồng</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
              <span className="text-sm font-semibold text-navy-700">Xem tài liệu</span>
              <button onClick={() => setPreviewDoc(null)} className="text-navy-400 hover:text-navy-600 cursor-pointer">
                &times;
              </button>
            </div>
            <div className="p-4">
              {previewDoc.startsWith('http') && (previewDoc.includes('drive.google.com') || previewDoc.includes('docs.google.com')) ? (
                <p className="text-sm text-navy-600">
                  Xem trên Google Drive:{' '}
                  <a href={previewDoc} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-semibold underline">
                    Mở liên kết
                  </a>
                </p>
              ) : previewDoc.endsWith('.pdf') ? (
                <iframe src={previewDoc} className="w-full h-[70vh] rounded-lg border border-surface-200" title="PDF" />
              ) : (
                <img src={previewDoc} alt="Document" className="w-full h-auto max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQRModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
              <span className="text-sm font-semibold text-navy-700">Quét mã QR nộp cọc</span>
              <button onClick={() => setShowQRModal(null)} className="text-navy-400 hover:text-navy-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingQr ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : qrData ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-surface-200">
                      <img
                        src={qrData.qrCode}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-semibold text-blue-700">{qrData.bankName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-semibold text-blue-900">{qrData.bankAccount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chủ tài khoản:</span>
                      <span className="font-semibold text-gray-900">{qrData.accountName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold text-green-600">{qrData.amount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-600">Nội dung CK:</span>
                      <span className="text-xs font-semibold text-primary-700 max-w-[200px] truncate">
                        {qrData.transferContent}
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Hướng dẫn:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Quét mã QR bằng app ngân hàng</li>
                          <li>Kiểm tra thông tin và chuyển khoản</li>
                          <li>Nhập đúng nội dung chuyển khoản</li>
                          <li>Sau khi chuyển, tải biên lai lên hệ thống</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-red-600">
                  Không thể tải mã QR. Vui lòng thử lại.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
