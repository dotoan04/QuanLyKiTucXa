'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCheck, Loader2, ChevronRight, Info, AlertTriangle, CreditCard, FileText, X } from 'lucide-react'
import api from '@/lib/api'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

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

interface NotificationDropdownProps {
  href?: string
}

export function NotificationDropdown({ href = '/notifications' }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fetchTimer = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const [recentRes, countRes] = await Promise.allSettled([
        api.get('/notifications/recent', { params: { limit: 8 } }),
        api.get('/notifications/unread-count'),
      ])
      if (recentRes.status === 'fulfilled') {
        setNotifications(recentRes.value.data.data || [])
      }
      if (countRes.status === 'fulfilled') {
        setUnreadCount(countRes.value.data.data?.count || 0)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll every 30s when dropdown is open
  useEffect(() => {
    if (open) {
      fetchTimer.current = setInterval(fetchNotifications, 30000)
    }
    return () => {
      if (fetchTimer.current) clearInterval(fetchTimer.current)
    }
  }, [open, fetchNotifications])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true)
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
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
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-navy-400 hover:text-navy-600 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-surface-200/60 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200/60 bg-surface-50">
            <h3 className="text-sm font-bold font-sans text-navy-700">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-navy-400 hover:text-navy-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-navy-300" />
                </div>
                <p className="text-sm text-navy-500">Không có thông báo</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Info
                  const bgClass = typeBg[notif.type] || 'bg-surface-100 text-navy-500'
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) handleMarkRead(notif.id)
                      }}
                      className={`px-4 py-3 hover:bg-surface-50 transition-colors cursor-pointer flex gap-3 ${
                        !notif.isRead ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgClass.split(' ')[0]}`}>
                        <Icon className={`w-4 h-4 ${bgClass.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-navy-800' : 'text-navy-600'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-navy-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-navy-300 mt-1">{formatTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-200/60">
            <a
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 py-3 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
            >
              Xem tất cả thông báo
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
