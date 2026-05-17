import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DashboardStats {
  overview: {
    totalRooms: number
    occupiedRooms: number
    availableRooms: number
    totalStudents: number
    activeContracts: number
    totalRevenue: number
    pendingInvoices: number
    openTickets: number
    occupancyRate: number
  }
  revenue: {
    thisMonth: number
    lastMonth: number
    byRoomType: Array<{ type: string; revenue: number; count: number }>
    trend: Array<{ month: string; revenue: number }>
  }
  students: {
    byFaculty: Array<{ faculty: string; count: number }>
    byYear: Array<{ year: number; count: number }>
    newThisMonth: number
    totalActive: number
  }
  incidents: {
    open: number
    inProgress: number
    resolved: number
    avgResolutionTime: number
    byCategory: Array<{ category: string; count: number }>
  }
  financial: {
    totalCollected: number
    totalOutstanding: number
    collectionRate: number
    overdueAmount: number
    byPaymentMethod: Array<{ method: string; amount: number }>
  }
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalStudents,
      activeContracts,
      totalRevenueThisMonth,
      totalRevenueLastMonth,
      pendingInvoicesCount,
      pendingInvoicesAmount,
      openTicketsCount,
      collectedThisMonth,
      outstandingAmount,
      newStudentsThisMonth
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'occupied' } }),
      prisma.room.count({ where: { status: 'available' } }),
      prisma.student.count(),
      prisma.contract.count({ where: { status: 'active' } }),
      prisma.invoice.aggregate({
        where: {
          invoiceMonth: { gte: startOfMonth },
          status: 'paid'
        },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          invoiceMonth: { gte: startOfLastMonth, lt: startOfMonth },
          status: 'paid'
        },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.count({ where: { status: { in: ['unpaid', 'overdue'] } } }),
      prisma.invoice.aggregate({
        where: { status: { in: ['unpaid', 'overdue'] } },
        _sum: { totalAmount: true }
      }),
      prisma.incident.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
      prisma.invoice.aggregate({
        where: {
          paidAt: { gte: startOfMonth },
          status: 'paid'
        },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['unpaid', 'overdue', 'partial'] } },
        _sum: { totalAmount: true }
      }),
      // Student model has no createdAt - count via users created this month
      prisma.user.count({
        where: {
          role: 'student',
          createdAt: { gte: startOfMonth }
        }
      })
    ])

    const [
      revenueByRoomType,
      studentsByFaculty,
      studentsByYear,
      incidentsByCategory,
      paymentsByMethod,
      revenueTrend,
      incidentsStats,
      resolvedIncidents
    ] = await Promise.all([
      prisma.invoice.groupBy({
        by: ['contractId'],
        where: {
          invoiceMonth: { gte: startOfMonth },
          status: 'paid'
        },
        _sum: { totalAmount: true },
        _count: true
      }),
      prisma.student.groupBy({
        by: ['faculty'],
        _count: true
      }),
      prisma.student.groupBy({
        by: ['academicYear'],
        _count: true
      }),
      prisma.incident.groupBy({
        by: ['category'],
        _count: true
      }),
      prisma.invoice.groupBy({
        by: ['paymentMethod'],
        where: {
          paidAt: { gte: startOfMonth },
          status: 'paid'
        },
        _sum: { totalAmount: true }
      }),
      Promise.all([0, 1, 2, 3, 4, 5, 6].map(async monthsAgo => {
        const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
        const result = await prisma.invoice.aggregate({
          where: {
            invoiceMonth: { gte: date, lt: new Date(date.getFullYear(), date.getMonth() + 1, 1) },
            status: 'paid'
          },
          _sum: { totalAmount: true }
        })
        return {
          month: date.toISOString().slice(0, 7),
          revenue: result._sum.totalAmount?.toNumber() || 0
        }
      })),
      prisma.incident.aggregate({
        _count: true,
        where: { status: 'resolved' }
      }),
      prisma.incident.findMany({
        where: {
          status: 'resolved',
          resolvedAt: { not: null }
        },
        select: {
          createdAt: true,
          resolvedAt: true
        }
      })
    ])

    let avgResolutionTime = 0
    if (resolvedIncidents.length > 0) {
      const totalHours = resolvedIncidents.reduce((sum, inc) => {
        if (inc.resolvedAt && inc.createdAt) {
          const hours = (inc.resolvedAt.getTime() - inc.createdAt.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)
      avgResolutionTime = Math.round(totalHours / resolvedIncidents.length)
    }

    const totalRevenueThisMonthNum = totalRevenueThisMonth._sum.totalAmount?.toNumber() || 0
    const totalRevenueLastMonthNum = totalRevenueLastMonth._sum.totalAmount?.toNumber() || 0
    const pendingInvoicesAmountNum = pendingInvoicesAmount._sum.totalAmount?.toNumber() || 0
    const collectedThisMonthNum = collectedThisMonth._sum.totalAmount?.toNumber() || 0
    const outstandingAmountNum = outstandingAmount._sum.totalAmount?.toNumber() || 0

    return {
      overview: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalStudents,
        activeContracts,
        totalRevenue: totalRevenueThisMonthNum,
        pendingInvoices: pendingInvoicesCount,
        openTickets: openTicketsCount,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
      },
      revenue: {
        thisMonth: totalRevenueThisMonthNum,
        lastMonth: totalRevenueLastMonthNum,
        byRoomType: revenueByRoomType.map(r => ({
          type: 'Room',
          revenue: r._sum.totalAmount?.toNumber() || 0,
          count: r._count
        })),
        trend: revenueTrend
      },
      students: {
        byFaculty: studentsByFaculty.map(s => ({
          faculty: s.faculty || 'Unknown',
          count: s._count
        })),
        byYear: studentsByYear.map(s => ({
          year: s.academicYear || 1,
          count: s._count
        })),
        newThisMonth: newStudentsThisMonth,
        totalActive: activeContracts
      },
      incidents: {
        open: openTicketsCount,
        inProgress: 0,
        resolved: incidentsStats._count || 0,
        avgResolutionTime,
        byCategory: incidentsByCategory.map(i => ({
          category: i.category,
          count: i._count
        }))
      },
      financial: {
        totalCollected: collectedThisMonthNum,
        totalOutstanding: outstandingAmountNum,
        collectionRate: (collectedThisMonthNum + outstandingAmountNum) > 0 
          ? Math.round((collectedThisMonthNum / (collectedThisMonthNum + outstandingAmountNum)) * 100) 
          : 0,
        overdueAmount: pendingInvoicesAmountNum,
        byPaymentMethod: paymentsByMethod.map(p => ({
          method: p.paymentMethod || 'unknown',
          amount: p._sum.totalAmount?.toNumber() || 0
        }))
      }
    }
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceMonth: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } }
              }
            },
            room: {
              include: { roomType: true }
            }
          }
        }
      },
      orderBy: { invoiceMonth: 'asc' }
    })

    return invoices
  }

  async getOccupancyReport() {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        building: true,
        floor: true,
        status: true,
        currentOccupancy: true,
        roomType: { select: { capacity: true, name: true } }
      }
    })

    // Aggregate by building
    const buildingMap = new Map<string, { totalRooms: number; totalCapacity: number; currentOccupancy: number; occupied: number; available: number }>()
    for (const room of rooms) {
      const b = buildingMap.get(room.building) ?? { totalRooms: 0, totalCapacity: 0, currentOccupancy: 0, occupied: 0, available: 0 }
      b.totalRooms++
      b.totalCapacity += room.roomType.capacity
      b.currentOccupancy += room.currentOccupancy
      if (room.status === 'occupied') b.occupied++
      if (room.status === 'available') b.available++
      buildingMap.set(room.building, b)
    }
    const buildings = Array.from(buildingMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([building, data]) => ({
        building,
        totalRooms: data.totalRooms,
        occupied: data.occupied,
        available: data.available,
        totalCapacity: data.totalCapacity,
        currentOccupancy: data.currentOccupancy,
        occupancyRate: data.totalCapacity > 0 ? Math.round((data.currentOccupancy / data.totalCapacity) * 100) : 0
      }))

    // Aggregate by building + floor
    const floorMap = new Map<string, { totalRooms: number; totalCapacity: number; currentOccupancy: number; occupied: number; available: number; building: string; floor: number }>()
    for (const room of rooms) {
      const key = `${room.building}-${room.floor}`
      const f = floorMap.get(key) ?? { totalRooms: 0, totalCapacity: 0, currentOccupancy: 0, occupied: 0, available: 0, building: room.building, floor: room.floor }
      f.totalRooms++
      f.totalCapacity += room.roomType.capacity
      f.currentOccupancy += room.currentOccupancy
      if (room.status === 'occupied') f.occupied++
      if (room.status === 'available') f.available++
      floorMap.set(key, f)
    }
    const floors = Array.from(floorMap.values())
      .sort((a, b) => a.building.localeCompare(b.building) || a.floor - b.floor)
      .map(data => ({
        building: data.building,
        floor: data.floor,
        totalRooms: data.totalRooms,
        occupied: data.occupied,
        available: data.available,
        totalCapacity: data.totalCapacity,
        currentOccupancy: data.currentOccupancy,
        occupancyRate: data.totalCapacity > 0 ? Math.round((data.currentOccupancy / data.totalCapacity) * 100) : 0
      }))

    const totalCapacity = buildings.reduce((s, b) => s + b.totalCapacity, 0)
    const totalOccupancy = buildings.reduce((s, b) => s + b.currentOccupancy, 0)
    const summary = {
      totalRooms: rooms.length,
      totalCapacity,
      currentOccupancy: totalOccupancy,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0
    }

    return { summary, buildings, floors }
  }
}

export const dashboardService = new DashboardService()
