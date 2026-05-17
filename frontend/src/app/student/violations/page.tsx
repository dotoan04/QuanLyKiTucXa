'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, FileWarning, Send, X } from 'lucide-react'
import api from '@/lib/api'

interface Violation {
  id: string
  type?: string
  violationType?: string
  description: string
  evidence?: unknown
  penaltyLevel: string
  penaltyAmount: number | string
  penaltyApplied?: boolean
  notes?: string | null
  status: string
  createdAt: string
  updatedAt?: string
  incident?: { id: string; title: string; category?: string } | null
  reporter?: { id: string; fullName: string } | null
}

interface ViolationStats {
  total: number
  pending: number
  processed: number
  appealed: number
  totalPenalty: number
}

const TYPE_LABELS: Record<string, string> = {
  noise: 'Gây ồn ào',
  noise_excessive: 'Gây ồn quá mức',
  damage: 'Phá hoại tài sản',
  unauthorized_guest: 'Khách không phép',
  unauthorized_guest_overnight: 'Khách ở qua đêm không phép',
  theft: 'Trộm cắp',
  assault: 'Bạo lực',
  drug: 'Ma túy',
  drug_use: 'Sử dụng chất cấm',
  gambling: 'Cờ bạc',
  other: 'Khác',
}

const LEVEL_LABELS: Record<string, string> = {
  low: 'Nhẹ',
  medium: 'Trung bình',
  high: 'Nặng',
  severe: 'Rất nặng',
}

const LEVEL_COLORS: Record<string, string> = {
  low: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  medium: 'bg-orange-50 text-orange-700 ring-orange-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
  severe: 'bg-red-100 text-red-900 ring-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processed: 'Đã xử lý',
  appealed: 'Đang khiếu nại',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  processed: 'bg-green-50 text-green-700 ring-green-200',
  appealed: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const emptyStats: ViolationStats = {
  total: 0,
  pending: 0,
  processed: 0,
  appealed: 0,
  totalPenalty: 0,
}

const formatCurrency = (value: number | string | undefined) => {
  const amount = Number(value || 0)
  return amount > 0 ? `${amount.toLocaleString('vi-VN')}đ` : 'Không có'
}

const getViolationType = (item: Violation) => item.type || item.violationType || 'other'

export default function StudentViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [stats, setStats] = useState<ViolationStats>(emptyStats)
  const [selected, setSelected] = useState<Violation | null>(null)
  const [loading, setLoading] = useState(true)
  const [appealReason, setAppealReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchViolations()
  }, [])

  const fetchViolations = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/violations/my')
      const data = res.data.data || {}
      setViolations(Array.isArray(data.violations) ? data.violations : [])
      setStats({ ...emptyStats, ...(data.stats || {}) })
    } catch (err) {
      console.error(err)
      setError('Không thể tải danh sách vi phạm. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = selected ? getViolationType(selected) : 'other'

  const evidenceLinks = useMemo(() => {
    if (!selected?.evidence) return []
    if (Array.isArray(selected.evidence)) return selected.evidence.filter((item): item is string => typeof item === 'string')
    if (typeof selected.evidence === 'string') return [selected.evidence]
    if (typeof selected.evidence === 'object') {
      return Object.values(selected.evidence as Record<string, unknown>).filter((item): item is string => typeof item === 'string')
    }
    return []
  }, [selected])

  const handleAppeal = async () => {
    if (!selected || !appealReason.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/violations/${selected.id}/appeal`, { appealReason: appealReason.trim() })
      setAppealReason('')
      setSelected(null)
      await fetchViolations()
    } catch (err) {
      console.error(err)
      setError('Không thể gửi khiếu nại. Vui lòng kiểm tra nội dung và thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cảnh báo vi phạm</h1>
        <p className="mt-1 text-sm text-gray-500">Theo dõi chi tiết các cảnh báo, mức xử lý và gửi khiếu nại nếu cần.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Tổng vi phạm</p>
            <FileWarning className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Chờ xử lý</p>
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Đã xử lý</p>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.processed}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Tổng tiền phạt</p>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPenalty)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-gray-400">
            <AlertTriangle className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium text-gray-600">Bạn chưa có cảnh báo vi phạm nào</p>
            <p className="mt-1 text-sm">Các cảnh báo mới sẽ hiển thị tại đây khi được quản lý ghi nhận.</p>
          </div>
        ) : (
          <div className="divide-y">
            {violations.map((item) => {
              const type = getViolationType(item)
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item); setAppealReason(''); setError('') }}
                  className="block w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{TYPE_LABELS[type] ?? type}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${LEVEL_COLORS[item.penaltyLevel] ?? 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                          {LEVEL_LABELS[item.penaltyLevel] ?? item.penaltyLevel}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_COLORS[item.status] ?? 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
                      <p className="mt-2 text-xs text-gray-400">Ngày ghi nhận: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 md:text-right">
                      {formatCurrency(item.penaltyAmount)}
                      <p className="mt-1 text-xs font-normal text-blue-600">Xem chi tiết</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Chi tiết vi phạm</h2>
                <p className="text-sm text-gray-500">Mã biên bản: {selected.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Loại vi phạm</p>
                  <p className="mt-1 font-semibold text-gray-900">{TYPE_LABELS[selectedType] ?? selectedType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ngày ghi nhận</p>
                  <p className="mt-1 font-semibold text-gray-900">{new Date(selected.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Mức độ</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${LEVEL_COLORS[selected.penaltyLevel] ?? 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                    {LEVEL_LABELS[selected.penaltyLevel] ?? selected.penaltyLevel}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Trạng thái</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATUS_COLORS[selected.status] ?? 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Nội dung cảnh báo</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">{selected.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Tiền phạt</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatCurrency(selected.penaltyAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Người ghi nhận</p>
                  <p className="mt-1 font-semibold text-gray-900">{selected.reporter?.fullName || 'Ban quản lý KTX'}</p>
                </div>
              </div>

              {selected.incident && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Sự cố liên quan</p>
                  <p className="mt-1 text-sm text-gray-700">{selected.incident.title}</p>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ghi chú xử lý</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">{selected.notes}</p>
                </div>
              )}

              {evidenceLinks.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Minh chứng</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {evidenceLinks.map((link, index) => (
                      <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                        Minh chứng {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.status !== 'appealed' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900">Gửi khiếu nại</p>
                  <p className="mt-1 text-sm text-blue-700">Nếu thông tin chưa chính xác, nhập lý do để ban quản lý xem xét lại.</p>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập lý do khiếu nại..."
                  />
                  <button
                    onClick={handleAppeal}
                    disabled={submitting || !appealReason.trim()}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
