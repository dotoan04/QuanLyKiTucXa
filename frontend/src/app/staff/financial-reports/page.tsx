'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileJson, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface FinancialSummary {
  month: string
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  overdueInvoices: number
  totalRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
  roomRentRevenue: number
  electricityRevenue: number
  waterRevenue: number
  otherRevenue: number
  collectionRate: number
}

interface ReportItem {
  id: string
  studentCode: string
  studentName: string
  room: string
  totalAmount: number
  status: string
  dueDate: string
  paidAt: string | null
}

interface GeneratedReport {
  month: string
  generatedAt: string
  summary: FinancialSummary
  items: ReportItem[]
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  overdue: 'Quá hạn',
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function FinancialReportsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)
  const [error, setError] = useState('')
  const [report, setReport] = useState<GeneratedReport | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<FinancialSummary[]>([])

  useEffect(() => {
    fetchMonthlyStats()
  }, [])

  const fetchMonthlyStats = async () => {
    try {
      const res = await api.get('/financial-reports/stats', { params: { months: 6 } })
      setMonthlyStats(res.data.data ?? [])
    } catch (err) {
      console.error(err)
    }
  }

  const generateReport = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/financial-reports/generate', { month })
      setReport(res.data.data)
      fetchMonthlyStats()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Không thể tạo báo cáo tài chính')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json') => {
    setError('')
    setExporting(format)
    try {
      const endpoint = format === 'csv' ? '/financial-reports/export/csv' : '/financial-reports/export/json'
      const response = await api.get(endpoint, {
        params: { month },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-tai-chinh-${month}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Xuất báo cáo thất bại')
    } finally {
      setExporting(null)
    }
  }

  const topInvoices = useMemo(() => {
    if (!report?.items) return []
    return [...report.items].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 8)
  }, [report])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo tài chính</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">
            <strong>Luồng:</strong> đọc dữ liệu trực tiếp từ hóa đơn đã có trong hệ thống theo tháng (YYYY-MM). Nút <strong>Tạo báo cáo</strong>{' '}
            tổng hợp trên màn hình (không lưu file riêng); <strong>CSV/JSON</strong> xuất cùng nội dung. Không thay thế sổ kế toán — chỉ báo cáo vận hành KTX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
          </button>
          <button
            onClick={() => exportReport('csv')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => exportReport('json')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileJson className="h-4 w-4" /> JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {report?.summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Tổng doanh thu</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{report.summary.totalRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Đã thu</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{report.summary.collectedRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Còn phải thu</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{report.summary.outstandingRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Tỷ lệ thu</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{report.summary.collectionRate}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">Xu hướng 6 tháng gần nhất</h2>
          </div>
          <div className="p-5 space-y-3">
            {monthlyStats.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu thống kê.</p>
            ) : (
              monthlyStats.map((s) => (
                <div key={s.month} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{s.month}</span>
                    <span className="text-gray-600">{s.collectionRate}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, s.collectionRate)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Doanh thu: {s.totalRevenue.toLocaleString('vi-VN')}đ</span>
                    <span>Đã thu: {s.collectedRevenue.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="border-b px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Hóa đơn giá trị cao</h2>
            <Download className="h-4 w-4 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            {topInvoices.length === 0 ? (
              <div className="p-5 text-sm text-gray-500">Tạo báo cáo để xem danh sách hóa đơn.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Sinh viên</th>
                    <th className="px-4 py-3 text-left font-medium">Phòng</th>
                    <th className="px-4 py-3 text-left font-medium">Tổng tiền</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topInvoices.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.studentName}</p>
                        <p className="text-xs text-gray-500">{item.studentCode}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.room}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.totalAmount.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
