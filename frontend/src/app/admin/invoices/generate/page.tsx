'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

interface Contract {
  id: string
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
  student?: {
    id: string
    studentCode: string
    user: {
      fullName: string
      email: string
      phone: string
    }
  }
  invoices?: Invoice[]
}

interface Invoice {
  id: string
  invoiceMonth: string
  totalAmount: number
  roomFee: number
  electricityPrev: number
  electricityCurr: number
  electricityPrice: number
  waterPrev: number
  waterCurr: number
  waterPrice: number
  status: string
  dueDate: string
}

export default function GenerateInvoicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [invoiceMonth, setInvoiceMonth] = useState<string>('')
  const [dueDays, setDueDays] = useState(15)

  useEffect(() => {
    fetchActiveContracts()
  }, [])

  const fetchActiveContracts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/contracts', {
        params: { status: 'active', limit: 100 }
      })
      setContracts(res.data.data.contracts || [])
    } catch (error: any) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([])
    } else {
      setSelectedContracts(contracts.map(c => c.id))
    }
  }

  const handleGenerateInvoices = async () => {
    if (selectedContracts.length === 0) {
      alert('Vui lòng chọn ít nhất một hợp đồng')
      return
    }

    if (!invoiceMonth) {
      alert('Vui lòng chọn tháng hóa đơn')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/invoices/generate-batch', {
        contractIds: selectedContracts,
        invoiceMonth: new Date(invoiceMonth).toISOString(),
        dueDays
      })

      alert(`Đã tạo thành công ${res.data.data.created} hóa đơn!`)
      setSelectedContracts([])
      fetchActiveContracts()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getMonthName = (monthOffset: number) => {
    const date = new Date()
    date.setMonth(date.getMonth() + monthOffset)
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Tạo hóa đơn hàng loạt</h1>
            <p className="text-gray-600 mt-2">Tạo hóa đơn cho nhiều hợp đồng cùng lúc</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tháng hóa đơn
                </label>
                <select
                  value={invoiceMonth}
                  onChange={(e) => setInvoiceMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Chọn tháng</option>
                  {[-1, 0, 1, 2, 3].map(offset => {
                    const date = new Date()
                    date.setMonth(date.getMonth() + offset)
                    const value = date.toISOString().slice(0, 7)
                    return (
                      <option key={value} value={value}>
                        {getMonthName(offset)}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn thanh toán (ngày)
                </label>
                <input
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(parseInt(e.target.value) || 1)}
                  min={1}
                  max={31}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleGenerateInvoices}
                disabled={loading || selectedContracts.length === 0 || !invoiceMonth}
                className="w-full"
              >
                {loading ? 'Đang tạo...' : `Tạo hóa đơn (${selectedContracts.length})`}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Lưu ý:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Chỉ tạo cho hợp đồng đang hoạt động</li>
                    <li>Chỉ số điện/nước sẽ được tự động sinh</li>
                    <li>Hóa đơn đã tồn tại sẽ bị bỏ qua</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Hợp đồng đang hoạt động ({contracts.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedContracts.length === contracts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </div>

            {loading && contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Đang tải...
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Không có hợp đồng đang hoạt động
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedContracts.length === contracts.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phòng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sinh viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiền thuê
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày bắt đầu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract.id)}
                            onChange={() => handleSelectContract(contract.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.room.roomNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.room.roomType.name} - Tòa {contract.room.building}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.student?.user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.student?.studentCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(contract.monthlyRent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contract.startDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
