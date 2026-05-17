'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Users, Plus, Trash2, Mail, Phone, CheckCircle, Search, X, ChevronDown, Building2, FileText, Wrench, Download, Send } from 'lucide-react'
import api from '@/lib/api'

const FACULTIES = [
  'Công nghệ thông tin', 'Kinh tế', 'Kỹ thuật cơ khí',
  'Điện tử viễn thông', 'Ngoại ngữ', 'Quản trị kinh doanh',
]
const YEARS = ['1', '2', '3', '4']

const DEFAULT_FORM = {
  fullName: '', email: '', password: '', phone: '',
  studentCode: '', faculty: '', academicYear: '',
}
const DEFAULT_FIELD_ERRORS = {
  fullName: '', email: '', password: '', studentCode: '',
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({ ...DEFAULT_FORM })
  const [fieldErrors, setFieldErrors] = useState({ ...DEFAULT_FIELD_ERRORS })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { fetchData() }, [filterFaculty, filterYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterFaculty) params.faculty = filterFaculty
      if (filterYear) params.academicYear = parseInt(filterYear)
      const response = await api.get('/students', { params })
      const raw = response.data.data
      setStudents(Array.isArray(raw) ? raw : raw?.students || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) return
    try {
      await api.delete(`/students/${studentId}`)
      await fetchData()
    } catch (error) {
      console.error('Failed to delete student:', error)
    }
  }

  const validateForm = () => {
    const errors = { ...DEFAULT_FIELD_ERRORS }
    let valid = true
    if (!formData.fullName.trim()) { errors.fullName = 'Họ và tên không được để trống.'; valid = false }
    if (!formData.email.trim()) { errors.email = 'Email không được để trống.'; valid = false }
    else if (!validateEmail(formData.email.trim())) { errors.email = 'Email không đúng định dạng.'; valid = false }
    if (!formData.password) { errors.password = 'Mật khẩu không được để trống.'; valid = false }
    else if (formData.password.length < 6) { errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'; valid = false }
    if (!formData.studentCode.trim()) { errors.studentCode = 'Mã sinh viên không được để trống.'; valid = false }
    setFieldErrors(errors)
    return valid
  }

  const handleAddStudent = async () => {
    setFormError('')
    if (!validateForm()) return
    try {
      setFormLoading(true)
      const name = formData.fullName.trim()
      await api.post('/auth/register', {
        fullName: name, email: formData.email.trim(), password: formData.password,
        phone: formData.phone.trim() || undefined, studentCode: formData.studentCode.trim(),
        faculty: formData.faculty || undefined,
        academicYear: formData.academicYear ? parseInt(formData.academicYear) : undefined,
      })
      setAddModalOpen(false)
      setFormData({ ...DEFAULT_FORM })
      setFieldErrors({ ...DEFAULT_FIELD_ERRORS })
      await fetchData()
      setSuccessMsg(`Đã thêm sinh viên "${name}" thành công!`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm sinh viên.')
    } finally {
      setFormLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData({ ...DEFAULT_FORM }); setFieldErrors({ ...DEFAULT_FIELD_ERRORS })
    setFormError(''); setAddModalOpen(true)
  }
  const closeAddModal = () => {
    setAddModalOpen(false); setFormData({ ...DEFAULT_FORM })
    setFieldErrors({ ...DEFAULT_FIELD_ERRORS }); setFormError('')
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredStudents.map(s => s.id)))
  }

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      s.user?.fullName?.toLowerCase().includes(q) ||
      s.studentCode?.toLowerCase().includes(q) ||
      s.faculty?.toLowerCase().includes(q)
    return matchSearch
  })

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 text-sm rounded-xl border font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${
      hasError ? 'border-danger-300 bg-danger-50/30' : 'border-surface-300'
    }`

  const getStudentInitial = (s: any) => s.user?.fullName?.charAt(0)?.toUpperCase() || '?'
  const getActiveContract = (s: any) => s.contracts?.find((c: any) => c.status === 'active')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Quản lý sinh viên</h1>
          <p className="text-navy-400 mt-0.5 font-body">Quản lý thông tin sinh viên và hợp đồng</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4" />
          Thêm sinh viên
        </Button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-success-50 border border-success-200 text-success-800 px-4 py-3 rounded-xl animate-slide-down">
          <CheckCircle className="h-5 w-5 shrink-0 text-success-600" />
          <span className="text-sm font-medium font-body">{successMsg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã SV, khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex gap-2">
          <div className="w-44">
            <Select
              value={filterFaculty}
              onChange={(value) => setFilterFaculty(value)}
              options={[{ value: '', label: 'Tất cả khoa' }, ...FACULTIES.map(f => ({ value: f, label: f }))]}
            />
          </div>
          <div className="w-36">
            <Select
              value={filterYear}
              onChange={(value) => setFilterYear(value)}
              options={[{ value: '', label: 'Tất cả khóa' }, ...YEARS.map(y => ({ value: y, label: `Khóa ${y}` }))]}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-xl animate-slide-down">
          <span className="text-sm font-semibold font-sans text-primary-700">{selectedIds.size} sinh viên đã chọn</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm"><Send className="w-4 h-4" /> Gửi thông báo</Button>
          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /> Xuất file</Button>
          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-surface-200/60 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Sinh viên</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden md:table-cell">Khoa</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden lg:table-cell">Liên hệ</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider">Phòng</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans text-navy-400 uppercase tracking-wider hidden sm:table-cell">Trạng thái</th>
                <th className="px-5 py-3.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-surface-200 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Users className="w-12 h-12 text-navy-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold font-sans text-navy-500">Không tìm thấy sinh viên</p>
                    <p className="text-xs text-navy-400 font-body mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const contract = getActiveContract(student)
                  return (
                    <tr key={student.id} className="table-row-hover" onClick={() => setSelectedStudent(student)}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center text-sm font-bold font-sans text-navy-600 shrink-0">
                            {getStudentInitial(student)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold font-sans text-navy-700 truncate">{student.user?.fullName}</p>
                            <p className="text-xs text-navy-400 font-body">{student.studentCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-navy-500 font-body hidden md:table-cell">{student.faculty || '-'}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <div className="text-sm text-navy-500 font-body truncate">{student.user?.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        {contract ? (
                          <div>
                            <p className="text-sm font-medium font-sans text-navy-700">{contract.room?.roomNumber}</p>
                            <p className="text-xs text-navy-400 font-body">Tòa {contract.room?.building}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-navy-400 font-body">Chưa có phòng</span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <StatusBadge status={contract ? contract.status : 'pending'} />
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 text-navy-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        title="Thêm sinh viên mới"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeAddModal} disabled={formLoading}>Hủy</Button>
            <Button onClick={handleAddStudent} loading={formLoading}>Thêm sinh viên</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-3 rounded-xl font-body">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Họ và tên <span className="text-danger-500">*</span></label>
            <input type="text" value={formData.fullName} onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' }) }} className={inputClass(!!fieldErrors.fullName)} placeholder="Nguyễn Văn A" />
            {fieldErrors.fullName && <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.fullName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Email <span className="text-danger-500">*</span></label>
              <input type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' }) }} className={inputClass(!!fieldErrors.email)} placeholder="sv@email.com" />
              {fieldErrors.email && <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Số điện thoại</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass(false)} placeholder="0912345678" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Mật khẩu <span className="text-danger-500">*</span></label>
            <input type="password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' }) }} className={inputClass(!!fieldErrors.password)} placeholder="Ít nhất 6 ký tự" />
            {fieldErrors.password && <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Mã sinh viên <span className="text-danger-500">*</span></label>
            <input type="text" value={formData.studentCode} onChange={(e) => { setFormData({ ...formData, studentCode: e.target.value }); if (fieldErrors.studentCode) setFieldErrors({ ...fieldErrors, studentCode: '' }) }} className={inputClass(!!fieldErrors.studentCode)} placeholder="SV001" />
            {fieldErrors.studentCode && <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.studentCode}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Khoa" value={formData.faculty} onChange={(value) => setFormData({ ...formData, faculty: value })} options={[{ value: '', label: 'Chọn khoa' }, ...FACULTIES.map(f => ({ value: f, label: f }))]} />
            </div>
            <div>
              <Select label="Khóa học" value={formData.academicYear} onChange={(value) => setFormData({ ...formData, academicYear: value })} options={[{ value: '', label: 'Chọn khóa' }, ...YEARS.map(y => ({ value: y, label: `Khóa ${y}` }))]} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Student Detail Slide-in Panel */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedStudent(null)}>
          <div className="absolute inset-0 bg-navy-900/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white shadow-elevated animate-slide-in-right overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-white">
              <h2 className="text-lg font-bold font-sans text-navy-700">Chi tiết sinh viên</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-surface-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-navy-100 flex items-center justify-center text-xl font-bold font-sans text-navy-600">
                  {getStudentInitial(selectedStudent)}
                </div>
                <div>
                  <p className="font-bold font-sans text-navy-700 text-lg">{selectedStudent.user?.fullName}</p>
                  <p className="text-sm text-navy-400 font-body">{selectedStudent.studentCode}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                  <p className="text-xs text-navy-400 font-body mb-1">Khoa</p>
                  <p className="text-sm font-semibold font-sans text-navy-700">{selectedStudent.faculty || '-'}</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                  <p className="text-xs text-navy-400 font-body mb-1">Khóa học</p>
                  <p className="text-sm font-semibold font-sans text-navy-700">{selectedStudent.academicYear ? `K${selectedStudent.academicYear}` : '-'}</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                  <p className="text-xs text-navy-400 font-body mb-1">Email</p>
                  <p className="text-sm font-semibold font-sans text-navy-700 truncate">{selectedStudent.user?.email}</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                  <p className="text-xs text-navy-400 font-body mb-1">Số điện thoại</p>
                  <p className="text-sm font-semibold font-sans text-navy-700">{selectedStudent.user?.phone || '-'}</p>
                </div>
              </div>

              {/* Active Contract */}
              {getActiveContract(selectedStudent) && (
                <div>
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-3">Hợp đồng hiện tại</p>
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-100">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold font-sans text-navy-700">Phòng {getActiveContract(selectedStudent).room?.roomNumber}</p>
                          <p className="text-xs text-navy-400 font-body">Tòa {getActiveContract(selectedStudent).room?.building} · {getActiveContract(selectedStudent).room?.roomType?.name}</p>
                        </div>
                      </div>
                      <StatusBadge status={getActiveContract(selectedStudent).status} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary-200/50 text-sm text-navy-500 font-body">
                      {parseInt(getActiveContract(selectedStudent).monthlyRent || 0).toLocaleString('vi-VN')}đ/tháng · Bắt đầu: {new Date(getActiveContract(selectedStudent).startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Invoices */}
              {selectedStudent.invoices?.length > 0 && (
                <div>
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-3">Hóa đơn gần đây</p>
                  <div className="space-y-2">
                    {selectedStudent.invoices.slice(0, 3).map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning-100"><FileText className="w-4 h-4 text-warning-600" /></div>
                          <div>
                            <p className="text-sm font-medium font-sans text-navy-700">
                              {new Date(inv.invoiceMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-navy-400 font-body">{parseInt(inv.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incidents */}
              {selectedStudent.incidents?.length > 0 && (
                <div>
                  <p className="text-xs font-bold font-sans text-navy-400 uppercase tracking-wider mb-3">Sự cố đã báo cáo</p>
                  <div className="space-y-2">
                    {selectedStudent.incidents.slice(0, 3).map((inc: any) => (
                      <div key={inc.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200/60">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-danger-100"><Wrench className="w-4 h-4 text-danger-600" /></div>
                          <p className="text-sm font-medium font-sans text-navy-700">{inc.title}</p>
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
