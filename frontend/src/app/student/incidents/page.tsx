'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Wrench, Plus, Clock, AlertCircle, MessageSquare } from 'lucide-react'
import api from '@/lib/api'

export default function StudentIncidents() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'electrical', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const [myRoomId, setMyRoomId] = useState<string | null>(null)

  useEffect(() => { fetchIncidents() }, [])

  const fetchIncidents = async () => {
    try {
      const [incRes, roomRes] = await Promise.allSettled([
        api.get('/incidents/my-incidents'),
        api.get('/rooms/my-room'),
      ])
      if (incRes.status === 'fulfilled') {
        const data = incRes.value.data.data || { reported: [], assigned: [] }
        setIncidents(data.reported || [])
      }
      if (roomRes.status === 'fulfilled') {
        const room = roomRes.value.data.data
        setMyRoomId(room?.id ?? null)
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!myRoomId) return
    setSubmitting(true)
    try {
      await api.post('/incidents', { ...form, roomId: myRoomId })
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'electrical', priority: 'medium' })
      fetchIncidents()
    } catch (error) {
      console.error('Failed to create:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  const priorityLabels: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', urgent: 'Khẩn cấp' }
  /** Khớp enum Prisma IncidentCategory */
  const categoryLabels: Record<string, string> = {
    electrical: 'Điện',
    plumbing: 'Nước',
    furniture: 'Nội thất',
    network: 'Mạng',
    security: 'An ninh',
    other: 'Khác',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sự cố của tôi</h1>
          <p className="text-gray-500 mt-1">Báo cáo và theo dõi sự cố phòng ở</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          icon={<Plus className="w-4 h-4" />}
          disabled={!myRoomId}
          title={!myRoomId ? 'Cần hợp đồng đang hiệu lực và đã được xếp phòng' : undefined}
        >
          Báo sự cố
        </Button>
      </div>

      {!myRoomId && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bạn cần có hợp đồng đang hiệu lực và đã được xếp phòng mới có thể báo sự cố. Nếu vừa ký hợp đồng, hãy tải lại trang sau vài phút.
        </p>
      )}

      {incidents.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8 text-gray-300" />}
          title="Không có sự cố"
          description="Bạn chưa báo cáo sự cố nào"
          action={
            <Button onClick={() => setShowCreate(true)} size="sm" disabled={!myRoomId}>
              Báo sự cố mới
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{inc.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityColors[inc.priority] || priorityColors.medium}`}>
                      {priorityLabels[inc.priority] || inc.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{inc.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inc.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {categoryLabels[inc.category] || inc.category}
                    </span>
                  </div>
                </div>
                <StatusBadge status={inc.status} />
              </div>
              {inc.resolvedNote && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Phản hồi</span>
                  </div>
                  <p className="text-sm text-emerald-800">{inc.resolvedNote}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Báo cáo sự cố mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting}>Gửi báo cáo</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề *</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              placeholder="Mô tả ngắn gọn sự cố..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại sự cố</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức độ</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết *</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
              rows={4}
              placeholder="Mô tả chi tiết sự cố..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
