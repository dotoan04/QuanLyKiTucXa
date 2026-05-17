'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { LayoutList, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

interface RoomType {
  id: string
  name: string
  capacity: number
  monthlyPrice: string
  genderRestriction: string
  description: string
  amenities: string[]
  roomCount?: number
}

const GENDER_RESTRICTION_LABELS: Record<string, string> = {
  mixed: 'Khác / đặc biệt (chỉ SV chọn giới tính "Khác")',
  male_only: 'Nam (chỉ SV nam đăng ký)',
  female_only: 'Nữ (chỉ SV nữ đăng ký)',
}

const formatThousands = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const emptyForm = {
  name: '',
  capacity: 2,
  monthlyPrice: '1500000',
  genderRestriction: 'male_only',
  description: '',
  amenitiesText: '', // comma-separated input
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rooms/room-types', { params: { limit: 100 } })
      setRoomTypes(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch room types:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingRoomType(null)
    setFormData(emptyForm)
    setErrorMsg('')
    setModalOpen(true)
  }

  const openEditModal = (rt: RoomType) => {
    setEditingRoomType(rt)
    setFormData({
      name: rt.name,
      capacity: rt.capacity,
      monthlyPrice: String(Number(rt.monthlyPrice)),
      genderRestriction: rt.genderRestriction || 'male_only',
      description: rt.description || '',
      amenitiesText: (rt.amenities || []).join(', '),
    })
    setErrorMsg('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setErrorMsg('')
    if (!formData.name.trim()) { setErrorMsg('Vui lòng nhập tên loại phòng'); return }
    if (formData.capacity < 1) { setErrorMsg('Sức chứa phải ít nhất 1 người'); return }
    const monthlyPriceNumber = Number(formData.monthlyPrice || 0)
    if (monthlyPriceNumber < 0) { setErrorMsg('Giá thuê không hợp lệ'); return }

    const payload = {
      name: formData.name.trim(),
      capacity: Number(formData.capacity),
      monthlyPrice: monthlyPriceNumber,
      genderRestriction: formData.genderRestriction,
      description: formData.description.trim(),
      amenities: formData.amenitiesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }

    setSaving(true)
    try {
      if (editingRoomType) {
        await api.put(`/rooms/room-types/${editingRoomType.id}`, payload)
      } else {
        await api.post('/rooms/room-types', payload)
      }
      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rt: RoomType) => {
    const roomCount = rt.roomCount ?? 0
    if (roomCount > 0) {
      alert(`Không thể xóa loại phòng "${rt.name}" vì có ${roomCount} phòng đang dùng loại này.`)
      return
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa loại phòng "${rt.name}"?`)) return
    try {
      await api.delete(`/rooms/room-types/${rt.id}`)
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi xóa loại phòng.')
    }
  }

  const genderOptions = [
    { value: 'male_only', label: 'Nam — chỉ sinh viên nam được đăng ký / chọn phòng' },
    { value: 'female_only', label: 'Nữ — chỉ sinh viên nữ được đăng ký / chọn phòng' },
    { value: 'mixed', label: 'Khác / đặc biệt — chỉ SV chọn giới tính "Khác" (không dùng cho nam/nữ thông thường)' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý loại phòng</h1>
          <p className="text-gray-600 mt-1">Thêm, sửa, xóa các loại phòng trong ký túc xá</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm loại phòng
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : roomTypes.length === 0 ? (
        <Card className="text-center py-12">
          <LayoutList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có loại phòng nào. Nhấn "Thêm loại phòng" để bắt đầu.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roomTypes.map((rt) => (
            <Card key={rt.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-base">{rt.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{GENDER_RESTRICTION_LABELS[rt.genderRestriction] || rt.genderRestriction}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(rt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(rt)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>
                  <span className="font-medium">{rt.capacity}</span> người/phòng
                </span>
                <span className="text-primary-600 font-semibold">
                  {Number(rt.monthlyPrice).toLocaleString('vi-VN')}đ/tháng
                </span>
              </div>

              {rt.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{rt.description}</p>
              )}

              {rt.amenities && rt.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {rt.amenities.map((a, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {rt.roomCount !== undefined && (
                <p className="text-xs text-gray-400 mt-auto pt-2 border-t">
                  Số phòng đang dùng loại này: <strong>{rt.roomCount}</strong>
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoomType ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên loại phòng *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Phòng Tiêu Chuẩn 2 Người"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa (người) *</label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê/tháng (VND) *</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(formData.monthlyPrice)}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng sử dụng</label>
            <Select
              value={formData.genderRestriction}
              onChange={(val) => setFormData({ ...formData, genderRestriction: val })}
              options={genderOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Mô tả ngắn về loại phòng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiện nghi <span className="font-normal text-gray-400">(cách nhau bằng dấu phẩy)</span>
            </label>
            <input
              type="text"
              value={formData.amenitiesText}
              onChange={(e) => setFormData({ ...formData, amenitiesText: e.target.value })}
              placeholder="VD: Giường, Bàn học, Tủ quần áo, Điều hòa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editingRoomType ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
