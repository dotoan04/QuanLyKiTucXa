'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'
import api from '@/lib/api'

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function DirectorRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

        const res = await api.get('/dashboard/revenue', {
          params: { startDate, endDate }
        })
        setInvoices(res.data.data || [])
      } catch (error) {
        const err = error as ApiError
        setErrorMsg(err.response?.data?.message || 'Không tải được báo cáo doanh thu')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const unpaidRevenue = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0

  if (loading) return <div className="py-10 text-gray-500">Đang tải dữ liệu...</div>

  if (errorMsg) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo doanh thu</h1>
        <Card className="p-6 border border-red-200 bg-red-50">
          <p className="text-red-700">{errorMsg}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo doanh thu</h1>
        <p className="text-gray-500 mt-1">Tổng hợp doanh thu hóa đơn tháng hiện tại</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng hóa đơn</p>
              <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng doanh thu</p>
              <p className="text-xl font-bold text-gray-900">{totalRevenue.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Đã thu ({paidCount}/{invoices.length})</p>
              <p className="text-xl font-bold text-green-600">{paidRevenue.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chưa thu</p>
              <p className="text-xl font-bold text-red-600">{unpaidRevenue.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Tỷ lệ thu</h2>
          <span className="text-2xl font-bold text-gray-900">{collectionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Đã thu {paidCount} / {invoices.length} hóa đơn
        </p>
      </Card>

      <Card>
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Chi tiết hóa đơn</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Không có hóa đơn trong tháng này</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tháng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sinh viên</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phòng</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Tổng tiền</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(inv.invoiceMonth).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{inv.contract?.student?.user?.fullName || '-'}</p>
                      <p className="text-xs text-gray-500">{inv.contract?.student?.studentCode || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.contract?.room?.building}-{inv.contract?.room?.roomNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {Number(inv.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status === 'paid' ? 'Đã thanh toán' :
                         inv.status === 'overdue' ? 'Quá hạn' : 'Chờ thanh toán'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
