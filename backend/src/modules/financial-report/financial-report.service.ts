import { PrismaClient, InvoiceStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

export interface FinancialReportSummary {
  month: string           // YYYY-MM
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  overdueInvoices: number
  totalRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
  roomRentRevenue: number
  electricityRevenue: number
  waterRevenue: number
  otherRevenue: number
  collectionRate: number  // percentage
}

class FinancialReportService {
  async generateReport(month: string, generatedBy: string) {
    // month format: YYYY-MM
    const [year, mon] = month.split('-').map(Number)
    if (!year || !mon || mon < 1 || mon > 12) {
      throw AppError.badRequest('Định dạng tháng không hợp lệ. Dùng YYYY-MM')
    }

    const startDate = new Date(year, mon - 1, 1)
    const endDate = new Date(year, mon, 0, 23, 59, 59)

    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceMonth: { gte: startDate, lte: endDate }
      },
      include: {
        contract: {
          include: {
            room: {
              include: { roomType: { select: { name: true } } }
            },
            student: {
              select: {
                studentCode: true,
                user: { select: { fullName: true, email: true } }
              }
            }
          }
        }
      },
      orderBy: { invoiceMonth: 'asc' }
    })

    const summary = this._buildSummary(month, invoices)
    const reportData = {
      month,
      generatedAt: new Date().toISOString(),
      generatedBy,
      summary,
      items: invoices.map((inv) => {
        const elecUsage = Number(inv.electricityCurr) - Number(inv.electricityPrev)
        const elecAmount = elecUsage * Number(inv.electricityPrice)
        const waterUsage = Number(inv.waterCurr) - Number(inv.waterPrev)
        const waterAmount = waterUsage * Number(inv.waterPrice)
        const otherFeesTotal = this._sumOtherFees(inv.otherFees)
        return {
          id: inv.id,
          invoiceMonth: inv.invoiceMonth,
          studentCode: inv.contract.student.studentCode,
          studentName: inv.contract.student.user.fullName,
          studentEmail: inv.contract.student.user.email,
          room: `${inv.contract.room.building}${inv.contract.room.roomNumber}`,
          building: inv.contract.room.building,
          roomType: inv.contract.room.roomType.name,
          roomRent: Number(inv.roomFee),
          electricity: elecAmount,
          water: waterAmount,
          otherFees: otherFeesTotal,
          totalAmount: Number(inv.totalAmount),
          status: inv.status,
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          paymentMethod: inv.paymentMethod,
          paymentRef: inv.paymentRef
        }
      })
    }

    // Save report to system_config as a lightweight store (or return directly)
    // We store in a FinancialReport record if the table exists, otherwise return data
    return reportData
  }

  private _sumOtherFees(otherFees: any): number {
    if (!otherFees) return 0
    if (typeof otherFees === 'number') return otherFees
    if (Array.isArray(otherFees)) {
      return otherFees.reduce((s: number, f: any) => s + (Number(f.amount) || 0), 0)
    }
    if (typeof otherFees === 'object') {
      return Object.values(otherFees).reduce((s: number, v: any) => s + (Number(v) || 0), 0)
    }
    return 0
  }

  private _buildSummary(month: string, invoices: any[]): FinancialReportSummary {
    const total = invoices.length
    const paid = invoices.filter((i) => i.status === InvoiceStatus.paid)
    const unpaid = invoices.filter((i) => i.status === InvoiceStatus.unpaid)
    const overdue = invoices.filter((i) => i.status === InvoiceStatus.overdue)

    const totalRevenue = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
    const collectedRevenue = paid.reduce((s, i) => s + Number(i.totalAmount), 0)
    const outstandingRevenue = [...unpaid, ...overdue].reduce((s, i) => s + Number(i.totalAmount), 0)

    const roomRentRevenue = invoices.reduce((s, i) => s + Number(i.roomFee), 0)
    const electricityRevenue = invoices.reduce((s, i) => {
      const usage = Number(i.electricityCurr) - Number(i.electricityPrev)
      return s + usage * Number(i.electricityPrice)
    }, 0)
    const waterRevenue = invoices.reduce((s, i) => {
      const usage = Number(i.waterCurr) - Number(i.waterPrev)
      return s + usage * Number(i.waterPrice)
    }, 0)
    const otherRevenue = invoices.reduce((s, i) => s + this._sumOtherFees(i.otherFees), 0)

    return {
      month,
      totalInvoices: total,
      paidInvoices: paid.length,
      unpaidInvoices: unpaid.length,
      overdueInvoices: overdue.length,
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      roomRentRevenue,
      electricityRevenue,
      waterRevenue,
      otherRevenue,
      collectionRate: totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0
    }
  }

  async getMonthlyStats(months: number = 12) {
    const results: FinancialReportSummary[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const mon = d.getMonth() + 1
      const month = `${year}-${String(mon).padStart(2, '0')}`
      const startDate = new Date(year, mon - 1, 1)
      const endDate = new Date(year, mon, 0, 23, 59, 59)

      const invoices = await prisma.invoice.findMany({
        where: { invoiceMonth: { gte: startDate, lte: endDate } },
        select: {
          status: true,
          totalAmount: true,
          roomFee: true,
          electricityPrev: true,
          electricityCurr: true,
          electricityPrice: true,
          waterPrev: true,
          waterCurr: true,
          waterPrice: true,
          otherFees: true
        }
      })

      results.push(this._buildSummary(month, invoices))
    }

    return results
  }

  async exportCsv(month: string) {
    const report = await this.generateReport(month, 'system')
    const header = [
      'ID hóa đơn',
      'Tháng',
      'Mã SV',
      'Tên sinh viên',
      'Phòng',
      'Tòa nhà',
      'Loại phòng',
      'Tiền phòng',
      'Tiền điện',
      'Tiền nước',
      'Phí khác',
      'Tổng tiền',
      'Trạng thái',
      'Hạn thanh toán',
      'Ngày thanh toán',
      'Phương thức'
    ].join(',')

    const rows = report.items.map((item) => [
      item.id,
      item.invoiceMonth ? new Date(item.invoiceMonth).toISOString().slice(0, 7) : '',
      item.studentCode,
      `"${item.studentName}"`,
      item.room,
      item.building,
      `"${item.roomType}"`,
      item.roomRent,
      item.electricity,
      item.water,
      item.otherFees,
      item.totalAmount,
      item.status,
      item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
      item.paidAt ? new Date(item.paidAt).toISOString().slice(0, 10) : '',
      item.paymentMethod || ''
    ].join(','))

    return [header, ...rows].join('\n')
  }
}

export const financialReportService = new FinancialReportService()
