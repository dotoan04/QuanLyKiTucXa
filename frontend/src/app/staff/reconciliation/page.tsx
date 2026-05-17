'use client'

import { useState, useEffect } from 'react'
import { BarChart2, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface ReconciliationReport {
  id: string
  month: string
  gateway: string
  status: string
  totalTransactions: number
  matchedTransactions: number
  discrepancyCount: number
  successRate: number
  processedBy?: { id: string; fullName: string }
  createdAt: string
}

interface Discrepancy {
  index: number
  type: string
  description: string
  amount?: number
  resolved: boolean
}

interface ReportDetail extends ReconciliationReport {
  discrepancies: Discrepancy[]
}

interface Stats {
  total: number
  matched: number
  discrepancies: number
  byGateway: Record<string, { total: number; matched: number; discrepancies: number }>
}

/** API trả totalTransactions / totalMatched / reports; map về shape UI. */
function normalizeStats(raw: unknown): Stats {
  const r = raw as Record<string, unknown> | null | undefined
  return {
    total: Number(r?.totalTransactions ?? r?.total ?? 0),
    matched: Number(r?.totalMatched ?? r?.matched ?? 0),
    discrepancies: Number(r?.totalDiscrepancies ?? r?.discrepancies ?? 0),
    byGateway:
      r?.byGateway && typeof r.byGateway === 'object'
        ? (r.byGateway as Stats['byGateway'])
        : {},
  }
}

function normalizeReportRow(raw: Record<string, unknown>): ReconciliationReport {
  const j = (raw?.data as Record<string, unknown> | undefined) || {}
  const totalTransactions = Number(j.totalTransactions ?? 0)
  const matched = Number(j.matched ?? 0)
  const disc = j.discrepancies
  const discrepancyCount = Number(
    j.unmatched ?? (Array.isArray(disc) ? disc.length : 0)
  )
  const successRate =
    totalTransactions > 0 ? Math.round((matched / totalTransactions) * 1000) / 10 : 0
  const proc = raw.processor as { id?: string; fullName?: string } | undefined
  return {
    id: String(raw.id),
    month: String(raw.month ?? ''),
    gateway: String(raw.paymentGateway ?? raw.gateway ?? ''),
    status: String(raw.status ?? ''),
    totalTransactions,
    matchedTransactions: matched,
    discrepancyCount,
    successRate,
    processedBy: proc?.id ? { id: proc.id, fullName: proc.fullName ?? '' } : undefined,
    createdAt: String(raw.createdAt ?? ''),
  }
}

function normalizeReportDetail(raw: Record<string, unknown>): ReportDetail {
  const base = normalizeReportRow(raw)
  const j = (raw?.data as Record<string, unknown> | undefined) || {}
  const discs = Array.isArray(j.discrepancies) ? j.discrepancies : []
  return {
    ...base,
    discrepancies: discs.map((d: Record<string, unknown>, i: number) => ({
      index: i,
      type: String(d.type ?? 'unknown'),
      description: String(d.description ?? ''),
      amount:
        d.amount != null
          ? Number(d.amount)
          : d.gatewayAmount != null
            ? Number(d.gatewayAmount)
            : d.systemAmount != null
              ? Number(d.systemAmount)
              : undefined,
      resolved: Boolean(d.resolved),
    })),
  }
}

const GATEWAY_LABELS: Record<string, string> = {
  vnpay: 'VNPay',
  momo: 'MoMo',
  banking: 'Chuyển khoản',
}

const DISC_TYPE_LABELS: Record<string, string> = {
  missing_in_system: 'Thiếu trong hệ thống',
  missing_in_gateway: 'Thiếu trên cổng',
  amount_mismatch: 'Sai số tiền',
}

export default function ReconciliationPage() {
  const [reports, setReports] = useState<ReconciliationReport[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [showReconcile, setShowReconcile] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [reconcileError, setReconcileError] = useState('')
  const [reconcileForm, setReconcileForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    gateway: 'vnpay',
    transactions: '',
  })

  const LIMIT = 10

  useEffect(() => { fetchData() }, [page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reportsRes, statsRes] = await Promise.allSettled([
        api.get('/reconciliation/reports', { params: { page, limit: LIMIT } }),
        api.get('/reconciliation/stats'),
      ])
      if (reportsRes.status === 'fulfilled') {
        const data = reportsRes.value.data.data as Record<string, unknown> | undefined
        const rawList = Array.isArray(data?.reports)
          ? (data.reports as Record<string, unknown>[])
          : Array.isArray(data?.items)
            ? (data.items as Record<string, unknown>[])
            : []
        setReports(rawList.map(normalizeReportRow))
        setTotal(
          typeof data?.total === 'number' ? data.total : rawList.length
        )
      }
      if (statsRes.status === 'fulfilled') {
        setStats(normalizeStats(statsRes.value.data.data))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (reportId: string) => {
    setLoadingDetail(true)
    setSelectedReport(null)
    try {
      const res = await api.get(`/reconciliation/reports/${reportId}`)
      const raw = res.data.data as Record<string, unknown>
      setSelectedReport(normalizeReportDetail(raw))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleReconcile = async () => {
    setReconcileError('')
    setReconciling(true)
    try {
      let transactions: unknown[] = []
      if (reconcileForm.transactions.trim()) {
        try {
          transactions = JSON.parse(reconcileForm.transactions)
        } catch {
          setReconcileError('Dữ liệu giao dịch không đúng định dạng JSON')
          setReconciling(false)
          return
        }
        if (!Array.isArray(transactions)) {
          setReconcileError('Dữ liệu giao dịch phải là một mảng JSON [...]')
          setReconciling(false)
          return
        }
      } else {
        const ok = confirm(
          'Bạn chưa dán JSON giao dịch từ cổng. Hệ thống sẽ đối soát với 0 giao dịch — mọi khoản đã ghi nhận trên hệ thống trong tháng có thể bị báo "thiếu trên cổng". Chỉ dùng để kiểm thử. Tiếp tục?'
        )
        if (!ok) {
          setReconciling(false)
          return
        }
      }
      await api.post('/reconciliation', {
        month: reconcileForm.month,
        gateway: reconcileForm.gateway,
        transactions,
      })
      setShowReconcile(false)
      setReconcileForm({ month: new Date().toISOString().slice(0, 7), gateway: 'vnpay', transactions: '' })
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setReconcileError(e?.response?.data?.message ?? 'Đối soát thất bại')
    } finally {
      setReconciling(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đối soát thanh toán</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            <strong>Luồng:</strong> xuất danh sách giao dịch từ cổng (VNPay/MoMo/CK) → dán JSON vào đây → <strong>Chạy đối soát</strong> so với hóa đơn{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">paid</code> trong tháng (<strong>paymentRef</strong> trên hóa đơn phải trùng <strong>transactionId</strong> từ cổng). Kết quả lưu lịch sử; màn hình hiện chỉ xem chi tiết — API <code className="text-xs bg-gray-100 px-1 rounded">PUT .../resolve</code> dành cho kế toán/admin khi cần ghi nhận xử lý.
          </p>
        </div>
        <button
          onClick={() => setShowReconcile(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Chạy đối soát
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 mb-1">Tổng giao dịch đối soát</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString('vi-VN')}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 mb-1">Khớp thành công</p>
            <p className="text-3xl font-bold text-green-600">{stats.matched.toLocaleString('vi-VN')}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 mb-1">Sai lệch cần xử lý</p>
            <p className="text-3xl font-bold text-red-600">{stats.discrepancies.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Lịch sử đối soát</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
            <p>Chưa có báo cáo đối soát nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tháng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cổng TT</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Giao dịch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Khớp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sai lệch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tỷ lệ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày chạy</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.month}</td>
                    <td className="px-4 py-3 text-gray-700">{GATEWAY_LABELS[r.gateway] ?? r.gateway}</td>
                    <td className="px-4 py-3 text-gray-700">{r.totalTransactions}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{r.matchedTransactions}</td>
                    <td className="px-4 py-3">
                      {r.discrepancyCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {r.discrepancyCount}
                        </span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(100, r.successRate)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {(Number.isFinite(r.successRate) ? r.successRate : 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(r.id)} className="text-blue-600 hover:underline text-xs">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Tổng: {total} báo cáo</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
            <span className="px-3 py-1">{page}/{totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(selectedReport || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết báo cáo đối soát</h2>
              <button onClick={() => setSelectedReport(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : selectedReport && (
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Tổng GD</p>
                    <p className="text-xl font-bold text-gray-900">{selectedReport.totalTransactions}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Khớp</p>
                    <p className="text-xl font-bold text-green-600">{selectedReport.matchedTransactions}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Sai lệch</p>
                    <p className="text-xl font-bold text-red-600">{selectedReport.discrepancyCount}</p>
                  </div>
                </div>
                {selectedReport.discrepancies?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 text-sm">Danh sách sai lệch</h3>
                    <div className="space-y-2">
                      {selectedReport.discrepancies.map((d, i) => (
                        <div key={i} className={`rounded-lg border p-3 text-sm ${d.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mr-2 ${d.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {DISC_TYPE_LABELS[d.type] ?? d.type}
                              </span>
                              <span className="text-gray-700">{d.description}</span>
                            </div>
                            {d.amount != null && !Number.isNaN(Number(d.amount)) && (
                              <span className="text-gray-900 font-medium ml-2 flex-shrink-0">
                                {Number(d.amount).toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                          {d.resolved && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Đã xử lý
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end px-6 py-4 border-t flex-shrink-0">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {showReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chạy đối soát thanh toán</h2>
              <button onClick={() => setShowReconcile(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
                  <input
                    type="month"
                    value={reconcileForm.month}
                    onChange={e => setReconcileForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cổng thanh toán</label>
                  <select
                    value={reconcileForm.gateway}
                    onChange={e => setReconcileForm(f => ({ ...f, gateway: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(GATEWAY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dữ liệu giao dịch từ cổng (JSON mảng)</label>
                <textarea
                  rows={6}
                  value={reconcileForm.transactions}
                  onChange={e => setReconcileForm(f => ({ ...f, transactions: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`[
  {
    "transactionId": "Mã GD trùng paymentRef trên hóa đơn",
    "amount": 1500000,
    "timestamp": "2026-03-15T10:00:00.000Z",
    "status": "success",
    "studentCode": "Mã SV (tuỳ chọn)"
  }
]`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bắt buộc khớp <strong>transactionId</strong> với trường <strong>paymentRef</strong> của hóa đơn đã thanh toán trong tháng, và <strong>amount</strong> với tổng tiền hóa đơn (sai &gt; 1đ sẽ báo lệch). Để trống chỉ nên dùng khi kiểm thử.
                </p>
              </div>
              {reconcileError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {reconcileError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setShowReconcile(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button
                onClick={handleReconcile}
                disabled={reconciling}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
                {reconciling ? 'Đang chạy...' : 'Chạy đối soát'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
