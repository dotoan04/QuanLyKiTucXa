'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Building2, Search, Plus, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

interface RoomType {
  id: string
  name: string
  capacity: number
  monthlyPrice: string
  genderRestriction: string
}

const RT_GENDER_SHORT: Record<string, string> = {
  male_only: 'Nam',
  female_only: 'Nữ',
  mixed: 'Khác',
}

export default function StaffRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Create room modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    building: 'A',
    floor: 1,
    roomTypeId: '',
    notes: '',
  })

  useEffect(() => {
    fetchRooms()
  }, [page, search, statusFilter])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/rooms', { params })
      const raw = res.data.data
      setRooms(Array.isArray(raw) ? raw : [])
      setTotal(res.data.meta?.total || 0)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get('/rooms/room-types', { params: { limit: 100 } })
      const raw = res.data.data
      setRoomTypes(Array.isArray(raw) ? raw : [])
    } catch {
      console.error('Failed to fetch room types')
    }
  }

  const openCreateModal = async () => {
    setCreateError('')
    setNewRoom({ roomNumber: '', building: 'A', floor: 1, roomTypeId: '', notes: '' })
    if (roomTypes.length === 0) await fetchRoomTypes()
    setCreateModalOpen(true)
  }

  const handleCreateRoom = async () => {
    if (!newRoom.roomNumber.trim() || !newRoom.roomTypeId) {
      setCreateError('Vui lòng điền đầy đủ số phòng và loại phòng.')
      return
    }
    setCreateLoading(true)
    setCreateError('')
    try {
      await api.post('/rooms', {
        roomNumber: newRoom.roomNumber.trim(),
        building: newRoom.building,
        floor: parseInt(String(newRoom.floor)),
        roomTypeId: newRoom.roomTypeId,
        status: 'available',
        notes: newRoom.notes || undefined,
      })
      setCreateModalOpen(false)
      await fetchRooms()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Tạo phòng thất bại.'
      setCreateError(msg)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdateStatus = async (roomId: string, status: string) => {
    try {
      await api.put(`/rooms/${roomId}`, { status })
      await fetchRooms()
      setSelectedRoom(null)
    } catch (error) {
      console.error('Failed to update room status:', error)
    }
  }

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'available', label: 'Còn trống' },
    { value: 'occupied', label: 'Đã thuê' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'reserved', label: 'Đã đặt' },
  ]

  const statusActions = [
    { value: 'available', label: 'Còn trống' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'reserved', label: 'Đã đặt' },
  ]

  const buildings = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phòng</h1>
          <p className="text-gray-600 mt-1">Xem, thêm và cập nhật trạng thái phòng</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm phòng
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm số phòng, tòa..."
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
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600">Không tìm thấy phòng nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Số phòng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tòa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tầng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Loại phòng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{room.roomNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{room.building}</td>
                      <td className="px-4 py-3 text-gray-600">{room.floor}</td>
                      <td className="px-4 py-3 text-gray-600">{room.roomType?.name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedRoom(room)}>
                          Chi tiết
                        </Button>
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

      {/* Room detail modal */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Phòng ${selectedRoom.roomNumber}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
                <p className="text-gray-900">{selectedRoom.building}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tầng</label>
                <p className="text-gray-900">{selectedRoom.floor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại phòng</label>
                <p className="text-gray-900">
                  {selectedRoom.roomType?.name || '-'}
                  {selectedRoom.roomType?.genderRestriction != null && (
                    <span className="block text-xs text-blue-700 mt-0.5">
                      Giới tính: {RT_GENDER_SHORT[selectedRoom.roomType.genderRestriction] || selectedRoom.roomType.genderRestriction}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
                <p className="text-gray-900">{selectedRoom.roomType?.capacity || '-'} người</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hiện tại</label>
              <StatusBadge status={selectedRoom.status} />
            </div>
            {selectedRoom.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRoom.notes}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái</label>
              <div className="flex flex-wrap gap-2">
                {statusActions.map((s) => (
                  <Button
                    key={s.value}
                    variant={selectedRoom.status === s.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedRoom.id, s.value)}
                    disabled={selectedRoom.status === s.value}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Room Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm phòng mới"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={createLoading}>Hủy</Button>
            <Button onClick={handleCreateRoom} loading={createLoading}>Tạo phòng</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Số phòng *</label>
              <input
                type="text"
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom(prev => ({ ...prev, roomNumber: e.target.value }))}
                placeholder="VD: A101"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tòa nhà *</label>
              <select
                value={newRoom.building}
                onChange={(e) => setNewRoom(prev => ({ ...prev, building: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {buildings.map(b => <option key={b} value={b}>Tòa {b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tầng *</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newRoom.floor}
                onChange={(e) => setNewRoom(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Loại phòng *</label>
              <select
                value={newRoom.roomTypeId}
                onChange={(e) => setNewRoom(prev => ({ ...prev, roomTypeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn loại phòng --</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} — {RT_GENDER_SHORT[rt.genderRestriction] || '?'} — {rt.capacity} người — {parseInt(rt.monthlyPrice).toLocaleString('vi-VN')}đ
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={newRoom.notes}
              onChange={(e) => setNewRoom(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Ghi chú (tùy chọn)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {createError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {createError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
