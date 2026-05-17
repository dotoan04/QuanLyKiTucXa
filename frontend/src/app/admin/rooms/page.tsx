'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, LayoutGrid, List, X, Users, Building2, Wrench, Search, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api'

interface Room {
  id: string
  roomNumber: string
  floor: number
  building: string
  status: string
  notes?: string
  /** CSVC trong phòng (API: thường string[]) */
  amenities?: unknown
  roomType?: {
    id: string
    name: string
    monthlyPrice: number
    capacity: number
  }
  contracts?: any[]
}

function amenitiesToCommaText(amenities: unknown): string {
  if (amenities == null) return ''
  if (Array.isArray(amenities)) {
    return amenities.filter((x): x is string => typeof x === 'string').join(', ')
  }
  return ''
}

const statusColorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  available: { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', dot: 'bg-success-500' },
  occupied: { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', dot: 'bg-primary-500' },
  maintenance: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  reserved: { bg: 'bg-navy-100', border: 'border-navy-200', text: 'text-navy-600', dot: 'bg-navy-400' },
  full: { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', dot: 'bg-danger-500' },
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: 1,
    building: 'A',
    roomTypeId: '',
    status: 'available',
    notes: '',
    amenitiesText: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, roomTypesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/rooms/room-types')
      ])
      setRooms(roomsRes.data.data || [])
      setRoomTypes(roomTypesRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const amenities = formData.amenitiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await api.post('/rooms', {
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        building: formData.building,
        roomTypeId: formData.roomTypeId,
        status: formData.status,
        notes: formData.notes,
        ...(amenities.length > 0 ? { amenities } : {})
      })
      await fetchData()
      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }

  const handleUpdate = async () => {
    try {
      const amenities = formData.amenitiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await api.put(`/rooms/${editingRoom!.id}`, {
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        building: formData.building,
        roomTypeId: formData.roomTypeId,
        status: formData.status,
        notes: formData.notes,
        amenities: amenities.length > 0 ? amenities : null
      })
      await fetchData()
      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to update room:', error)
    }
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return
    try {
      await api.delete(`/rooms/${roomId}`)
      await fetchData()
    } catch (error) {
      console.error('Failed to delete room:', error)
    }
  }

  const openCreateModal = () => {
    setEditingRoom(null)
    setFormData({ roomNumber: '', floor: 1, building: 'A', roomTypeId: '', status: 'available', notes: '', amenitiesText: '' })
    setModalOpen(true)
  }

  const openEditModal = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      building: room.building,
      roomTypeId: room.roomType?.id || '',
      status: room.status,
      notes: room.notes || '',
      amenitiesText: amenitiesToCommaText(room.amenities)
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setFormData({ roomNumber: '', floor: 1, building: 'A', roomTypeId: '', status: 'available', notes: '', amenitiesText: '' })
  }

  const buildings = ['A', 'B', 'C', 'D']
  const floors = Array.from({ length: 5 }, (_, i) => i + 1)
  const statuses = [
    { value: 'available', label: 'Còn trống' },
    { value: 'occupied', label: 'Đã thuê' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'reserved', label: 'Đã đặt' },
  ]

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !searchQuery ||
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.building.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBuilding = !filterBuilding || room.building === filterBuilding
    const matchesStatus = !filterStatus || room.status === filterStatus
    return matchesSearch && matchesBuilding && matchesStatus
  })

  const RoomCard = ({ room }: { room: Room }) => {
    const colors = statusColorMap[room.status] || statusColorMap.available
    const occupantCount = room.contracts?.filter(c => c.status === 'active').length || 0

    return (
      <div
        onClick={() => setSelectedRoom(room)}
        className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-card-hover group ${colors.bg} ${colors.border}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold font-sans text-navy-700">{room.roomNumber}</h3>
            <p className="text-xs text-navy-400 font-body">Tòa {room.building} · Tầng {room.floor}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-navy-500 font-body">
            <Users className="w-3.5 h-3.5" />
            <span>{occupantCount}/{room.roomType?.capacity || 0} người</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-500 font-body">
            <Building2 className="w-3.5 h-3.5" />
            <span>{room.roomType?.name || 'Chưa phân loại'}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-current/10">
          <StatusBadge status={room.status} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Quản lý phòng</h1>
          <p className="text-navy-400 mt-0.5 font-body">Quản lý và theo dõi tất cả phòng trong ký túc xá</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-surface-300 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-navy-600 text-white' : 'text-navy-400 hover:text-navy-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-navy-600 text-white' : 'text-navy-400 hover:text-navy-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Thêm phòng
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border font-medium font-sans transition-colors cursor-pointer ${
            showFilters ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-navy-600 border-surface-300 hover:border-surface-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-2xl border border-surface-200/60 shadow-card animate-slide-down">
          <div className="w-40">
            <label className="block text-xs font-semibold font-sans text-navy-600 mb-1.5">Tòa nhà</label>
            <Select
              value={filterBuilding}
              onChange={setFilterBuilding}
              options={[{ value: '', label: 'Tất cả' }, ...buildings.map(b => ({ value: b, label: `Tòa ${b}` }))]}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold font-sans text-navy-600 mb-1.5">Trạng thái</label>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[{ value: '', label: 'Tất cả' }, ...statuses]}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusColorMap).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
            <span className="text-xs text-navy-500 font-body">
              {status === 'available' ? 'Còn trống' : status === 'occupied' ? 'Đã thuê' : status === 'maintenance' ? 'Bảo trì' : status === 'reserved' ? 'Đã đặt' : 'Đầy'}
            </span>
          </div>
        ))}
      </div>

      {/* Room Grid / Table */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-40 bg-surface-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-navy-200" />
          </div>
          <h3 className="text-base font-semibold font-sans text-navy-500">Không tìm thấy phòng</h3>
          <p className="text-sm text-navy-400 font-body mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200/60 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Số phòng</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Tòa</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Tầng</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Loại phòng</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="table-row-hover" onClick={() => setSelectedRoom(room)}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold font-sans text-navy-700">{room.roomNumber}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-500 font-body">Tòa {room.building}</td>
                    <td className="px-5 py-3.5 text-sm text-navy-500 font-body">{room.floor}</td>
                    <td className="px-5 py-3.5 text-sm text-navy-500 font-body">{room.roomType?.name || '-'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={room.status} /></td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-navy-400 hover:text-navy-600 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer" onClick={() => openEditModal(room)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-navy-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer" onClick={() => handleDelete(room.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Cập nhật phòng' : 'Thêm phòng mới'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={editingRoom ? handleUpdate : handleCreate}>
              {editingRoom ? 'Cập nhật' : 'Tạo phòng'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Số phòng"
            required
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            placeholder="Ví dụ: A101"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Tòa nhà</label>
              <Select
                value={formData.building}
                onChange={(value) => setFormData({ ...formData, building: value })}
                options={buildings.map(b => ({ value: b, label: `Tòa ${b}` }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Tầng</label>
              <Select
                value={String(formData.floor)}
                onChange={(value) => setFormData({ ...formData, floor: parseInt(value) })}
                options={floors.map(f => ({ value: String(f), label: `Tầng ${f}` }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Loại phòng</label>
            <Select
              value={formData.roomTypeId}
              onChange={(value) => setFormData({ ...formData, roomTypeId: value })}
              options={roomTypes.map(rt => ({ value: rt.id, label: `${rt.name} - ${rt.monthlyPrice} đ/tháng` }))}
              placeholder="Chọn loại phòng"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Trạng thái</label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={statuses}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Cơ sở vật chất trong phòng</label>
            <textarea
              value={formData.amenitiesText}
              onChange={(e) => setFormData({ ...formData, amenitiesText: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
              rows={2}
              placeholder="Ví dụ: Giường, Tủ, Điều hòa — cách nhau bởi dấu phẩy"
            />
            <p className="text-xs text-navy-400 font-body mt-1">
              Dùng cho phiếu bàn giao khi tạo hợp đồng. Để trống thì hệ thống lấy theo loại phòng.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
              rows={3}
              placeholder="Thông tin thêm về phòng..."
            />
          </div>
        </div>
      </Modal>

      {/* Slide-in Detail Panel */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedRoom(null)}>
          <div className="absolute inset-0 bg-navy-900/20 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white shadow-elevated animate-slide-in-right overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-white">
              <h2 className="text-lg font-bold font-sans text-navy-700">Phòng {selectedRoom.roomNumber}</h2>
              <button onClick={() => setSelectedRoom(null)} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-surface-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColorMap[selectedRoom.status]?.bg}`}>
                    {selectedRoom.status === 'maintenance' ? (
                      <Wrench className={`w-6 h-6 ${statusColorMap[selectedRoom.status]?.text}`} />
                    ) : (
                      <Building2 className={`w-6 h-6 ${statusColorMap[selectedRoom.status]?.text}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold font-sans text-navy-700">Tòa {selectedRoom.building}</p>
                    <p className="text-sm text-navy-400 font-body">Tầng {selectedRoom.floor}</p>
                  </div>
                </div>
                <StatusBadge status={selectedRoom.status} size="md" />
              </div>

              {/* Room Type Info */}
              {selectedRoom.roomType && (
                <div className="p-4 bg-surface-50 rounded-xl border border-surface-200/60">
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-2">Loại phòng</p>
                  <p className="font-semibold font-sans text-navy-700">{selectedRoom.roomType.name}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-xs text-navy-400 font-body">Sức chứa</p>
                      <p className="text-sm font-semibold font-sans text-navy-600">{selectedRoom.roomType.capacity} người</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-400 font-body">Giá/tháng</p>
                      <p className="text-sm font-semibold font-sans text-navy-600">{selectedRoom.roomType.monthlyPrice?.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRoom.notes && (
                <div>
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-2">Ghi chú</p>
                  <p className="text-sm text-navy-600 font-body">{selectedRoom.notes}</p>
                </div>
              )}

              {/* Residents */}
              {selectedRoom.contracts && selectedRoom.contracts.length > 0 && (
                <div>
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-3">
                    Sinh viên ({selectedRoom.contracts.filter(c => c.status === 'active').length})
                  </p>
                  <div className="space-y-2">
                    {selectedRoom.contracts.filter(c => c.status === 'active').map((contract: any) => (
                      <div key={contract.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-sm font-bold font-sans text-primary-600">
                            {contract.student?.user?.fullName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium font-sans text-navy-700">{contract.student?.user?.fullName}</p>
                            <p className="text-xs text-navy-400 font-body">{contract.student?.studentCode}</p>
                          </div>
                        </div>
                        <StatusBadge status={contract.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { openEditModal(selectedRoom); setSelectedRoom(null) }}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => { handleDelete(selectedRoom.id); setSelectedRoom(null) }}>
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
