'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { InvoicePrintModal } from '@/components/ui/InvoicePrintModal'
import { FileText, DollarSign, RefreshCw, TrendingUp, AlertTriangle, Printer, Search, Download, Bell, Filter } from 'lucide-react'
import api from '@/lib/api'

// ─── Batch generate modal ──────────────────────────────────────────────────────
function GenerateBatchModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
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
    if (parseInt(m) < 1 || parseInt(m) > 12) {
      setError('Tháng phải từ 01 đến 12')
      return
    }
    try {
      setLoading(true)
      setError('')
      const isoDate = `${y}-${m}-01T00:00:00.000Z`
      await api.post('/invoices/generate-batch', { invoiceMonth: isoDate })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Tạo hóa đơn hàng loạt" size="sm" footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
        <Button onClick={handleSubmit} loading={loading}>Tạo hóa đơn</Button>
      </>
    }>
      <div className="space-y-4">
        {error && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-xl border border-danger-200">{error}</div>}
        <div>
          <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Tháng tạo hóa đơn</label>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="MM/YYYY"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          <p className="text-xs text-navy-400 mt-1.5">Hệ thống sẽ tự động tạo hóa đơn cho tất cả hợp đồng đang hoạt động.</p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const [stats, setStats] = useState({ totalAmount: 0, paidAmount: 0, unpaidAmount: 0, overdueCount: 0 })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchInvoices() }, [page, search, statusFilter, monthFilter])

  const fetchStats = async () => {
    try {
      const res = await api.get('/invoices/stats/summary')
      setStats(res.data.data)
    } catch (error) { console.error('Failed to fetch stats:', error) }
  }

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (monthFilter) {
        const [m, y] = monthFilter.split('/')
        if (m && y) params.month = `${y}-${m}-01T00:00:00.000Z`
      }
      const res = await api.get('/invoices', { params })
      setInvoices(res.data.data || [])
      setTotal(res.data.meta?.total || 0)
    } catch (error) { console.error('Failed to fetch invoices:', error) } finally { setLoading(false) }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    fetchInvoices()
    fetchStats()
  }

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return inv.contract?.student?.user?.fullName?.toLowerCase().includes(q) ||
           inv.contract?.room?.roomNumber?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Quản lý hóa đơn</h1>
          <p className="text-navy-400 mt-0.5 font-body">Theo dõi và quản lý thu phí ký túc xá</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Download className="w-4 h-4" /> Xuất Excel</Button>
          <Button onClick={() => setShowGenerateModal(true)}><RefreshCw className="w-4 h-4" /> Tạo hóa đơn tháng</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/80">Tổng thu dự kiến</h3>
            <div className="p-2 bg-white/20 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold font-sans">{stats.totalAmount.toLocaleString('vi-VN')}đ</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-success-500 to-success-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/80">Đã thu</h3>
            <div className="p-2 bg-white/20 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold font-sans">{stats.paidAmount.toLocaleString('vi-VN')}đ</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-warning-500 to-warning-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/80">Chưa thu</h3>
            <div className="p-2 bg-white/20 rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold font-sans">{stats.unpaidAmount.toLocaleString('vi-VN')}đ</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-danger-500 to-danger-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/80">Quá hạn</h3>
            <div className="p-2 bg-white/20 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold font-sans">{stats.overdueCount} hóa đơn</p>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <div className="p-4 border-b border-surface-200/60 flex flex-wrap gap-3 bg-surface-50 rounded-t-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên SV, phòng..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="overdue">Quá hạn</option>
          </select>
          <input
            type="text"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            placeholder="Tháng (MM/YYYY)"
            className="w-32 px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-navy-200" />
            </div>
            <p className="text-sm font-semibold font-sans text-navy-500">Không tìm thấy hóa đơn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Sinh viên</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Phòng</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Kỳ thu</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Tổng tiền</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Hạn chót</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row-hover" onClick={() => setSelectedInvoice(inv)}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold font-sans text-navy-700">{inv.contract?.student?.user?.fullName}</p>
                      <p className="text-xs text-navy-400 font-body">{inv.contract?.student?.studentCode}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-600 font-body">{inv.contract?.room?.roomNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-navy-600 font-body">
                      {new Date(inv.invoiceMonth).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold font-sans text-primary-600">
                      {Number(inv.totalAmount).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-600 font-body">
                      {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'paid' && (
                          <Button size="sm" onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true) }}>
                            Thu tiền
                          </Button>
                        )}
                        <button className="p-1.5 text-navy-400 hover:text-navy-600 hover:bg-surface-100 rounded-lg transition-colors" onClick={() => { setSelectedInvoice(inv); setShowPrintModal(true) }}>
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showGenerateModal && (
        <GenerateBatchModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            fetchInvoices()
            fetchStats()
          }}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          invoice={selectedInvoice}
          onSuccess={handlePaymentSuccess}
          isAdminMode={true}
        />
      )}

      {showPrintModal && selectedInvoice && (
        <InvoicePrintModal
          onClose={() => setShowPrintModal(false)}
          invoice={selectedInvoice}
        />
      )}

      {selectedInvoice && !showPaymentModal && !showPrintModal && (
        <Modal isOpen onClose={() => setSelectedInvoice(null)} title="Chi tiết hóa đơn" size="md">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-400 font-body">Kỳ thu</p>
                <p className="text-lg font-bold font-sans text-navy-700">Tháng {new Date(selectedInvoice.invoiceMonth).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} size="md" />
            </div>

            <div className="bg-surface-50 rounded-xl p-4 border border-surface-200/60 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-navy-500 font-body">Sinh viên</span>
                <span className="font-semibold font-sans text-navy-700">{selectedInvoice.contract?.student?.user?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy-500 font-body">Phòng</span>
                <span className="font-semibold font-sans text-navy-700">{selectedInvoice.contract?.room?.roomNumber} - Tòa {selectedInvoice.contract?.room?.building}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy-500 font-body">Hạn thanh toán</span>
                <span className="font-semibold font-sans text-navy-700">{new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold font-sans text-navy-700 mb-3">Chi tiết các khoản thu</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm pb-2 border-b border-surface-200">
                  <span className="text-navy-600 font-body">Tiền phòng</span>
                  <span className="font-medium font-sans text-navy-700">{Number(selectedInvoice.roomFee).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b border-surface-200">
                  <span className="text-navy-600 font-body">Tiền điện</span>
                  <span className="font-medium font-sans text-navy-700">{Number(selectedInvoice.electricityFee).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b border-surface-200">
                  <span className="text-navy-600 font-body">Tiền nước</span>
                  <span className="font-medium font-sans text-navy-700">{Number(selectedInvoice.waterFee).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b border-surface-200">
                  <span className="text-navy-600 font-body">Phí khác</span>
                  <span className="font-medium font-sans text-navy-700">{Number(selectedInvoice.otherFees).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-base pt-2">
                  <span className="font-bold font-sans text-navy-700">Tổng cộng</span>
                  <span className="font-bold font-sans text-primary-600">{Number(selectedInvoice.totalAmount).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {selectedInvoice.status !== 'paid' && (
                <Button className="flex-1" onClick={() => setShowPaymentModal(true)}>Thu tiền</Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setShowPrintModal(true)}>
                <Printer className="w-4 h-4" /> In hóa đơn
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
