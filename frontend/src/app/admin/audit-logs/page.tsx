'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import {
  Search,
  Filter,
  History,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  entity: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; fullName: string; email: string } | null
}

const ENTITY_LABELS: Record<string, string> = {
  Contract: 'Hợp đồng',
  Invoice: 'Hóa đơn',
  RegistrationRequest: 'Hồ sơ đăng ký',
  Room: 'Phòng',
  Student: 'Sinh viên',
  User: 'Tài khoản',
  Incident: 'Sự cố',
  Violation: 'Vi phạm',
  RoomTransfer: 'Chuyển phòng',
  ReturnRequest: 'Trả phòng',
  ScheduledMaintenance: 'Bảo trì',
  AssetHandover: 'Bàn giao',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xóa',
  approve: 'Duyệt',
  reject: 'Từ chối',
  terminate: 'Chấm dứt',
  pay: 'Thanh toán',
  complete: 'Hoàn tất',
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
}

const ENTITY_OPTIONS = ['', 'Contract', 'Invoice', 'RegistrationRequest', 'Room', 'Student', 'User', 'Incident', 'Violation']
const ACTION_OPTIONS = ['', 'create', 'update', 'delete', 'approve', 'reject', 'terminate', 'pay', 'complete']

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { page, limit }
      if (entityFilter) params.entity = entityFilter
      if (actionFilter) params.action = actionFilter
      if (searchQuery) params.search = searchQuery

      const res = await api.get('/audit-logs', { params })
      setLogs(res.data.data?.items || [])
      setTotal(res.data.data?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, entityFilter, actionFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchLogs()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhật ký hoạt động</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi mọi thay đổi trong hệ thống</p>
        </div>
      </div>

      <Card padding>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Bộ lọc
          </Button>
          <span className="text-sm text-gray-500">{total} bản ghi</span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Tất cả đối tượng</option>
              {ENTITY_OPTIONS.filter(Boolean).map((e) => (
                <option key={e} value={e}>{ENTITY_LABELS[e] || e}</option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Tất cả hành động</option>
              {ACTION_OPTIONS.filter(Boolean).map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
              ))}
            </select>
            {(entityFilter || actionFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEntityFilter(''); setActionFilter(''); setPage(1) }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} padding>
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-navy-200" />}
          title="Chưa có nhật ký hoạt động"
          description="Các hoạt động trong hệ thống sẽ được ghi nhận tại đây"
        />
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} padding>
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <History className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {log.user?.fullName || 'Hệ thống'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      {log.entity && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {ENTITY_LABELS[log.entity] || log.entity}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    expandedId === log.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )
                  )}
                </div>

                {expandedId === log.id && log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-3 ml-11 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-500">
                Trang {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
