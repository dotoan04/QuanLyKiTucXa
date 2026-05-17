'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Users, Plus, Edit, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  student: 'Sinh viên',
  accountant: 'Kế toán',
  technician: 'Kỹ thuật viên',
  director: 'Ban giám đốc',
}

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Nhân viên' },
  { value: 'accountant', label: 'Kế toán' },
  { value: 'technician', label: 'Kỹ thuật' },
  { value: 'director', label: 'Ban giám đốc' },
]

interface User {
  id: string
  email: string
  fullName: string
  role: string
  phone: string
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'staff',
    phone: '',
    position: '',
    department: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: 20 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/auth/users', { params })
      setUsers(res.data.data?.users || [])
      setTotal(res.data.data?.total || 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'staff',
      phone: '',
      position: '',
      department: ''
    })
    setErrorMsg('')
    setModalOpen(true)
  }

  const openEditModal = (u: User) => {
    setEditingUser(u)
    setFormData({
      email: u.email,
      password: '',
      fullName: u.fullName,
      role: u.role,
      phone: u.phone || '',
      position: '',
      department: ''
    })
    setErrorMsg('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setErrorMsg('')
    if (!formData.email.trim()) { setErrorMsg('Vui lòng nhập email'); return }
    if (!formData.fullName.trim()) { setErrorMsg('Vui lòng nhập họ tên'); return }
    if (!editingUser && !formData.password.trim()) { setErrorMsg('Vui lòng nhập mật khẩu'); return }

    if (formData.role === 'student') {
      setErrorMsg('Không thể tạo tài khoản sinh viên ở đây. Sinh viên tự đăng ký.')
      return
    }

    setSaving(true)
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, {
          fullName: formData.fullName,
          phone: formData.phone,
          role: formData.role
        })
        setSuccessMsg('Cập nhật tài khoản thành công')
      } else {
        await api.post('/auth/users', formData)
        setSuccessMsg('Tạo tài khoản thành công')
      }
      setModalOpen(false)
      await fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Bạn có chắc muốn vô hiệu hóa tài khoản "${u.email}"?`)) return
    try {
      await api.delete(`/auth/users/${u.id}`)
      setSuccessMsg('Đã vô hiệu hóa tài khoản thành công')
      await fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-600 mt-1">Tạo, chỉnh sửa và phân quyền người dùng</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm tài khoản
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo email, họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="px-3 py-2 border border-gray-300 rounded-lg w-64"
          />
          <Select
            value={roleFilter}
            onChange={(val) => { setRoleFilter(val); setPage(1) }}
            options={[
              { value: '', label: 'Tất cả vai trò' },
              ...ROLE_OPTIONS
            ]}
            placeholder="Lọc theo vai trò"
          />
          <Button variant="outline" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có tài khoản nào. Nhấn "Thêm tài khoản" để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                  <th className="px-4 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 whitespace-nowrap text-sm">
                      <span className="text-primary-600">{u.email}</span>
                    </td>
                    <td className="px-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'accountant' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'technician' ? 'bg-orange-100 text-orange-700' :
                        u.role === 'director' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === user?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Hiển thị {users.length} / {total} tài khoản
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-700">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 animate-pulse">
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu {!editingUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={!!editingUser}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Họ và tên"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="SĐT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <Select
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={ROLE_OPTIONS}
                placeholder="Chọn vai trò"
              />
            </div>
          </div>

          {(formData.role === 'staff' || formData.role === 'accountant' || formData.role === 'technician' || formData.role === 'director') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức vụ
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="VD: Quản lý tòa nhà"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="VD: Ban quản lý KTX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
