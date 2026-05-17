'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BookOpen, Plus, RefreshCw, Trash2, Edit, Database, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface IndexStats {
  totalDocuments: number
  lastIndexed: string | null
  status: string
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [indexing, setIndexing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isActive: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { value: 'general', label: 'Tổng quát' },
    { value: 'rules', label: 'Nội quy' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'facilities', label: 'Tiện ích' },
    { value: 'procedures', label: 'Thủ tục' },
    { value: 'faq', label: 'Câu hỏi thường gặp' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, indexStatsRes] = await Promise.all([
        api.get('/chatbot/admin/knowledge'),
        api.get('/chatbot/admin/knowledge/stats')
      ])
      const statsData = statsRes.data.data
      setEntries(statsData?.entries || [])
      setIndexStats(indexStatsRes.data.data || null)
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleIndex = async (forceReindex = false) => {
    try {
      setIndexing(true)
      await api.post('/chatbot/admin/knowledge/index', { forceReindex })
      showSuccess('Đã lập chỉ mục thành công!')
      await fetchData()
    } catch (error) {
      console.error('Failed to index:', error)
    } finally {
      setIndexing(false)
    }
  }

  const openCreateModal = () => {
    setEditEntry(null)
    setFormData({ title: '', content: '', category: 'general', isActive: true })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (entry: KnowledgeEntry) => {
    setEditEntry(entry)
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      isActive: entry.isActive
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề'
    if (!formData.content.trim()) newErrors.content = 'Vui lòng nhập nội dung'
    if (!formData.category) newErrors.category = 'Vui lòng chọn danh mục'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editEntry) {
        await api.put(`/chatbot/admin/knowledge/entries/${editEntry.id}`, formData)
        showSuccess('Đã cập nhật tài liệu!')
      } else {
        await api.post('/chatbot/admin/knowledge/entries', formData)
        showSuccess('Đã thêm tài liệu mới!')
      }
      setModalOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Failed to save entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return
    try {
      await api.delete(`/chatbot/admin/knowledge/entries/${id}`)
      showSuccess('Đã xóa tài liệu!')
      await fetchData()
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const categoryLabel = (val: string) =>
    categories.find(c => c.value === val)?.label || val

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cơ sở tri thức AI</h1>
          <p className="text-gray-600 mt-1">Quản lý tài liệu cho trợ lý AI chatbot</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleIndex(false)} disabled={indexing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${indexing ? 'animate-spin' : ''}`} />
            {indexing ? 'Đang lập chỉ mục...' : 'Lập chỉ mục'}
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm tài liệu
          </Button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng tài liệu</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Đang kích hoạt</p>
              <p className="text-2xl font-bold text-gray-900">
                {entries.filter(e => e.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vector đã lập chỉ mục</p>
              <p className="text-2xl font-bold text-gray-900">
                {indexStats?.totalDocuments ?? '-'}
              </p>
              {indexStats?.lastIndexed && (
                <p className="text-xs text-gray-500 mt-1">
                  Lần cuối: {new Date(indexStats.lastIndexed).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Knowledge entries table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách tài liệu</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có tài liệu nào</p>
            <p className="text-sm text-gray-500 mt-1">Thêm tài liệu để huấn luyện trợ lý AI</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Danh mục</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Cập nhật</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{entry.title}</div>
                      <div className="text-gray-500 truncate max-w-xs">{entry.content.slice(0, 80)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {categoryLabel(entry.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(entry.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEntry ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>
              {editEntry ? 'Cập nhật' : 'Thêm tài liệu'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nhập tiêu đề tài liệu"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Nhập nội dung tài liệu..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kích hoạt tài liệu này
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
