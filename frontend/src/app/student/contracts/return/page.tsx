'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, AlertCircle, CheckCircle, Clock, FileText, Camera, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

interface DormContract {
  id: string
  returnRequestId?: string
  roomId: string
  room: {
    roomNumber: string
    floor: number
    building: string
    roomType: {
      name: string
      capacity: number
      monthlyPrice: number
    }
  }
  monthlyRent: number
  depositAmount: number
  startDate: string
  endDate?: string
  status: string
}

interface ReturnRequest {
  id: string
  contractId: string
  contract?: {
    room?: {
      roomNumber?: string
    }
    depositAmount?: number
  }
  returnDate: string
  reason?: string
  status: string
  scheduledDate?: string
  inspectorId?: string
  damageNotes?: string
  damagePhotos?: string[]
  damageAmount?: number
  refundAmount?: number
  refundProcessed?: boolean
  createdAt: string
}

export default function ReturnRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<DormContract[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [selectedContract, setSelectedContract] = useState<DormContract | null>(null)
  const [step, setStep] = useState<any>(1)
  const [formData, setFormData] = useState({
    returnDate: '',
    reason: '',
    scheduledDate: '',
    inspectorId: '',
    damageNotes: '',
    damageAmount: 0,
    refundBankAccount: '',
    refundBankName: ''
  })

  useEffect(() => {
    fetchContracts()
    fetchReturnRequests()
  }, [])

  const fetchContracts = async () => {
    try {
      const res = await api.get('/students/me')
      const studentId = res.data.data.id

      const contractsRes = await api.get(`/students/${studentId}/contracts`)
      setContracts(contractsRes.data.data.contracts || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const fetchReturnRequests = async () => {
    try {
      const res = await api.get('/returns/my')
      setReturnRequests(res.data.data.returnRequests || [])
    } catch (error) {
      console.error('Error fetching return requests:', error)
    }
  }

  const handleSelectContract = (contract: DormContract) => {
    setSelectedContract(contract)
    setStep(2)
  }

  const handleCreateReturnRequest = async () => {
    if (!selectedContract) return

    setLoading(true)
    try {
      const res = await api.post('/returns', {
        contractId: selectedContract.id,
        returnDate: formData.returnDate,
        reason: formData.reason
      })

      alert('Đăng ký trả phòng thành công! Vui lòng thanh toán hết hóa đơn trước khi trả phòng.')
      setStep(1)
      setSelectedContract(null)
      fetchReturnRequests()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleInspection = async () => {
    if (!formData.scheduledDate || !formData.inspectorId) return

    setLoading(true)
    try {
      await api.post(`/returns/${selectedContract?.returnRequestId}/schedule`, {
        scheduledDate: formData.scheduledDate,
        inspectorId: formData.inspectorId
      })

      alert('Đã lên lịch kiểm tra phòng thành công!')
      setStep(3)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteInspection = async () => {
    if (!formData.damageNotes) return

    setLoading(true)
    try {
      await api.post(`/returns/${selectedContract?.returnRequestId}/complete`, {
        damageNotes: formData.damageNotes,
        damageAmount: formData.damageAmount,
        inspectionNotes: 'Đã hoàn thành kiểm tra'
      })

      alert('Đã hoàn thành kiểm tra phòng!')
      setStep(4)
      fetchReturnRequests()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRefund = async () => {
    if (!formData.refundBankAccount || !formData.refundBankName) return

    setLoading(true)
    try {
      await api.post(`/returns/${selectedContract?.returnRequestId}/refund`, {
        bankAccount: formData.refundBankAccount,
        bankName: formData.refundBankName
      })

      alert('Đã xử lý hoàn tiền cọc!')
      setStep(5)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency' }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      scheduled: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-800' },
      inspected: { label: 'Đã kiểm tra', color: 'bg-purple-100 text-purple-800' },
      refund_pending: { label: 'Chờ hoàn tiền', color: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Hoàn tất', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
    }
    return statusMap[status] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' }
  }

  const activeContracts = contracts.filter(c => c.status === 'active')
  const pastReturns = returnRequests.filter(r => r.status !== 'pending')

  if (step === 1 && !selectedContract) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Đăng ký trả phòng</h1>
          <p className="text-gray-600 mt-2">Trả phòng ký túc xá</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hợp đồng hiện tại</h2>
              {activeContracts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Bạn không có hợp đồng đang hoạt động
                </p>
              ) : (
                <div className="space-y-3">
                  {activeContracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => handleSelectContract(contract)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        (selectedContract as any)?.id === contract.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          Phòng {contract.room.roomNumber} - {contract.room.roomType.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(contract.monthlyRent)}/tháng
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Tòa {contract.room.building} - Tầng {contract.room.floor}</p>
                        <p>Bắt đầu: {formatDate(contract.startDate)}</p>
                        {contract.endDate && (
                          <p>Kết thúc: {formatDate(contract.endDate)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử trả phòng</h2>
              {pastReturns.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Chưa có yêu cầu trả phòng nào
                </p>
              ) : (
                <div className="space-y-3">
                  {pastReturns.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          Phòng {request.contract?.room?.roomNumber}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(request.status).color}`}>
                          {getStatusBadge(request.status).label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Ngày trả: {formatDate(request.returnDate)}</p>
                        <p>Tiền cọc: {formatCurrency(request.contract?.depositAmount || 0)}</p>
                        {request.damageAmount && request.damageAmount > 0 && (
                          <p className="text-red-600">
                            Phí bồi thường: {formatCurrency(request.damageAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {selectedContract && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Chi tiết hợp đồng
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedContract(null)
                  setStep(1)
                }}
              >
                Đóng
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Phòng</p>
                <p className="font-medium text-gray-900">
                  {(selectedContract as any).room.roomNumber} - {(selectedContract as any).room.roomType.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vị trí</p>
                <p className="font-medium text-gray-900">
                  Tòa {(selectedContract as any).room.building} - Tầng {(selectedContract as any).room.floor}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiền thuê/tháng</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency((selectedContract as any).monthlyRent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiền cọc</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency((selectedContract as any).depositAmount)}
                </p>
              </div>
            </div>

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Đăng ký trả phòng</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày trả phòng *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do (tùy chọn)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ví dụ: Tốt nghiệp, chuyển nơi ở..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1)
                      setSelectedContract(null)
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleCreateReturnRequest}
                    loading={loading}
                  >
                    Gửi yêu cầu
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Lên lịch kiểm tra phòng</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">Yêu cầu đã được ghi nhận</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Vui lòng chọn thời gian kiểm tra phòng. Kỹ thuật sẽ kiểm tra tình trạng phòng trước khi hoàn tiền cọc.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kiểm tra *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleScheduleInspection}
                    loading={loading}
                  >
                    Xác nhận lịch
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Kết quả kiểm tra phòng</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú hư hỏng (nếu có)
                  </label>
                  <textarea
                    value={formData.damageNotes}
                    onChange={(e) => setFormData({ ...formData, damageNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Mô tả các hư hỏng nếu có..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chi phí bồi thường (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.damageAmount}
                    onChange={(e) => setFormData({ ...formData, damageAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900">Tính toán hoàn tiền cọc</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Tiền cọc: {formatCurrency((selectedContract as any).depositAmount)}
                        {formData.damageAmount > 0 && (
                          <> - Phí bồi thường: {formatCurrency(formData.damageAmount)}</>
                        )}
                      </p>
                      <p className="font-bold text-yellow-900 mt-2">
                        Số tiền hoàn lại: {formatCurrency((selectedContract as any).depositAmount - formData.damageAmount)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleCompleteInspection}
                    loading={loading}
                  >
                    Hoàn tất kiểm tra
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin hoàn tiền</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">Kiểm tra phòng hoàn tất</p>
                      <p className="text-sm text-green-800 mt-1">
                        Tiền cọc sẽ được hoàn lại trong vòng 7 ngày làm việc sau khi trừ phí bồi thường (nếu có).
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tài khoản ngân hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.refundBankAccount}
                    onChange={(e) => setFormData({ ...formData, refundBankAccount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên ngân hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.refundBankName}
                    onChange={(e) => setFormData({ ...formData, refundBankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Vietcombank"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(4)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleProcessRefund}
                    loading={loading}
                  >
                    Xác nhận hoàn tiền
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

      </div>
    )
  }
}
