'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RefreshCw, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

export default function ContractRenewalPage() {
  const [contract, setContract] = useState<any>(null)
  const [renewalInfo, setRenewalInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [duration, setDuration] = useState(6)
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contractRes, renewalRes] = await Promise.all([
        api.get('/students/my-contracts'),
        api.get('/renewals/eligibility')
      ])
      
      const contracts = contractRes.data.data || []
      const activeContract = contracts.find((c: any) => c.status === 'active')
      setContract(activeContract || null)
      setRenewalInfo(renewalRes.data.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!renewalInfo?.eligible) return
    
    try {
      setSubmitting(true)
      await api.post('/renewals', {
        contractId: contract.id,
        requestedDuration: duration,
        note
      })
      alert('Gửi yêu cầu gia hạn thành công!')
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gửi yêu cầu thất bại')
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Gia hạn hợp đồng</h1>
        <p className="text-gray-600 mt-1">Yêu cầu gia hạn hợp đồng thuê phòng</p>
      </div>

      {!contract ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Bạn chưa có hợp đồng đang hoạt động</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin hợp đồng hiện tại</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <div className="text-gray-900">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <div className="text-gray-900">
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
                <div className="text-gray-900">{contract.room?.roomNumber} - Tòa {contract.room?.building}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê</label>
                <div className="text-gray-900">{formatVnd(contract.monthlyRent)}/tháng</div>
              </div>
            </div>
          </Card>

          {renewalInfo && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Điều kiện gia hạn</h2>
                  {renewalInfo.eligible ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      Đủ điều kiện
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-1" />
                      Không đủ điều kiện
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Hợp đồng còn hiệu lực</span>
                  <StatusBadge status={renewalInfo.checks?.contractActive ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Không có nợ quá hạn</span>
                  <StatusBadge status={renewalInfo.checks?.noOverdueInvoices ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Không có vi phạm chưa xử lý</span>
                  <StatusBadge status={renewalInfo.checks?.noPendingViolations ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Trong thời gian cho phép gia hạn</span>
                  <StatusBadge status={renewalInfo.checks?.withinRenewalPeriod ? 'active' : 'inactive'} />
                </div>
                
                {renewalInfo.message && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800 text-sm">{renewalInfo.message}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {renewalInfo?.eligible && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tạo yêu cầu gia hạn</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian gia hạn</label>
                  <div className="grid grid-cols-4 gap-4">
                    {[3, 6, 9, 12].map((months) => (
                      <button
                        key={months}
                        onClick={() => setDuration(months)}
                        className={`p-4 border rounded-lg text-center transition ${
                          duration === months
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl font-bold">{months}</div>
                        <div className="text-sm text-gray-500">tháng</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nhập ghi chú nếu cần..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Thông tin quan trọng</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Yêu cầu gia hạn sẽ được xét duyệt trong vòng 3-5 ngày làm việc.
                        Bạn sẽ nhận được thông báo khi có kết quả.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu gia hạn'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
