'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Clock, Calendar, Plus, MapPin } from 'lucide-react'
import api from '@/lib/api'

export default function StudentTemporaryLeave() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ leaveDate: '', returnDate: '', reason: '', contactPhone: '', emergencyContact: '' })
  const [submitting, setSubmitting] = useState(false)
  const [activeContractId, setActiveContractId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [leavesRes, contractRes] = await Promise.allSettled([
        api.get('/temporary-leave/my'),
        api.get('/students/my-contracts'),
      ])
      if (leavesRes.status === 'fulfilled') {
        setLeaves(leavesRes.value.data.data || [])
      }
      if (contractRes.status === 'fulfilled') {
        const contracts = contractRes.value.data.data || []
        const active = contracts.find((c: any) => c.status === 'active')
        setActiveContractId(active?.id || null)
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post('/temporary-leave', { contractId: activeContractId, ...form })
      setShowCreate(false)
      setForm({ leaveDate: '', returnDate: '', reason: '', contactPhone: '', emergencyContact: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/temporary-leave/${id}/cancel`)
      fetchData()
    } catch (error) {
      console.error('Failed to cancel:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        {[1, 2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tạm vắng</h1>
          <p className="text-gray-500 mt-1">Đăng ký và theo dõi các lần tạm vắng</p>
        </div>
        {activeContractId && (
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
            Đăng ký mới
          </Button>
        )}
      </div>

      {leaves.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-gray-300" />}
          title="Chưa có đăng ký tạm vắng"
          description="Bạn chưa đăng ký tạm vắng nào"
          action={activeContractId ? <Button onClick={() => setShowCreate(true)} size="sm">Đăng ký ngay</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const leaveDate = leave.leaveDate || leave.startDate
            const returnDate = leave.returnDate || leave.endDate
            const daysLeft = Math.ceil((new Date(returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return (
              <Card key={leave.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(leaveDate).toLocaleDateString('vi-VN')} — {new Date(returnDate).toLocaleDateString('vi-VN')}
                          </span>
                          <StatusBadge status={leave.status} size="sm" />
                        </div>
                        {leave.contactPhone && (
                          <p className="text-xs text-gray-500 mt-0.5">SĐT liên lạc: {leave.contactPhone}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-11">{leave.reason}</p>
                  </div>
                  {leave.status === 'approved' && daysLeft > 0 && (
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
                      <p className="text-lg font-bold text-blue-600">{daysLeft}</p>
                      <p className="text-[10px] text-blue-500 uppercase">ngày</p>
                    </div>
                  )}
                  {leave.status === 'pending' && (
                    <Button variant="secondary" size="sm" onClick={() => handleCancel(leave.id)}>Hủy</Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Đăng ký tạm vắng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!form.leaveDate || !form.returnDate || !form.reason}>Gửi đăng ký</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày đi *</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày về *</label>
              <input type="date" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do *</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none" rows={3} placeholder="Nhập lý do tạm vắng..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT liên lạc</label>
              <input className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="Số điện thoại..." value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT người thân (khẩn cấp)</label>
              <input className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="Số điện thoại..." value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}










