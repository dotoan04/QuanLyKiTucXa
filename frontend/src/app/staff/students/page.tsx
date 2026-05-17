'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Users, Search } from 'lucide-react'
import api from '@/lib/api'

export default function StaffStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchStudents()
  }, [page, search])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (search) params.search = search
      const res = await api.get('/students', { params })
      const raw = res.data.data
      setStudents(Array.isArray(raw) ? raw : [])
      setTotal(res.data.meta?.total || 0)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Danh sách sinh viên</h1>
        <p className="text-gray-600 mt-1">Xem thông tin sinh viên đang ở ký túc xá</p>
      </div>

      <Card>
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo tên, email, mã sinh viên..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600">Không tìm thấy sinh viên nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Họ tên</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Mã SV</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Khoa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{student.user?.fullName}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{student.studentCode}</td>
                      <td className="px-4 py-3 text-gray-600">{student.user?.email}</td>
                      <td className="px-4 py-3 text-gray-600">{student.faculty || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.user?.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Trước</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Sau</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Student detail modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Thông tin sinh viên"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <p className="font-semibold text-gray-900">{selectedStudent.user?.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên</label>
                <p className="font-mono text-gray-900">{selectedStudent.studentCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{selectedStudent.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                <p className="text-gray-900">{selectedStudent.user?.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                <p className="text-gray-900">{selectedStudent.faculty || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                <p className="text-gray-900">{selectedStudent.academicYear || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <p className="text-gray-900">
                  {selectedStudent.gender === 'male' ? 'Nam' :
                   selectedStudent.gender === 'female' ? 'Nữ' : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quê quán</label>
                <p className="text-gray-900">{selectedStudent.hometown || '-'}</p>
              </div>
            </div>

            {/* Active contract */}
            {selectedStudent.contracts?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hợp đồng hiện tại</label>
                {selectedStudent.contracts
                  .filter((c: any) => c.status === 'active')
                  .map((contract: any) => (
                    <div key={contract.id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Phòng: </span>
                          <span className="font-medium">{contract.room?.roomNumber} - Tòa {contract.room?.building}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Loại phòng: </span>
                          <span className="font-medium">{contract.room?.roomType?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bắt đầu: </span>
                          <span className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tiền thuê: </span>
                          <span className="font-medium text-blue-700">{contract.monthlyRent?.toLocaleString('vi-VN')} đ/tháng</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {selectedStudent.contracts.filter((c: any) => c.status === 'active').length === 0 && (
                  <p className="text-gray-500 text-sm">Không có hợp đồng đang hoạt động</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
