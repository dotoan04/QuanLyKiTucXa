'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Bell, Plus, Search, CheckCircle2, Info, AlertTriangle, Send } from 'lucide-react'
import api from '@/lib/api'

const typeConfig: Record<string, { icon: any; bg: string; text: string }> = {
  system: { icon: Info, bg: 'bg-primary-100', text: 'text-primary-600' },
  payment: { icon: AlertTriangle, bg: 'bg-warning-100', text: 'text-warning-600' },
  incident: { icon: CheckCircle2, bg: 'bg-success-100', text: 'text-success-600' },
  contract: { icon: Bell, bg: 'bg-navy-100', text: 'text-navy-600' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'system',
    targetAudience: 'all', // all, building, specific
    targetBuilding: '',
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications', { params: { limit: 50 } })
      const raw = res.data.data
      setNotifications(Array.isArray(raw) ? raw : [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    try {
      setCreating(true)

      const payload: Record<string, string> = {
        title: formData.title,
        message: formData.content,
        type: formData.type,
      }

      if (formData.targetAudience === 'all') {
        payload.targetType = 'all'
      } else if (formData.targetAudience === 'building' && formData.targetBuilding) {
        payload.targetType = 'building'
        payload.targetBuilding = formData.targetBuilding
      }

      await api.post('/notifications/broadcast', payload)

      setCreateModalOpen(false)
      setFormData({ title: '', content: '', type: 'system', targetAudience: 'all', targetBuilding: '' })
      fetchNotifications()
    } catch (err: any) {
      console.error('Failed to create notification:', err)
    } finally {
      setCreating(false)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (!search) return true
    return n.title?.toLowerCase().includes(search.toLowerCase()) || 
           n.content?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Thông báo</h1>
          <p className="text-navy-400 mt-0.5 font-body">Quản lý và gửi thông báo đến sinh viên</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tạo thông báo mới
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-surface-200/60 flex flex-wrap gap-3 bg-surface-50 rounded-t-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thông báo..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-navy-200" />
            </div>
            <p className="text-sm font-semibold font-sans text-navy-500">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredNotifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.system
              const Icon = config.icon
              return (
                <div key={notif.id} className="p-5 hover:bg-surface-50 transition-colors flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-sm font-bold font-sans text-navy-700 truncate">{notif.title}</h3>
                      <span className="text-xs text-navy-400 font-body shrink-0 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-navy-600 font-body line-clamp-2">{notif.content}</p>
                    {notif.read && (
                      <span className="inline-block mt-2 text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded-md">
                        Đã xem
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo thông báo mới"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={creating}>Hủy</Button>
            <Button onClick={handleCreate} loading={creating}>
              <Send className="w-4 h-4" /> Gửi thông báo
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Tiêu đề"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nhập tiêu đề thông báo..."
          />

          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Loại thông báo</label>
            <Select
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v })}
              options={[
                { value: 'system', label: 'Hệ thống chung' },
                { value: 'payment', label: 'Nhắc nhở thanh toán' },
                { value: 'incident', label: 'Cập nhật sự cố' },
                { value: 'contract', label: 'Hợp đồng' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Đối tượng nhận</label>
            <Select
              value={formData.targetAudience}
              onChange={(v) => setFormData({ ...formData, targetAudience: v })}
              options={[
                { value: 'all', label: 'Tất cả sinh viên' },
                { value: 'building', label: 'Theo tòa nhà' },
              ]}
            />
          </div>

          {formData.targetAudience === 'building' && (
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Chọn tòa nhà</label>
              <Select
                value={formData.targetBuilding}
                onChange={(v) => setFormData({ ...formData, targetBuilding: v })}
                options={[
                  { value: 'A', label: 'Tòa A' },
                  { value: 'B', label: 'Tòa B' },
                  { value: 'C', label: 'Tòa C' },
                  { value: 'D', label: 'Tòa D' },
                ]}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Nội dung <span className="text-danger-500">*</span></label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
              placeholder="Nhập nội dung chi tiết..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
