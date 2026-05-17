'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { Search, ClipboardCheck, ChevronRight, Eye, Zap, Droplets } from 'lucide-react'

interface PendingHandover {
  id: string
  contractId: string
  items: Array<{ name: string; condition: string; note?: string }>
  handoverAt: string
  notes: string | null
  electricityInitial: number | null
  waterInitial: number | null
  completedAt: string | null
  contract: {
    id: string
    student: {
      user: { id: string; fullName: string; email: string; phone: string }
      studentCode: string
    }
    room: {
      id: string
      roomNumber: string
      building: string
      floor: number
      roomType: { id: string; name: string; capacity: number }
    }
  }
  confirmer: { id: string; fullName: string } | null
}

export default function HandoverPage() {
  const router = useRouter()
  const [handovers, setHandovers] = useState<PendingHandover[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const fetchHandovers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/contracts/handover/pending', {
        params: { page, limit, search: searchQuery || undefined }
      })
      setHandovers(res.data.data)
      setTotal(res.data.meta?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHandovers()
  }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchHandovers()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bàn giao phòng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý bàn giao CSVC và ký hợp đồng</p>
        </div>
      </div>

      <Card padding>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, MSSV, số phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            {total} kết quả
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding>
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : handovers.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-8 h-8 text-navy-200" />}
          title="Không có bàn giao chờ xử lý"
          description="Tất cả bàn giao đã được hoàn tất"
        />
      ) : (
        <div className="space-y-3">
          {handovers.map((h) => (
            <Card key={h.id} padding hover>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      {h.contract.student.user.fullName}
                    </span>
                    <span className="text-xs text-gray-400">({h.contract.student.studentCode})</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Phòng {h.contract.room.roomNumber} - Tòa {h.contract.room.building} | {h.contract.room.roomType.name}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {h.electricityInitial !== null ? `${h.electricityInitial} kWh` : 'Chưa ghi'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {h.waterInitial !== null ? `${h.waterInitial} m³` : 'Chưa ghi'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/staff/handover/${h.contractId}`)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

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
        </div>
      )}
    </div>
  )
}
