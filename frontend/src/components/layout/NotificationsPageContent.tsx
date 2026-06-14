'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Bell, Search, CheckCheck, Trash2, Loader2, Info, AlertTriangle, CreditCard, FileText } from 'lucide-react'
import api from '@/lib/api'
import { getNotificationHref } from '@/lib/notification-target'

const typeIcons: Record<string, any> = {
  system: Info,
  payment: CreditCard,
  incident: AlertTriangle,
  contract: FileText,
  room_approved: FileText,
}

const typeBg: Record<string, string> = {
  system: 'bg-primary-100 text-primary-600',
  payment: 'bg-warning-100 text-warning-600',
  incident: 'bg-danger-100 text-danger-600',
  contract: 'bg-navy-100 text-navy-600',
  room_approved: 'bg-success-100 text-success-600',
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  referenceType?: string | null
  referenceId?: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = { limit: '50' }
      if (filter === 'unread') params.isRead = 'false'
      if (filter === 'read') params.isRead = 'true'
      const res = await api.get('/notifications', { params })
      setNotifications(Array.isArray(res.data.data) ? res.data.data : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true)
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {
      // silent
    }
  }

  const handleClearRead = async () => {
    try {
      await api.delete('/notifications/clear-read')
      setNotifications(prev => prev.filter(n => !n.isRead))
    } catch {
      // silent
    }
  }

  const filtered = notifications.filter(n => {
    if (!search) return true
    return n.title?.toLowerCase().includes(search.toLowerCase()) ||
           n.message?.toLowerCase().includes(search.toLowerCase())
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffD = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    if (diffH < 24) return `${diffH} giờ trước`
    if (diffD < 7) return `${diffD} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-sans text-navy-700">Thông báo</h1>
        <p className="text-navy-400 mt-0.5 text-sm font-body">
          {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-white text-navy-700 shadow-sm'
                  : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Đọc tất cả
            </Button>
          )}
          {notifications.some(n => n.isRead) && (
            <Button variant="outline" size="sm" onClick={handleClearRead}>
              <Trash2 className="w-3.5 h-3.5" />
              Xóa đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-navy-200" />
            </div>
            <p className="text-sm font-semibold font-sans text-navy-500">
              {search ? 'Không tìm thấy thông báo' : 'Không có thông báo'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filtered.map((notif) => {
              const Icon = typeIcons[notif.type] || Info
              const bgClass = typeBg[notif.type] || 'bg-surface-100 text-navy-500'
              return (
                <div
                  key={notif.id}
                  className={`px-5 py-4 hover:bg-surface-50 transition-colors flex gap-4 group ${
                    !notif.isRead ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass.split(' ')[0]}`}>
                    <Icon className={`w-5 h-5 ${bgClass.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                    if (!notif.isRead) handleMarkRead(notif.id)
                    const href = getNotificationHref(notif, pathname)
                    if (href) router.push(href)
                  }}>
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                        )}
                        <h3 className={`text-sm truncate ${!notif.isRead ? 'font-bold text-navy-800' : 'font-semibold text-navy-600'}`}>
                          {notif.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-navy-400 font-body whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(notif.id) }}
                          className="p-1 text-navy-300 hover:text-danger-500 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-navy-500 font-body line-clamp-2 pl-4">{notif.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
