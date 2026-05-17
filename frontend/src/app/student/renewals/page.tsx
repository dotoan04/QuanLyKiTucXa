'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { RefreshCw, Calendar, Building2, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

export default function StudentRenewals() {
  const [contracts, setContracts] = useState<any[]>([])
  const [eligibility, setEligibility] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRenewal, setShowRenewal] = useState(false)
  const [renewalData, setRenewalData] = useState({ contractId: '', newEndDate: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const contractsRes = await api.get('/students/my-contracts')
      const contracts = contractsRes.data.data || []
      setContracts(contracts)

      const active = contracts.find((c: any) => c.status === 'active')
      if (active) {
        try {
          const eligibilityRes = await api.get(`/renewals/${active.id}/eligibility`)
          setEligibility(eligibilityRes.data.data)
        } catch {
          setEligibility(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRenew = async () => {
    setSubmitting(true)
    try {
      await api.post('/renewals', renewalData)
      setShowRenewal(false)
      fetchData()
    } catch (error) {
      console.error('Failed to renew:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const activeContract = contracts.find(c => c.status === 'active')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gia hạn hợp đồng</h1>
        <p className="text-gray-500 mt-1">Kiểm tra điều kiện và yêu cầu gia hạn hợp đồng</p>
      </div>

      {/* Eligibility status */}
      {eligibility && (
        <Card className={`p-5 border-l-4 ${eligibility.eligible ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
          <div className="flex items-center gap-3">
            {eligibility.eligible ? (
              <div className="p-2 rounded-lg bg-emerald-50"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-50"><XCircle className="w-5 h-5 text-amber-600" /></div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {eligibility.eligible ? 'Bạn đủ điều kiện gia hạn' : 'Chưa đủ điều kiện gia hạn'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{eligibility.reason || (eligibility.eligible ? 'Hợp đồng đang hoạt động và có thể gia hạn' : 'Vui lòng kiểm tra lại điều kiện')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Active contract */}
      {activeContract ? (
        <Card>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Hợp đồng hiện tại</h2>
              <StatusBadge status={activeContract.status} />
            </div>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Phòng', value: activeContract.room?.roomNumber || '-', icon: Building2 },
              { label: 'Ngày bắt đầu', value: new Date(activeContract.startDate).toLocaleDateString('vi-VN'), icon: Calendar },
              { label: 'Ngày kết thúc', value: new Date(activeContract.endDate).toLocaleDateString('vi-VN'), icon: Calendar },
              { label: 'Tiền phòng/tháng', value: formatVnd(activeContract.monthlyRent) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}

            {/* Days remaining */}
            {(() => {
              const daysLeft = Math.ceil((new Date(activeContract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div className={`mt-3 p-3 rounded-xl text-center ${daysLeft <= 30 ? 'bg-red-50' : daysLeft <= 90 ? 'bg-amber-50' : 'bg-blue-50'}`}>
                  <p className={`text-2xl font-bold ${daysLeft <= 30 ? 'text-red-600' : daysLeft <= 90 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {daysLeft > 0 ? daysLeft : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">ngày còn lại</p>
                </div>
              )
            })()}

            {eligibility?.eligible && (
              <Button
                className="w-full mt-4"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => {
                  setRenewalData({ ...renewalData, contractId: activeContract.id })
                  setShowRenewal(true)
                }}
              >
                Yêu cầu gia hạn
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<RefreshCw className="w-8 h-8 text-gray-300" />}
          title="Không có hợp đồng đang hoạt động"
          description="Bạn cần có hợp đồng đang hoạt động để gia hạn"
        />
      )}

      {/* Renewal Modal */}
      <Modal
        isOpen={showRenewal}
        onClose={() => setShowRenewal(false)}
        title="Gia hạn hợp đồng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRenewal(false)}>Hủy</Button>
            <Button onClick={handleRenew} loading={submitting}>Xác nhận gia hạn</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc mới *</label>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              value={renewalData.newEndDate}
              onChange={(e) => setRenewalData({ ...renewalData, newEndDate: e.target.value })}
            />
          </div>
          <p className="text-xs text-gray-500">Thời gian gia hạn tối thiểu là 1 học kỳ (6 tháng)</p>
        </div>
      </Modal>
    </div>
  )
}
