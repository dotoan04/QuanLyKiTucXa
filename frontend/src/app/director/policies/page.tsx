'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

interface RoomTypePolicy {
  id: string
  name: string
  capacity: number
  monthlyPrice: string
  roomCount: number
}

export default function DirectorPoliciesPage() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomTypePolicy[]>([])
  const [priceInput, setPriceInput] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/director/policies/room-types')
      const items: RoomTypePolicy[] = res.data.data || []
      setRoomTypes(items)
      const next: Record<string, string> = {}
      items.forEach((i) => {
        next[i.id] = String(Number(i.monthlyPrice || 0))
      })
      setPriceInput(next)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const approvePrice = async (id: string) => {
    const monthlyPrice = Number(priceInput[id] || 0)
    if (monthlyPrice <= 0) {
      alert('Giá phòng phải lớn hơn 0')
      return
    }

    setSavingId(id)
    try {
      await api.put(`/director/policies/room-types/${id}/approve-price`, { monthlyPrice })
      await fetchPolicies()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Phê duyệt thất bại')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt chính sách và giá phòng</h1>
        <p className="text-gray-600 mt-1">UC22 - Ban Giám Đốc phê duyệt giá phòng</p>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại phòng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sức chứa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số phòng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá hiện tại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá phê duyệt</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roomTypes.map((rt) => (
                  <tr key={rt.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{rt.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{rt.capacity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{rt.roomCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{Number(rt.monthlyPrice).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={priceInput[rt.id] || ''}
                        onChange={(e) => setPriceInput((prev) => ({ ...prev, [rt.id]: e.target.value }))}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => approvePrice(rt.id)} disabled={savingId === rt.id}>
                        {savingId === rt.id ? 'Đang lưu...' : 'Phê duyệt'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
