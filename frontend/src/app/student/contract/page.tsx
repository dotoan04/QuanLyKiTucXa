'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FileText, Calendar, Download, Building2, Info } from 'lucide-react'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

export default function StudentContractPage() {
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const [downloadLoading, setDownloadLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/students/my-contracts')
      const contracts = response.data.data || []

      // Get active contract
      const activeContract = contracts.find((c: any) => c.status === 'active')
      setContract(activeContract || null)
    } catch (error) {
      console.error('Failed to fetch contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!contract?.id) return
    setDownloadLoading(true)
    try {
      const res = await api.get(`/pdf/contract/${contract.id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `hop-dong-${contract.room?.roomNumber || 'phong'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Không thể tải hợp đồng PDF. Vui lòng thử lại sau.')
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hợp đồng của tôi</h1>
        <p className="text-gray-600 mt-1">Xem và quản lý thông tin hợp đồng</p>
      </div>

      {!contract ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Bạn chưa có hợp đồng phòng nào</p>
              <p className="text-sm text-gray-500 mt-2">Vui lòng đăng ký phòng để bắt đầu thuê</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Hợp đồng hiện tại</h2>
              <StatusBadge status={contract.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã hợp đồng</label>
                <div className="text-lg font-semibold text-gray-900">
                  {contract.id.slice(0, 12)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <div className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <div className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê hàng tháng</label>
                <div className="text-2xl font-bold text-primary-600">
                  {formatVnd(contract.monthlyRent)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiền đặt cọc</label>
                <div className="text-lg font-semibold text-gray-900">
                  {formatVnd(contract.depositAmount)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={contract.status} />
                  {contract.status === 'active' && (
                    <span className="text-sm text-green-600">Đang hoạt động</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Thông tin phòng</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng</label>
                <div className="text-xl font-bold text-gray-900">
                  {contract.room?.roomNumber}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
                <div className="text-xl font-bold text-gray-900">
                  Tòa {contract.room?.building}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tầng</label>
                <div className="text-xl font-bold text-gray-900">
                  {contract.room?.floor}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại phòng</label>
                <div className="text-lg font-semibold text-gray-900">
                  {contract.room?.roomType?.name}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Chi tiết loại phòng</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Sức chứa: {contract.room?.roomType?.capacity} người
                  </div>
                  <div className="text-sm text-gray-600">
                    Giá: {formatVnd(contract.room?.roomType?.monthlyPrice)}/tháng
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 p-6 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showDetails ? 'Thu gọn chi tiết' : 'Xem chi tiết'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloadLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadLoading ? 'Đang tải...' : 'Tải hợp đồng PDF'}
            </Button>
          </div>

          {showDetails && (
            <div className="border-t border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Điều khoản hợp đồng</h3>
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Điều khoản thuê phòng</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Người thuê đồng ý tuân thủ các quy định của ký túc xá</li>
                    <li>Thanh toán tiền thuê đúng hạn theo quy định</li>
                    <li>Giữ gìn và giữ phòng ở tình trạng sạch sẽ</li>
                    <li>Không sử dụng phòng cho mục đích bất hợp pháp</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Quy định về thanh toán</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Tiền phòng: thanh toán vào ngày 15 hàng tháng</li>
                    <li>Tiền điện, nước: thanh toán theo số liệu thực tế</li>
                    <li>Phí chuyển phòng: thanh toán 1 tháng trước khi chuyển</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Chấm dứt hợp đồng</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Thông báo trước ít nhất 1 tháng nếu muốn chấm dứt hợp đồng</li>
                    <li>Trả đủ tiền thuê, tiền điện, nước và các khoản khác</li>
                    <li>Trả phòng sạch sẽ và bàn giao tài sản</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Liên hệ</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Hotline: 1900 xxxx</li>
                    <li>Email: ky-tuc-xa@edu.vn</li>
                    <li>Địa chỉ: Đường xxx, Quận xxx, TP. Hồ Chí Minh</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
