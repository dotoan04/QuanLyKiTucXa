'use client'

import { X, Printer, Download } from 'lucide-react'
import { useRef } from 'react'

interface InvoiceDetail {
  id: string
  invoiceMonth: string
  roomFee: number
  electricityPrev: number
  electricityCurr: number
  electricityPrice: number
  waterPrev: number
  waterCurr: number
  waterPrice: number
  otherFees?: Record<string, number> | null
  totalAmount: number
  dueDate: string
  status: string
  paidAt?: string | null
  paymentMethod?: string | null
  contract?: {
    student?: {
      studentCode?: string
      user?: { fullName?: string; email?: string; phone?: string }
    }
    room?: {
      roomNumber?: string
      building?: string
      floor?: number
      roomType?: { name?: string }
    }
  }
}

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  partial: 'Thanh toán một phần',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  vnpay: 'VNPay',
  momo: 'MoMo',
}

interface InvoicePrintModalProps {
  invoice: InvoiceDetail | null
  onClose: () => void
}

export function InvoicePrintModal({ invoice, onClose }: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!invoice) return null

  const electricityUsage = Number(invoice.electricityCurr) - Number(invoice.electricityPrev)
  const electricityFee = electricityUsage * Number(invoice.electricityPrice)
  const waterUsage = Number(invoice.waterCurr) - Number(invoice.waterPrev)
  const waterFee = waterUsage * Number(invoice.waterPrice)
  const otherTotal = invoice.otherFees
    ? Object.values(invoice.otherFees).reduce((s, v) => s + Number(v), 0)
    : 0

  const monthLabel = new Date(invoice.invoiceMonth).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Hóa đơn KTX — ${monthLabel}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Arial', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 24px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: bold; color: #1d4ed8; }
          .header p { color: #555; font-size: 12px; margin-top: 4px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 12px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e5e7eb; }
          .info-row .label { color: #555; }
          .info-row .value { font-weight: 600; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold; color: #1d4ed8; border-top: 2px solid #1d4ed8; margin-top: 8px; }
          .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-unpaid { background: #fef9c3; color: #854d0e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const statusClass =
    invoice.status === 'paid' ? 'status-paid' :
    invoice.status === 'overdue' ? 'status-overdue' : 'status-unpaid'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-bold text-gray-900">Xem trước hóa đơn</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                In / Lưu PDF
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div ref={printRef} className="bg-white">
              {/* Print header */}
              <div className="header text-center mb-6 pb-4 border-b-2 border-blue-700">
                <h1 className="text-xl font-bold text-blue-700">KÝ TÚC XÁ — HÓA ĐƠN THANH TOÁN</h1>
                <p className="text-gray-500 text-sm mt-1">Hóa đơn kỳ {monthLabel}</p>
                <p className="text-gray-400 text-xs mt-0.5">Mã hóa đơn: {invoice.id.slice(0, 8).toUpperCase()}</p>
              </div>

              {/* Student & room info */}
              <div className="grid grid-cols-2 gap-6 mb-5">
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 border-b pb-1">Thông tin sinh viên</p>
                  <div className="space-y-1">
                    {[
                      { label: 'Họ tên', value: invoice.contract?.student?.user?.fullName },
                      { label: 'Mã SV', value: invoice.contract?.student?.studentCode },
                      { label: 'Email', value: invoice.contract?.student?.user?.email },
                      { label: 'Điện thoại', value: invoice.contract?.student?.user?.phone || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 border-b pb-1">Thông tin phòng</p>
                  <div className="space-y-1">
                    {[
                      { label: 'Số phòng', value: invoice.contract?.room?.roomNumber },
                      { label: 'Tòa nhà', value: `Tòa ${invoice.contract?.room?.building}` },
                      { label: 'Tầng', value: invoice.contract?.room?.floor },
                      { label: 'Loại phòng', value: invoice.contract?.room?.roomType?.name },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="mb-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 border-b pb-1">Chi tiết thanh toán</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {[
                    { label: 'Tiền phòng', value: Number(invoice.roomFee) },
                    {
                      label: `Tiền điện (${electricityUsage} kWh × ${Number(invoice.electricityPrice).toLocaleString('vi-VN')} đ)`,
                      value: electricityFee
                    },
                    {
                      label: `Tiền nước (${waterUsage} m³ × ${Number(invoice.waterPrice).toLocaleString('vi-VN')} đ)`,
                      value: waterFee
                    },
                    ...(invoice.otherFees
                      ? Object.entries(invoice.otherFees).map(([k, v]) => ({ label: k, value: Number(v) }))
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium">{value.toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                  <div className="border-t-2 border-gray-300 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-xl text-blue-700">
                      {Number(invoice.totalAmount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment status */}
              <div className="mb-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 border-b pb-1">Thông tin thanh toán</p>
                <div className="space-y-1">
                  {[
                    { label: 'Hạn thanh toán', value: new Date(invoice.dueDate).toLocaleDateString('vi-VN') },
                    { label: 'Trạng thái', value: STATUS_LABELS[invoice.status] || invoice.status },
                    { label: 'Ngày thanh toán', value: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('vi-VN') : '—' },
                    { label: 'Phương thức', value: invoice.paymentMethod ? (PAYMENT_LABELS[invoice.paymentMethod] || invoice.paymentMethod) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="footer text-center text-xs text-gray-400 border-t pt-4 mt-2">
                <p>Đây là hóa đơn điện tử do hệ thống Quản lý Ký Túc Xá tạo ra.</p>
                <p className="mt-0.5">Hotline: 1900 xxxx | Email: ky-tuc-xa@edu.vn | © 2024 Ký Túc Xá</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
