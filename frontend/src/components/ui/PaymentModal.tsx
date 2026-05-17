'use client'

import { useState, useEffect } from 'react'
import { X, Banknote, CreditCard, Phone, Mail, MapPin, Copy, CheckCircle2, AlertCircle, User } from 'lucide-react'
import api from '@/lib/api'

// ─── Bank transfer info (cấu hình tĩnh — trong thực tế nên lấy từ settings API) ─
const BANK_INFO = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountName: 'KY TUC XA TRUONG DAI HOC',
  branch: 'Chi nhánh TP.HCM',
}

interface Staff {
  id: string
  fullName: string
  email: string
  phone?: string
  staffInfo?: { position: string; department?: string }
}

interface Invoice {
  id: string
  invoiceMonth: string
  totalAmount: number
  status: string
  contract?: {
    student?: { user?: { fullName?: string }; studentCode?: string }
    room?: { roomNumber?: string; building?: string }
  }
}

interface PaymentModalProps {
  invoice: Invoice | null
  onClose: () => void
  onSuccess: () => void
  /** If true, admin/staff can confirm on behalf of student */
  isAdminMode?: boolean
}

export function PaymentModal({ invoice, onClose, onSuccess, isAdminMode = false }: PaymentModalProps) {
  const [method, setMethod] = useState<'transfer' | 'cash' | null>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [transferRef, setTransferRef] = useState('')
  const [cashReceiptNote, setCashReceiptNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [qrData, setQrData] = useState<any>(null)
  const [loadingQr, setLoadingQr] = useState(false)

  function getApiErrorMessage(err: unknown): string {
    const e = err as { response?: { data?: { message?: string; error?: { message?: string } } } }
    return (
      e?.response?.data?.error?.message ||
      e?.response?.data?.message ||
      'Xác nhận thất bại. Vui lòng thử lại.'
    )
  }

  // Generate default transfer reference
  useEffect(() => {
    if (invoice) {
      const month = new Date(invoice.invoiceMonth).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }).replace('/', '')
      const code = invoice.contract?.student?.studentCode || 'SV'
      setTransferRef(`KTX ${code} ${month}`)
    }
  }, [invoice])

  useEffect(() => {
    setMethod(null)
    setConfirmed(false)
    setError('')
    setCashReceiptNote('')
    setQrData(null)
  }, [invoice?.id])

  // Load staff list when cash is selected
  useEffect(() => {
    if (method === 'cash') {
      setLoadingStaff(true)
      api.get('/auth/users', { params: { role: 'staff', limit: 20 } })
        .then(res => {
          const raw = res.data.data
          const users = Array.isArray(raw) ? raw : raw?.users || []
          setStaffList(users.filter((u: any) => u.role === 'staff' || u.role === 'admin'))
        })
        .catch(() => setStaffList([]))
        .finally(() => setLoadingStaff(false))
    }
  }, [method])

  // Load QR code when transfer is selected
  useEffect(() => {
    if (method === 'transfer' && invoice && !qrData) {
      setLoadingQr(true)
      api.get(`/payments/qr/invoice/${invoice.id}`)
        .then(res => {
          setQrData(res.data.data)
        })
        .catch(err => {
          console.error('Failed to load QR code:', err)
          setError('Không thể tải mã QR. Vui lòng thử lại.')
        })
        .finally(() => setLoadingQr(false))
    }
  }, [method, invoice?.id])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const handleConfirmTransfer = async () => {
    if (!invoice) return
    setConfirming(true)
    setError('')
    try {
      await api.post(`/invoices/${invoice.id}/payment`, {
        paymentMethod: 'transfer',
        paymentRef: transferRef.trim() || `CK-${invoice.id.slice(0, 8)}`,
      })
      setConfirmed(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirmCash = async () => {
    if (!invoice) return
    setConfirming(true)
    setError('')
    const note = cashReceiptNote.trim()
    const paymentRef = note || `CASH-${invoice.id.slice(0, 8)}-${Date.now()}`
    try {
      await api.post(`/invoices/${invoice.id}/payment`, {
        paymentMethod: 'cash',
        paymentRef,
      })
      setConfirmed(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (!invoice) return null

  const amount = Number(invoice.totalAmount)
  const monthLabel = new Date(invoice.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Thanh toán hóa đơn</h3>
              <p className="text-sm text-gray-500 mt-0.5">{monthLabel}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice summary */}
          <div className="px-6 py-4 bg-primary-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {invoice.contract?.student?.user?.fullName} — Phòng {invoice.contract?.room?.roomNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-700">
                  {amount.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {/* Method selection */}
            {!method && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-4">Chọn phương thức thanh toán:</p>
                {isAdminMode && (
                  <p className="text-xs text-gray-500 mb-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    Sau khi chọn hình thức, vui lòng bấm nút <strong>Xác nhận</strong> ở bước tiếp theo — chỉ chọn ô là chưa cập nhật trạng thái hóa đơn.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMethod('transfer')}
                    className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm">Chuyển khoản</p>
                      <p className="text-xs text-gray-500 mt-0.5">Chuyển khoản ngân hàng</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setMethod('cash')}
                    className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm">Tiền mặt</p>
                      <p className="text-xs text-gray-500 mt-0.5">Nộp trực tiếp tại văn phòng</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Transfer method */}
            {method === 'transfer' && !confirmed && (
              <div className="space-y-4">
                <button onClick={() => setMethod(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  ← Đổi phương thức
                </button>

                {/* QR Code Section */}
                {loadingQr ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : qrData ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="text-center space-y-4">
                      {/* QR Code Image */}
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                          <img
                            src={qrData.qrCode}
                            alt="QR Code"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                      </div>

                      {/* Bank Info */}
                      <div className="bg-white rounded-xl p-4 space-y-2 text-left">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-sm text-gray-600">Ngân hàng</span>
                          <span className="text-sm font-semibold text-blue-700">{qrData.bankName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-sm text-gray-600">Số tài khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-900">{qrData.bankAccount}</span>
                            <button
                              onClick={() => copyToClipboard(qrData.bankAccount, 'account')}
                              className="text-blue-400 hover:text-blue-600 transition-colors"
                              title="Sao chép"
                            >
                              {copiedField === 'account'
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-sm text-gray-600">Chủ tài khoản</span>
                          <span className="text-sm font-semibold text-gray-900">{qrData.accountName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-sm text-gray-600">Số tiền</span>
                          <span className="text-lg font-bold text-green-600">{qrData.amount.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Nội dung chuyển khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary-700 max-w-[200px] truncate">
                              {qrData.transferContent}
                            </span>
                            <button
                              onClick={() => copyToClipboard(qrData.transferContent, 'ref')}
                              className="text-blue-400 hover:text-blue-600 transition-colors"
                              title="Sao chép"
                            >
                              {copiedField === 'ref'
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold mb-1">Hướng dẫn thanh toán:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                              <li>Quét mã QR bằng ứng dụng ngân hàng</li>
                              <li>Kiểm tra thông tin và xác nhận chuyển khoản</li>
                              <li>Nhập đúng nội dung chuyển khoản để hệ thống xác nhận tự động</li>
                              <li>Sau khi chuyển, bấm nút "Xác nhận" bên dưới</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Thông tin chuyển khoản</p>
                    </div>

                    {[
                      { label: 'Ngân hàng', value: BANK_INFO.bankName, field: 'bank' },
                      { label: 'Số tài khoản', value: BANK_INFO.accountNumber, field: 'account' },
                      { label: 'Chủ tài khoản', value: BANK_INFO.accountName, field: 'name' },
                      { label: 'Chi nhánh', value: BANK_INFO.branch, field: 'branch' },
                      { label: 'Số tiền', value: `${amount.toLocaleString('vi-VN')} đ`, field: 'amount' },
                      { label: 'Nội dung CK', value: transferRef, field: 'ref' },
                    ].map(({ label, value, field }) => (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold text-blue-900 ${field === 'ref' ? 'text-primary-700' : ''}`}>
                            {value}
                          </span>
                          {['account', 'ref', 'amount'].includes(field) && (
                            <button
                              onClick={() => copyToClipboard(value, field)}
                              className="text-blue-400 hover:text-blue-600 transition-colors"
                              title="Sao chép"
                            >
                              {copiedField === field
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận. Sau khi chuyển khoản, vui lòng bấm xác nhận bên dưới.
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {isAdminMode && (
                  <button
                    onClick={handleConfirmTransfer}
                    disabled={confirming}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {confirming ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xác nhận...</>
                    ) : 'Xác nhận đã nhận chuyển khoản'}
                  </button>
                )}

                {!isAdminMode && (
                  <p className="text-center text-sm text-gray-500 border-t pt-3">
                    Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật trạng thái hoặc liên hệ nhân viên để xác nhận.
                  </p>
                )}
              </div>
            )}

            {/* Transfer confirmed */}
            {method === 'transfer' && confirmed && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Đã xác nhận thanh toán!</h4>
                <p className="text-sm text-gray-500">Hóa đơn đã được cập nhật thành công.</p>
              </div>
            )}

            {/* Cash method */}
            {method === 'cash' && !confirmed && (
              <div className="space-y-4">
                <button onClick={() => setMethod(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  ← Đổi phương thức
                </button>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-900">Thanh toán tiền mặt</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-green-800">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Văn phòng Ban Quản lý Ký túc xá</p>
                      <p className="text-green-700 mt-0.5">Tòa A, Tầng 1 — Giờ làm việc: 7:30 – 17:00 (Thứ 2 – Thứ 6)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Liên hệ nhân viên hỗ trợ:</p>
                  {loadingStaff ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Không có thông tin nhân viên. Vui lòng liên hệ trực tiếp văn phòng.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {staffList.map(staff => (
                        <div key={staff.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{staff.fullName}</p>
                            {staff.staffInfo?.position && (
                              <p className="text-xs text-gray-500">{staff.staffInfo.position}{staff.staffInfo.department ? ` — ${staff.staffInfo.department}` : ''}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-1">
                              {staff.phone && (
                                <a href={`tel:${staff.phone}`} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                                  <Phone className="w-3 h-3" />
                                  {staff.phone}
                                </a>
                              )}
                              {staff.email && (
                                <a href={`mailto:${staff.email}`} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {staff.email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Vui lòng mang theo <strong>mã hóa đơn: {invoice.id.slice(0, 8).toUpperCase()}</strong> khi đến nộp tiền để được xử lý nhanh hơn.
                </div>

                {isAdminMode && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ghi chú biên lai / phiếu thu (tuỳ chọn)
                      </label>
                      <input
                        type="text"
                        value={cashReceiptNote}
                        onChange={(e) => setCashReceiptNote(e.target.value)}
                        placeholder="VD: PT-2026-001"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lưu vào <code className="bg-gray-100 px-1 rounded">paymentRef</code> để đối soát; để trống hệ thống tự tạo mã.
                      </p>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleConfirmCash}
                      disabled={confirming}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {confirming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Đang xác nhận...
                        </>
                      ) : (
                        'Xác nhận đã thu tiền mặt'
                      )}
                    </button>
                  </>
                )}

                {!isAdminMode && (
                  <p className="text-center text-sm text-gray-500 border-t pt-3">
                    Sau khi nộp tiền tại văn phòng, nhân viên sẽ xác nhận thanh toán trên hệ thống.
                  </p>
                )}
              </div>
            )}

            {method === 'cash' && confirmed && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Đã xác nhận thanh toán!</h4>
                <p className="text-sm text-gray-500">Hóa đơn đã được cập nhật thành công.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
