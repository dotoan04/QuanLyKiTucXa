'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileText, Calendar, DollarSign, Eye } from 'lucide-react'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

export default function StudentInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => { fetchInvoices() }, [])

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/my-invoices')
      const d = res.data.data
      // API returns { unpaid: { invoices }, overdue: { invoices }, recentPayments }
      if (Array.isArray(d)) {
        setInvoices(d)
      } else if (d && typeof d === 'object') {
        const all = [
          ...(d.unpaid?.invoices || []),
          ...(d.overdue?.invoices || []),
          ...(d.recentPayments || []),
        ]
        // Deduplicate by id
        const unique = Array.from(new Map(all.map((i: any) => [i.id, i])).values())
        setInvoices(unique)
      } else {
        setInvoices([])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    fetchInvoices()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hóa đơn của tôi</h1>
        <p className="text-gray-500 mt-1">Xem lịch sử hóa đơn và trạng thái thanh toán</p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8 text-gray-300" />} title="Chưa có hóa đơn" description="Hóa đơn sẽ được tạo hàng tháng khi bạn có hợp đồng đang hoạt động" />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id} hover className="p-5 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${inv.status === 'paid' ? 'bg-emerald-50' : inv.status === 'overdue' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <FileText className={`w-5 h-5 ${inv.status === 'paid' ? 'text-emerald-600' : inv.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Tháng {new Date(inv.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        HSD: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatVnd(inv.totalAmount)}
                    </p>
                    <StatusBadge status={inv.status} size="sm" />
                  </div>
                  {(inv.status === 'unpaid' || inv.status === 'overdue') && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(inv)
                        handlePayment()
                      }}
                    >
                      Thanh toán
                    </Button>
                  )}
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Chi tiết hóa đơn" size="lg">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-2xl font-bold text-gray-900">{formatVnd(selectedInvoice.totalAmount)}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} size="md" />
            </div>

            <div className="space-y-3">
              {[
                { label: 'Tiền phòng', value: selectedInvoice.roomFee },
                { label: 'Tiền điện', value: selectedInvoice.electricityFee },
                { label: 'Tiền nước', value: selectedInvoice.waterFee },
                { label: 'Phí khác', value: selectedInvoice.otherFees },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{formatVnd(item.value)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hạn thanh toán</span>
                <span className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}</span>
              </div>
              {selectedInvoice.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ngày thanh toán</span>
                  <span className="font-medium text-emerald-600">{new Date(selectedInvoice.paidAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
