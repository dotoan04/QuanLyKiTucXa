'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { InvoicePrintModal } from '@/components/ui/InvoicePrintModal'
import { FileText, Search, CheckCircle, Printer, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

function GenerateBatchModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!month.match(/^\d{2}\/\d{4}$/)) {
      setError('Định dạng tháng không hợp lệ (MM/YYYY)')
      return
    }
    const [m, y] = month.split('/')
    if (parseInt(m, 10) < 1 || parseInt(m, 10) > 12) {
      setError('Tháng phải từ 01 đến 12')
      return
    }
    try {
      setLoading(true)
      setError('')
      const isoDate = `${y}-${m}-01T00:00:00.000Z`
      await api.post('/invoices/generate-batch', { invoiceMonth: isoDate })
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Tạo hóa đơn hàng loạt"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Tạo hóa đơn
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tháng tạo hóa đơn</label>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="MM/YYYY"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1.5 text-xs text-gray-500">Tạo hóa đơn cho mọi hợp đồng đang hoạt động trong tháng đã chọn.</p>
        </div>
      </div>
    </Modal>
  )
}

export default function StaffInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')
  const limit = 20

  // modal states
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [printInvoice, setPrintInvoice] = useState<any>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [page, search, statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/invoices', { params })
      const raw = res.data.data
      setInvoices(Array.isArray(raw) ? raw : [])
      setTotal(res.data.meta?.total || 0)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setSuccessMsg('Đã xác nhận thanh toán thành công!')
    setTimeout(() => setSuccessMsg(''), 4000)
    setSelectedInvoice(null)
    fetchInvoices()
  }

  const openPayment = (invoice: any, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPaymentInvoice(invoice)
    setSelectedInvoice(null)
  }

  const openPrint = (invoice: any, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPrintInvoice(invoice)
    setSelectedInvoice(null)
  }

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'overdue', label: 'Quá hạn' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="text-gray-600 mt-1 max-w-3xl">
            Quy trình lập hóa đơn: bộ phận kỹ thuật ghi nhận chỉ số điện nước, kế toán kiểm tra và phê duyệt số liệu,
            sau đó hệ thống phát hành hóa đơn tháng cho các phòng đã có chỉ số hợp lệ; sinh viên hoặc nhân viên phụ trách
            thực hiện xác nhận thanh toán theo từng hóa đơn.
          </p>
        </div>
        <Button onClick={() => setShowBatchModal(true)} icon={<RefreshCw className="h-4 w-4" />}>
          Tạo hóa đơn tháng
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <Card>
        <div className="p-4 border-b flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo tên sinh viên, phòng..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600">Không có hóa đơn nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Sinh viên</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Phòng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Kỳ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tổng tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Hạn nộp</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {inv.contract?.student?.user?.fullName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {inv.contract?.room?.roomNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(inv.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {inv.totalAmount?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className={`px-4 py-3 ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(inv)}>
                            Chi tiết
                          </Button>
                          <Button variant="outline" size="sm" onClick={(e) => openPrint(inv, e)} title="In hóa đơn">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          {(inv.status === 'unpaid' || inv.status === 'overdue') && (
                            <Button variant="primary" size="sm" onClick={(e) => openPayment(inv, e)}>
                              Xác nhận thanh toán
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Trước</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Sau</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title="Chi tiết hóa đơn"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Sinh viên</label>
                <p className="text-gray-900">{selectedInvoice.contract?.student?.user?.fullName}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Phòng</label>
                <p className="text-gray-900">
                  {selectedInvoice.contract?.room?.roomNumber} - Tòa {selectedInvoice.contract?.room?.building}
                </p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Kỳ hóa đơn</label>
                <p className="text-gray-900">
                  {new Date(selectedInvoice.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Trạng thái</label>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Chi tiết thanh toán</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền phòng</span>
                <span className="font-medium">{selectedInvoice.roomFee?.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền điện ({selectedInvoice.electricityCurr - selectedInvoice.electricityPrev} kWh)</span>
                <span className="font-medium">
                  {((selectedInvoice.electricityCurr - selectedInvoice.electricityPrev) * selectedInvoice.electricityPrice).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền nước ({selectedInvoice.waterCurr - selectedInvoice.waterPrev} m³)</span>
                <span className="font-medium">
                  {((selectedInvoice.waterCurr - selectedInvoice.waterPrev) * selectedInvoice.waterPrice).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-blue-700 text-lg">{selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Hạn thanh toán</label>
                <p className={selectedInvoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {selectedInvoice.paidAt && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Ngày thanh toán</label>
                  <p className="text-green-700 font-medium">{new Date(selectedInvoice.paidAt).toLocaleDateString('vi-VN')}</p>
                </div>
              )}
            </div>

            {selectedInvoice.status === 'paid' && selectedInvoice.paymentMethod && (
              <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                <span className="font-medium">Phương thức thanh toán: </span>
                {{ cash: 'Tiền mặt', transfer: 'Chuyển khoản', vnpay: 'VNPay', momo: 'MoMo' }[selectedInvoice.paymentMethod as string] || selectedInvoice.paymentMethod}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => openPrint(selectedInvoice)}
              >
                <Printer className="h-4 w-4 mr-2" />
                In hóa đơn
              </Button>
              {selectedInvoice.status !== 'paid' && (
                <Button
                  className="flex-1"
                  onClick={() => openPayment(selectedInvoice)}
                >
                  Xác nhận thanh toán
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment modal (admin/staff mode) */}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
          isAdminMode
        />
      )}

      {/* Print / PDF modal */}
      {printInvoice && (
        <InvoicePrintModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
        />
      )}

      {showBatchModal && (
        <GenerateBatchModal
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false)
            setSuccessMsg('Đã tạo hóa đơn hàng loạt.')
            setTimeout(() => setSuccessMsg(''), 4000)
            fetchInvoices()
          }}
        />
      )}
    </div>
  )
}
