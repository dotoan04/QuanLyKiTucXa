'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Wrench, Search, X, MessageSquare, AlertTriangle, Clock, CheckCircle2, LayoutList, Columns3 } from 'lucide-react'
import api from '@/lib/api'

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: 'Khẩn cấp', bg: 'bg-danger-100', text: 'text-danger-700' },
  high: { label: 'Cao', bg: 'bg-warning-100', text: 'text-warning-700' },
  medium: { label: 'Trung bình', bg: 'bg-primary-100', text: 'text-primary-700' },
  low: { label: 'Thấp', bg: 'bg-surface-100', text: 'text-navy-500' },
}

const categoryLabel: Record<string, string> = {
  electrical: 'Điện',
  plumbing: 'Nước',
  furniture: 'Nội thất',
  network: 'Mạng',
  security: 'An ninh',
  other: 'Khác',
  internet: 'Mạng',
  air_conditioning: 'Máy lạnh',
}

const kanbanColumns = [
  { key: 'pending', label: 'Mới', color: 'border-t-warning-400', icon: Clock, bg: 'bg-warning-50' },
  { key: 'in_progress', label: 'Đang xử lý', color: 'border-t-primary-400', icon: Wrench, bg: 'bg-primary-50' },
  { key: 'resolved', label: 'Đã giải quyết', color: 'border-t-success-400', icon: CheckCircle2, bg: 'bg-success-50' },
]

export default function StaffIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')

  useEffect(() => { fetchIncidents() }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const res = await api.get('/incidents', { params: { limit: 100 } })
      const raw = res.data.data
      setIncidents(Array.isArray(raw) ? raw : [])
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const body: any = { status }
      if (status === 'resolved' && resolutionNote) body.resolutionNote = resolutionNote
      await api.put(`/incidents/${id}`, body)
      await fetchIncidents()
      setSelectedIncident(null)
      setResolutionNote('')
    } catch (error) {
      console.error('Failed to update incident:', error)
    } finally {
      setUpdating(false)
    }
  }

  const filteredIncidents = incidents.filter(inc => {
    if (!search) return true
    const q = search.toLowerCase()
    return inc.title?.toLowerCase().includes(q) || inc.room?.roomNumber?.toLowerCase().includes(q)
  })

  const getIncidentsByStatus = (status: string) =>
    filteredIncidents.filter(i => i.status === status || (status === 'pending' && i.status === 'assigned'))

  const IncidentCard = ({ incident }: { incident: any }) => {
    const priority = priorityConfig[incident.priority] || priorityConfig.medium
    return (
      <div
        onClick={() => { setSelectedIncident(incident); setResolutionNote(incident.resolutionNote || '') }}
        className="p-4 bg-white rounded-xl border border-surface-200/60 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold font-sans text-navy-700 line-clamp-2 group-hover:text-primary-600 transition-colors">{incident.title}</h4>
          <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-navy-400 font-body">
          <span>Phòng {incident.room?.roomNumber || '-'}</span>
          <span className="w-1 h-1 rounded-full bg-surface-300" />
          <span>{categoryLabel[incident.category] || incident.category || 'Khác'}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-100">
          <span className="text-xs text-navy-400 font-body">
            {incident.reporter?.user?.fullName || 'Unknown'}
          </span>
          <span className="text-xs text-navy-400 font-body">
            {new Date(incident.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    )
  }

  const inputClasses = 'w-full px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Quản lý sự cố</h1>
          <p className="text-navy-400 mt-0.5 font-body">Theo dõi và xử lý sự cố ký túc xá</p>
        </div>
        <div className="flex items-center bg-white border border-surface-300 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'kanban' ? 'bg-navy-600 text-white' : 'text-navy-400 hover:text-navy-600'}`}
          >
            <Columns3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-navy-600 text-white' : 'text-navy-400 hover:text-navy-600'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề, phòng..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-navy-600 border-t-transparent" />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-navy-200" />
          </div>
          <p className="text-sm font-semibold font-sans text-navy-500">Không có sự cố nào</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board */
        <div className="grid gap-6 md:grid-cols-3">
          {kanbanColumns.map((col) => {
            const items = getIncidentsByStatus(col.key)
            return (
              <div key={col.key}>
                <div className={`flex items-center gap-2 mb-3 pb-2 border-t-2 ${col.color}`}>
                  <col.icon className="w-4 h-4 text-navy-400" />
                  <h3 className="text-sm font-bold font-sans text-navy-700">{col.label}</h3>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold font-sans ${col.bg} text-navy-600`}>
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-navy-400 font-body">Không có sự cố</div>
                  ) : (
                    items.map((inc) => <IncidentCard key={inc.id} incident={inc} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-surface-200/60 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden sm:table-cell">Phòng</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden md:table-cell">Loại</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Ưu tiên</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden lg:table-cell">Trạng thái</th>
                  <th className="px-5 py-3.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="table-row-hover">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold font-sans text-navy-700 max-w-xs truncate">{inc.title}</p>
                      <p className="text-xs text-navy-400 font-body mt-0.5">{inc.reporter?.user?.fullName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-500 font-body hidden sm:table-cell">{inc.room?.roomNumber || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-navy-500 font-body hidden md:table-cell">{categoryLabel[inc.category] || inc.category}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-sans ${(priorityConfig[inc.priority] || priorityConfig.medium).bg} ${(priorityConfig[inc.priority] || priorityConfig.medium).text}`}>
                        {(priorityConfig[inc.priority] || priorityConfig.medium).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><StatusBadge status={inc.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedIncident(inc); setResolutionNote(inc.resolutionNote || '') }}>
                        Xử lý
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title="Chi tiết sự cố"
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-sans text-navy-700">{selectedIncident.title}</h3>
                <p className="text-sm text-navy-400 font-body mt-0.5">
                  Phòng {selectedIncident.room?.roomNumber} · Tòa {selectedIncident.room?.building} · {new Date(selectedIncident.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <StatusBadge status={selectedIncident.status} size="md" />
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                <p className="text-xs text-navy-400 font-body mb-1">Loại sự cố</p>
                <p className="text-sm font-semibold font-sans text-navy-700">{categoryLabel[selectedIncident.category] || selectedIncident.category}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                <p className="text-xs text-navy-400 font-body mb-1">Ưu tiên</p>
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold font-sans ${(priorityConfig[selectedIncident.priority] || priorityConfig.medium).bg} ${(priorityConfig[selectedIncident.priority] || priorityConfig.medium).text}`}>
                  {(priorityConfig[selectedIncident.priority] || priorityConfig.medium).label}
                </span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                <p className="text-xs text-navy-400 font-body mb-1">Báo cáo bởi</p>
                <p className="text-sm font-semibold font-sans text-navy-700 truncate">{selectedIncident.reporter?.user?.fullName || '-'}</p>
              </div>
            </div>

            {/* Description */}
            {selectedIncident.description && (
              <div>
                <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-2">Mô tả</p>
                <p className="text-sm text-navy-600 font-body bg-surface-50 p-4 rounded-xl border border-surface-200/60">{selectedIncident.description}</p>
              </div>
            )}

            {/* Resolution note */}
            {(selectedIncident.status === 'pending' || selectedIncident.status === 'assigned' || selectedIncident.status === 'in_progress') && (
              <div>
                <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Ghi chú giải quyết</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  placeholder="Nhập ghi chú về cách giải quyết..."
                  className={`${inputClasses} resize-none`}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedIncident.status === 'pending' && (
                <Button size="sm" onClick={() => handleUpdateStatus(selectedIncident.id, 'in_progress')} disabled={updating}>
                  <Wrench className="w-4 h-4" /> Bắt đầu xử lý
                </Button>
              )}
              {(selectedIncident.status === 'assigned' || selectedIncident.status === 'in_progress') && (
                <Button size="sm" onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')} disabled={updating}>
                  <CheckCircle2 className="w-4 h-4" /> Đã giải quyết
                </Button>
              )}
              {selectedIncident.status === 'resolved' && (
                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedIncident.id, 'closed')} disabled={updating}>
                  Đóng sự cố
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
