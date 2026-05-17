'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

interface FloorData {
  building: string
  floor: number
  totalRooms: number
  occupied: number
  available: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
}

interface BuildingData {
  building: string
  totalRooms: number
  occupied: number
  available: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
}

interface OccupancyData {
  summary: {
    totalRooms: number
    totalCapacity: number
    currentOccupancy: number
    occupancyRate: number
  }
  buildings: BuildingData[]
  floors: FloorData[]
}

function OccupancyBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? 'bg-red-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-0">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-sm font-semibold w-10 text-right shrink-0">{rate}%</span>
    </div>
  )
}

export default function DirectorOccupancyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OccupancyData | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await api.get('/dashboard/occupancy')
        setData(res.data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  if (loading) return <div className="py-10 text-gray-500 text-center">Đang tải dữ liệu...</div>
  if (!data) return <div className="py-10 text-gray-500 text-center">Không có dữ liệu</div>

  const { summary, buildings, floors } = data
  const filteredFloors = selectedBuilding ? floors.filter(f => f.building === selectedBuilding) : floors

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo công suất phòng</h1>
        <p className="text-gray-500 mt-1">Tình trạng sử dụng phòng theo tòa nhà và tầng</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Tổng số phòng</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalRooms}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Sức chứa tối đa</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summary.totalCapacity}</p>
          <p className="text-xs text-gray-400">người</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Đang ở</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{summary.currentOccupancy}</p>
          <p className="text-xs text-gray-400">sinh viên</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Công suất sử dụng</p>
          <p className={`text-3xl font-bold mt-1 ${summary.occupancyRate >= 90 ? 'text-red-600' : summary.occupancyRate >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
            {summary.occupancyRate}%
          </p>
        </Card>
      </div>

      {/* By building */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Theo tòa nhà</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">Tòa nhà</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Số phòng</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Đang thuê</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Còn trống</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Đang ở</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Sức chứa</th>
                <th className="pb-3 font-medium text-gray-500 w-48">Công suất</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buildings.map(b => (
                <tr
                  key={b.building}
                  className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedBuilding === b.building ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedBuilding(selectedBuilding === b.building ? null : b.building)}
                >
                  <td className="py-3 font-semibold text-gray-900">Tòa {b.building}</td>
                  <td className="py-3 text-right text-gray-700">{b.totalRooms}</td>
                  <td className="py-3 text-right text-orange-600">{b.occupied}</td>
                  <td className="py-3 text-right text-green-600">{b.available}</td>
                  <td className="py-3 text-right text-blue-600">{b.currentOccupancy}</td>
                  <td className="py-3 text-right text-gray-700">{b.totalCapacity}</td>
                  <td className="py-3 w-48">
                    <OccupancyBar rate={b.occupancyRate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedBuilding && (
          <p className="mt-3 text-xs text-blue-600">Nhấn lại vào tòa {selectedBuilding} để bỏ lọc</p>
        )}
      </Card>

      {/* By floor */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Theo tầng {selectedBuilding ? `(Tòa ${selectedBuilding})` : '(Tất cả)'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">Tòa</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Tầng</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Số phòng</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Đang thuê</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Còn trống</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Đang ở</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Sức chứa</th>
                <th className="pb-3 font-medium text-gray-500 w-48">Công suất</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredFloors.map(f => (
                <tr key={`${f.building}-${f.floor}`} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-700">Tòa {f.building}</td>
                  <td className="py-3 text-right text-gray-700">Tầng {f.floor}</td>
                  <td className="py-3 text-right text-gray-700">{f.totalRooms}</td>
                  <td className="py-3 text-right text-orange-600">{f.occupied}</td>
                  <td className="py-3 text-right text-green-600">{f.available}</td>
                  <td className="py-3 text-right text-blue-600">{f.currentOccupancy}</td>
                  <td className="py-3 text-right text-gray-700">{f.totalCapacity}</td>
                  <td className="py-3 w-48">
                    <OccupancyBar rate={f.occupancyRate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
