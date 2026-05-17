'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowRightLeft, Building2, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeAvailableRooms(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    const data = value as { rooms?: unknown; buildings?: unknown }
    if (Array.isArray(data.rooms)) return data.rooms
    if (Array.isArray(data.buildings)) {
      return data.buildings.flatMap((building: any) =>
        asArray<any>(building?.floors).flatMap((floor: any) => asArray<any>(floor?.rooms))
      )
    }
  }
  return []
}

export default function StudentTransfer() {
  const [contract, setContract] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [contractRes, roomsRes] = await Promise.allSettled([
        api.get('/students/my-contracts'),
        api.get('/rooms/available')
      ])
      const contracts = contractRes.status === 'fulfilled' ? asArray<any>(contractRes.value.data.data) : []
      const activeContract = contracts.find((c: any) => c.status === 'active')
      setContract(activeContract || null)
      setRooms(roomsRes.status === 'fulfilled' ? normalizeAvailableRooms(roomsRes.value.data.data) : [])
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildings = [...new Set(rooms.map((r: any) => r.building))]
  const filteredRooms = selectedBuilding ? rooms.filter((r: any) => r.building === selectedBuilding) : []

  const handleSubmit = async () => {
    if (!selectedRoom || !reason) return
    setSubmitting(true)
    try {
      await api.post('/transfers', {
        contractId: contract.id,
        toRoomId: selectedRoom,
        reason
      })
      setSuccess(true)
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chuyển phòng</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Yêu cầu đã được gửi!</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Yêu cầu chuyển phòng của bạn đã được gửi thành công. Nhân viên sẽ xem xét và phản hồi sớm.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chuyển phòng</h1>
        <p className="text-gray-500 mt-1">Yêu cầu chuyển sang phòng khác</p>
      </div>

      {!contract ? (
        <EmptyState
          icon={<ArrowRightLeft className="w-8 h-8 text-gray-300" />}
          title="Không có hợp đồng hoạt động"
          description="Bạn cần có hợp đồng đang hoạt động để yêu cầu chuyển phòng"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Current room */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 border-b border-gray-100 bg-blue-50/50 rounded-t-2xl">
                <p className="text-sm font-semibold text-blue-900">Phòng hiện tại</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-center py-3">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                    <Building2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{contract.room?.roomNumber}</p>
                  <p className="text-sm text-gray-500">Tòa {contract.room?.building} - Tầng {contract.room?.floor}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* New room selection */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 border-b border-gray-100 bg-emerald-50/50 rounded-t-2xl">
                <p className="text-sm font-semibold text-emerald-900">Phòng muốn chuyển</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tòa nhà</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={selectedBuilding}
                    onChange={(e) => { setSelectedBuilding(e.target.value); setSelectedRoom('') }}
                  >
                    <option value="">-- Chọn tòa --</option>
                    {buildings.map((b: any) => <option key={b} value={b}>Tòa {b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    disabled={!selectedBuilding}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {filteredRooms.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomNumber} ({r.currentOccupancy}/{r.roomType?.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Reason and Submit */}
          <div className="lg:col-span-5">
            <Card className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do chuyển phòng *</label>
                  <textarea
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Nhập lý do bạn muốn chuyển phòng..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700">⚠️ Phí chuyển phòng có thể được áp dụng. Vui lòng liên hệ nhân viên để biết thêm chi tiết.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} loading={submitting} disabled={!selectedRoom || !reason}>
                    Gửi yêu cầu chuyển phòng
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
