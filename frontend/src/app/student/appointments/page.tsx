'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import {
  CalendarDays,
  Loader2,
  MapPin,
  DoorOpen,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ArrowLeft
} from 'lucide-react'

interface MyAppointmentRow {
  itemId: string
  itemStatus: 'pending' | 'attended' | 'absent'
  registrationId: string
  appointment: {
    id: string
    scheduledAt: string
    status: 'scheduled' | 'completed' | 'cancelled'
    location: string | null
    notes: string | null
    room: { id: string; roomNumber: string; building: string; floor: number } | null
  }
  registration: {
    id: string
    status: string
    assignedRoom: { id: string; roomNumber: string; building: string; floor: number } | null
    preferredRoomType: { id: string; name: string }
  }
}

const aptStatusLabel: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Đã xếp lịch', className: 'bg-primary-100 text-primary-800' },
  completed: { label: 'Đã hoàn thành', className: 'bg-success-100 text-success-800' },
  cancelled: { label: 'Đã hủy', className: 'bg-surface-200 text-navy-600' }
}

const itemStatusLabel: Record<string, string> = {
  pending: 'Chờ đến',
  attended: 'Đã tham gia',
  absent: 'Vắng mặt'
}

export default function StudentAppointmentsPage() {
  const [rows, setRows] = useState<MyAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/appointments/my')
        if (!cancelled) setRows(res.data.data || [])
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/student/registrations"
          className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-primary-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Đơn đăng ký
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold font-sans text-navy-800 flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary-600" />
          Lịch hẹn xem phòng
        </h1>
        <p className="text-navy-500 text-sm mt-1 font-body">
          Thời gian và địa điểm do quản lý KTX xếp sau khi bạn đã nộp / được xác nhận cọc.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center border border-surface-200">
          <CalendarDays className="w-12 h-12 text-navy-200 mx-auto mb-3" />
          <p className="text-navy-600 font-medium">Chưa có lịch hẹn nào</p>
          <p className="text-sm text-navy-400 mt-2 max-w-md mx-auto font-body">
            Khi đơn của bạn ở bước chờ xác nhận cọc hoặc cọc đã xác nhận, quản lý có thể xếp bạn vào một buổi xem phòng.
            Bạn sẽ thấy lịch tại đây và nhận thông báo trên hệ thống.
          </p>
          <Link
            href="/student/registrations"
            className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <ClipboardList className="w-4 h-4" />
            Theo dõi đơn đăng ký
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const apt = row.appointment
            const st = aptStatusLabel[apt.status] || aptStatusLabel.scheduled
            const when = new Date(apt.scheduledAt).toLocaleString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            return (
              <Card
                key={row.itemId}
                className={`p-5 border border-surface-200/80 ${apt.status === 'cancelled' ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-navy-800">
                    <Clock className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="font-semibold font-sans capitalize">{when}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.className}`}>{st.label}</span>
                </div>

                <div className="space-y-2 text-sm text-navy-600 font-body">
                  {apt.location && (
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
                      <span>{apt.location}</span>
                    </div>
                  )}
                  {apt.room && (
                    <div className="flex gap-2">
                      <DoorOpen className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Phòng xem: {apt.room.roomNumber} — Tòa {apt.room.building}, tầng {apt.room.floor}
                      </span>
                    </div>
                  )}
                  {row.registration.assignedRoom && !apt.room && (
                    <div className="flex gap-2">
                      <DoorOpen className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Phòng được gán (đơn): {row.registration.assignedRoom.roomNumber} — Tòa{' '}
                        {row.registration.assignedRoom.building}, tầng {row.registration.assignedRoom.floor}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <ClipboardList className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
                    <span>Loại phòng đăng ký: {row.registration.preferredRoomType.name}</span>
                  </div>
                  {apt.notes && (
                    <p className="pl-6 text-navy-500 border-l-2 border-primary-200 mt-2">{apt.notes}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-surface-100 flex flex-wrap items-center gap-3 text-xs text-navy-500">
                  <span className="inline-flex items-center gap-1">
                    {row.itemStatus === 'attended' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />
                    ) : row.itemStatus === 'absent' ? (
                      <XCircle className="w-3.5 h-3.5 text-danger-500" />
                    ) : apt.status === 'cancelled' ? (
                      <Ban className="w-3.5 h-3.5 text-navy-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                    )}
                    Trạng thái của bạn: <strong className="text-navy-700">{itemStatusLabel[row.itemStatus]}</strong>
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
