'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import api from '@/lib/api'
import {
  ArrowLeft, Save, CheckCircle2, Zap, Droplets, Home, User, Building2,
  FileText, Camera, Plus, Trash2, Printer, GripVertical
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface HandoverItem {
  name: string
  quantity: number
  condition: 'good' | 'fair' | 'poor'
  note?: string
}

interface HandoverData {
  id: string
  contractId: string
  items: HandoverItem[]
  handoverAt: string
  notes: string | null
  electricityInitial: number | null
  waterInitial: number | null
  electricityPhoto: string | null
  waterPhoto: string | null
  roomPhotos: string[]
  completedAt: string | null
  completedBy: string | null
  contract: {
    id: string
    startDate: string
    endDate: string | null
    monthlyRent: string
    depositAmount: string
    status: string
    student: {
      user: { id: string; fullName: string; email: string; phone: string }
      studentCode: string
      faculty: string | null
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
  completer: { id: string; fullName: string } | null
}

// ─────────────────────────────────────────────────────────
// Chuẩn hóa items từ API (legacy: mảng chuỗi; mới: { name, condition, quantity, note })
// ─────────────────────────────────────────────────────────
function mapConditionToStaff(c: string | undefined): HandoverItem['condition'] {
  const x = (c || 'good').toLowerCase()
  if (x === 'fair' || x === 'poor') return x
  if (x === 'normal') return 'fair'
  if (x === 'broken') return 'poor'
  return 'good'
}

function coerceHandoverItemsFromApi(raw: unknown): HandoverItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const el0 = raw[0]
  if (typeof el0 === 'string') {
    return (raw as string[])
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((name) => ({
        name: name.trim(),
        quantity: 1,
        condition: 'good' as HandoverItem['condition'],
        note: ''
      }))
  }
  if (el0 && typeof el0 === 'object' && typeof (el0 as { name?: unknown }).name === 'string') {
    return (raw as Record<string, unknown>[]).map((it) => {
      const name = typeof it.name === 'string' ? it.name : 'Hạng mục'
      const quantity = typeof it.quantity === 'number' && it.quantity >= 1 ? it.quantity : 1
      const condition = mapConditionToStaff(typeof it.condition === 'string' ? it.condition : 'good')
      const note = typeof it.note === 'string' ? it.note : ''
      return { name, quantity, condition, note }
    })
  }
  return []
}

// ─────────────────────────────────────────────────────────
// Condition config
// ─────────────────────────────────────────────────────────
const CONDITIONS = [
  { value: 'good', label: 'Tốt', short: 'T', style: 'bg-emerald-100 text-emerald-700 ring-emerald-400', dot: 'bg-emerald-500' },
  { value: 'fair', label: 'Bình thường', short: 'BT', style: 'bg-amber-100 text-amber-700 ring-amber-400', dot: 'bg-amber-500' },
  { value: 'poor', label: 'Kém / Hỏng', short: 'K', style: 'bg-red-100 text-red-600 ring-red-400', dot: 'bg-red-500' },
] as const

function ConditionBadge({ value, disabled, onChange }: {
  value: string
  disabled?: boolean
  onChange?: (v: string) => void
}) {
  const cfg = CONDITIONS.find(c => c.value === value) || CONDITIONS[0]
  if (disabled) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.style}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    )
  }
  return (
    <div className="flex gap-1">
      {CONDITIONS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange?.(c.value)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border-2 transition-all ${
            value === c.value
              ? `${c.style} ring-1 border-transparent`
              : 'border-gray-200 text-gray-400 hover:border-gray-300 bg-white'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────
export default function HandoverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.contractId as string

  const [handover, setHandover] = useState<HandoverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  const [items, setItems] = useState<HandoverItem[]>([])
  const [electricityInitial, setElectricityInitial] = useState('')
  const [waterInitial, setWaterInitial] = useState('')
  const [notes, setNotes] = useState('')
  const [electricityPhoto, setElectricityPhoto] = useState('')
  const [waterPhoto, setWaterPhoto] = useState('')

  const isCompleted = handover?.completedAt !== null

  useEffect(() => { fetchHandover() }, [contractId])

  const fetchHandover = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/contracts/${contractId}/handover`)
      const data = res.data.data
      setHandover(data)
      setItems(coerceHandoverItemsFromApi(data.items))
      if (data.electricityInitial !== null) setElectricityInitial(String(data.electricityInitial))
      if (data.waterInitial !== null) setWaterInitial(String(data.waterInitial))
      if (data.notes) setNotes(data.notes)
      if (data.electricityPhoto) setElectricityPhoto(data.electricityPhoto)
      if (data.waterPhoto) setWaterPhoto(data.waterPhoto)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Item mutators
  const updateItem = (idx: number, field: keyof HandoverItem, value: any) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const deleteItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }
  const addItem = () => {
    setItems(prev => [...prev, { name: 'Hạng mục mới', quantity: 1, condition: 'good', note: '' }])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/contracts/${contractId}/handover`, {
        items,
        electricityInitial: electricityInitial ? parseFloat(electricityInitial) : null,
        waterInitial: waterInitial ? parseFloat(waterInitial) : null,
        electricityPhoto: electricityPhoto || null,
        waterPhoto: waterPhoto || null,
        notes: notes || null
      })
      await fetchHandover()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm('Xác nhận hoàn tất bàn giao phòng?\nSau khi hoàn tất, bạn không thể chỉnh sửa.')) return
    try {
      setCompleting(true)
      await api.put(`/contracts/${contractId}/handover`, {
        items,
        electricityInitial: electricityInitial ? parseFloat(electricityInitial) : null,
        waterInitial: waterInitial ? parseFloat(waterInitial) : null,
        electricityPhoto: electricityPhoto || null,
        waterPhoto: waterPhoto || null,
        notes: notes || null
      })
      await api.post(`/contracts/${contractId}/handover/complete`)
      router.push(`/print/contract/${contractId}`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi hoàn tất bàn giao')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!handover) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chưa có bản ghi bàn giao cho hợp đồng này.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    )
  }

  const { contract } = handover

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">
            Biên bản bàn giao — Phòng {contract.room.roomNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tòa {contract.room.building}, Tầng {contract.room.floor} &middot; {contract.room.roomType.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && <StatusBadge status="completed" label="Đã hoàn tất" />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/print/contract/${contractId}`, '_blank')}
            disabled={!isCompleted}
            title={!isCompleted ? 'Cần hoàn tất bàn giao cơ sở vật chất trước khi in hợp đồng' : undefined}
          >
            <Printer className="h-4 w-4 mr-1" />
            {isCompleted ? 'In hợp đồng' : 'Chờ bàn giao'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-4">
          <Card padding>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sinh viên</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{contract.student.user.fullName}</p>
                  <p className="text-gray-500">{contract.student.studentCode}</p>
                </div>
              </div>
              {contract.student.faculty && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {contract.student.faculty}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <Home className="h-4 w-4 text-gray-400" />
                Phòng {contract.room.roomNumber} - Tòa {contract.room.building}
              </div>
              {contract.student.user.phone && (
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {contract.student.user.phone}
                </div>
              )}
            </div>
          </Card>

          <Card padding>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hợp đồng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày bắt đầu</span>
                <span className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
              </div>
              {contract.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Kết thúc</span>
                  <span className="font-medium">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền thuê</span>
                <span className="font-semibold text-blue-700">{Number(contract.monthlyRent).toLocaleString('vi-VN')}đ/th</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền cọc</span>
                <span className="font-medium">{Number(contract.depositAmount).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </Card>

          {/* Bàn giao meta */}
          {(handover.confirmer || handover.completer) && (
            <Card padding>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Xác nhận</h3>
              <div className="space-y-2 text-sm">
                {handover.confirmer && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ghi nhận</span>
                    <span>{handover.confirmer.fullName}</span>
                  </div>
                )}
                {handover.completer && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hoàn tất</span>
                    <span>{handover.completer.fullName}</span>
                  </div>
                )}
                {handover.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thời gian</span>
                    <span>{new Date(handover.completedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Main form area */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Chỉ số điện nước ── */}
          <Card padding>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Chỉ số điện nước ban đầu
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" /> Chỉ số điện (kWh)
                </label>
                <input
                  type="number" step="0.01"
                  value={electricityInitial}
                  onChange={e => setElectricityInitial(e.target.value)}
                  disabled={isCompleted}
                  placeholder="VD: 1234.56"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-500" /> Chỉ số nước (m³)
                </label>
                <input
                  type="number" step="0.01"
                  value={waterInitial}
                  onChange={e => setWaterInitial(e.target.value)}
                  disabled={isCompleted}
                  placeholder="VD: 456.78"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Link ảnh công tơ điện
                </label>
                <input
                  type="text"
                  value={electricityPhoto}
                  onChange={e => setElectricityPhoto(e.target.value)}
                  disabled={isCompleted}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Link ảnh đồng hồ nước
                </label>
                <input
                  type="text"
                  value={waterPhoto}
                  onChange={e => setWaterPhoto(e.target.value)}
                  disabled={isCompleted}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </Card>

          {/* ── Danh sách hạng mục ── */}
          <Card padding>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Kiểm tra cơ sở vật chất ({items.length} hạng mục)
              </h3>
              {!isCompleted && (
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm hạng mục
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 w-8">#</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Tên hạng mục</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-gray-500 w-20">SL</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 w-72">Tình trạng</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">Ghi chú</th>
                    {!isCompleted && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isCompleted ? 5 : 6}
                        className="py-10 px-4 text-center text-sm text-gray-500"
                      >
                        <p className="font-medium text-gray-700">Chưa có danh sách CSVC trên phiếu</p>
                        <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
                          Danh sách lấy từ <strong>CSVC theo phòng</strong> / <strong>loại phòng</strong> khi tạo hợp đồng.
                          Cập nhật tại Quản lý phòng hoặc Loại phòng rồi tạo hợp đồng mới; hoặc nhấn &quot;Thêm hạng mục&quot; để nhập tay.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 group hover:bg-gray-50/50">
                      <td className="py-2.5 px-2 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        {isCompleted ? (
                          <span className="text-gray-800">{item.name}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-transparent rounded focus:border-gray-300 focus:outline-none focus:bg-white text-gray-800 bg-transparent text-sm"
                            placeholder="Tên hạng mục"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {isCompleted ? (
                          <span className="text-gray-700">{item.quantity}</span>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-14 text-center px-1 py-1 border border-gray-200 rounded focus:outline-none focus:border-emerald-500 text-sm"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <ConditionBadge
                          value={item.condition}
                          disabled={isCompleted}
                          onChange={v => updateItem(idx, 'condition', v)}
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        {isCompleted ? (
                          <span className="text-gray-500 text-xs">{item.note || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.note || ''}
                            onChange={e => updateItem(idx, 'note', e.target.value)}
                            placeholder="Ghi chú thêm..."
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                          />
                        )}
                      </td>
                      {!isCompleted && (
                        <td className="py-2.5 px-2">
                          <button
                            type="button"
                            onClick={() => deleteItem(idx)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                            title="Xóa hạng mục"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
              {(['good', 'fair', 'poor'] as const).map(c => {
                const cfg = CONDITIONS.find(x => x.value === c)!
                const count = items.filter(i => i.condition === c).length
                return count > 0 ? (
                  <span key={c} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {count} {cfg.label.toLowerCase()}
                  </span>
                ) : null
              })}
            </div>
          </Card>

          {/* ── Ghi chú chung ── */}
          <Card padding>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ghi chú chung</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isCompleted}
              rows={3}
              placeholder="Nhận xét tổng quan về tình trạng phòng, CSVC, dặn dò sinh viên..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />
          </Card>

          {/* ── Actions ── */}
          {!isCompleted ? (
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu nháp'}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing || !electricityInitial || !waterInitial}
                title={!electricityInitial || !waterInitial ? 'Cần điền đủ chỉ số điện và nước' : ''}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {completing ? 'Đang xử lý...' : 'Hoàn tất bàn giao'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Bàn giao đã hoàn tất</p>
                  <p className="text-xs text-emerald-600">
                    {new Date(handover.completedAt!).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/print/contract/${contractId}`, '_blank')}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <Printer className="h-4 w-4 mr-1" />
                In hợp đồng
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
