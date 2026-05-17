import { PrismaClient, InvoiceStatus, PaymentMethod } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface ReconciliationData {
  month: string
  paymentGateway: string
  transactions: TransactionData[]
}

interface TransactionData {
  transactionId: string
  amount: number
  timestamp: Date
  status: string
  studentCode?: string
  invoiceId?: string
}

interface ReconciliationResult {
  totalTransactions: number
  matched: number
  unmatched: number
  discrepancies: Discrepancy[]
}

interface Discrepancy {
  type: 'missing_in_system' | 'missing_in_gateway' | 'amount_mismatch' | 'status_mismatch'
  transactionId?: string
  invoiceId?: string
  systemAmount?: number
  gatewayAmount?: number
  studentCode?: string
  description: string
}

class ReconciliationService {
  async reconcilePayments(data: ReconciliationData, processedBy: string) {
    const startDate = new Date(data.month + '-01')
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59)

    const systemPayments = await prisma.invoice.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate
        },
        status: InvoiceStatus.paid,
        paymentMethod: this.mapPaymentGateway(data.paymentGateway),
        paymentRef: { not: null }
      },
      include: {
        contract: {
          include: {
            student: {
              select: {
                studentCode: true,
                user: { select: { fullName: true, email: true } }
              }
            }
          }
        }
      }
    })

    const systemTransactionIds = new Set(
      systemPayments
        .filter(p => p.paymentRef)
        .map(p => p.paymentRef)
    )

    const gatewayTransactionIds = new Set(
      data.transactions.map(t => t.transactionId)
    )

    const discrepancies: Discrepancy[] = []
    let matched = 0

    for (const gatewayTx of data.transactions) {
      if (!systemTransactionIds.has(gatewayTx.transactionId)) {
        discrepancies.push({
          type: 'missing_in_system',
          transactionId: gatewayTx.transactionId,
          gatewayAmount: gatewayTx.amount,
          studentCode: gatewayTx.studentCode,
          description: `Transaction ${gatewayTx.transactionId} found in ${data.paymentGateway} but not in system`
        })
      } else {
        const systemPayment = systemPayments.find(p => p.paymentRef === gatewayTx.transactionId)
        if (systemPayment) {
          const systemAmount = systemPayment.totalAmount.toNumber()
          if (Math.abs(systemAmount - gatewayTx.amount) > 1) {
            discrepancies.push({
              type: 'amount_mismatch',
              transactionId: gatewayTx.transactionId,
              invoiceId: systemPayment.id,
              systemAmount,
              gatewayAmount: gatewayTx.amount,
              studentCode: systemPayment.contract.student.studentCode,
              description: `Amount mismatch: System ${systemAmount}, Gateway ${gatewayTx.amount}`
            })
          } else {
            matched++
          }
        }
      }
    }

    for (const systemPayment of systemPayments) {
      if (!gatewayTransactionIds.has(systemPayment.paymentRef ?? '')) {
        discrepancies.push({
          type: 'missing_in_gateway',
          transactionId: systemPayment.paymentRef ?? undefined,
          invoiceId: systemPayment.id,
          systemAmount: systemPayment.totalAmount.toNumber(),
          studentCode: systemPayment.contract.student.studentCode,
          description: `Transaction ${systemPayment.paymentRef} found in system but not in ${data.paymentGateway}`
        })
      }
    }

    const reportData: Record<string, unknown> = {
      totalTransactions: data.transactions.length,
      matched,
      unmatched: discrepancies.length,
      discrepancies: discrepancies as unknown[],
      processedAt: new Date().toISOString(),
      processedBy
    }

    const report = await prisma.reconciliationReport.create({
      data: {
        month: data.month,
        paymentGateway: data.paymentGateway,
        status: 'processed',
        data: reportData as any,
        processedAt: new Date(),
        processedBy,
        notes: `Reconciliation completed. ${matched} matched, ${discrepancies.length} discrepancies found.`
      }
    })

    return {
      reportId: report.id,
      totalTransactions: data.transactions.length,
      matched,
      unmatched: discrepancies.length,
      discrepancies,
      successRate: data.transactions.length > 0 ? Math.round((matched / data.transactions.length) * 100) : 0
    }
  }

  mapPaymentGateway(gateway: string): PaymentMethod {
    const mapping: Record<string, PaymentMethod> = {
      'vnpay': PaymentMethod.vnpay,
      'momo': PaymentMethod.momo,
      'banking': PaymentMethod.transfer
    }
    return mapping[gateway.toLowerCase()] || PaymentMethod.transfer
  }

  async getReconciliationReports(params: { month?: string; gateway?: string; page?: number; limit?: number }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.month) {
      where.month = params.month
    }
    if (params.gateway) {
      where.paymentGateway = params.gateway
    }

    const [reports, total] = await Promise.all([
      prisma.reconciliationReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          processor: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.reconciliationReport.count({ where })
    ])

    return { reports, page, limit, total }
  }

  async getReportDetails(id: string) {
    const report = await prisma.reconciliationReport.findUnique({
      where: { id },
      include: {
        processor: { select: { id: true, fullName: true, email: true } }
      }
    })

    if (!report) {
      throw AppError.notFound('Reconciliation report')
    }

    return report
  }

  async resolveDiscrepancy(reportId: string, discrepancyIndex: number, action: 'confirm' | 'reject', notes: string) {
    const report = await prisma.reconciliationReport.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      throw AppError.notFound('Reconciliation report')
    }

    const data = report.data as any
    if (!data.discrepancies || discrepancyIndex >= data.discrepancies.length) {
      throw AppError.badRequest('Invalid discrepancy index')
    }

    const discrepancy = data.discrepancies[discrepancyIndex]

    if (action === 'confirm' && discrepancy.type === 'missing_in_system') {
      const student = await prisma.student.findFirst({
        where: { studentCode: discrepancy.studentCode },
        include: {
          contracts: {
            where: { status: 'active' },
            take: 1
          }
        }
      })

      if (student && student.contracts[0]) {
        const invoice = await prisma.invoice.findFirst({
          where: {
            contractId: student.contracts[0].id,
            status: InvoiceStatus.unpaid
          },
          orderBy: { dueDate: 'asc' }
        })

        if (invoice) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: InvoiceStatus.paid,
              paymentMethod: this.mapPaymentGateway(report.paymentGateway),
              paymentRef: discrepancy.transactionId,
              paidAt: new Date()
            }
          })
        }
      }
    }

    data.discrepancies[discrepancyIndex].resolved = true
    data.discrepancies[discrepancyIndex].resolutionAction = action
    data.discrepancies[discrepancyIndex].resolutionNotes = notes
    data.discrepancies[discrepancyIndex].resolvedAt = new Date()

    await prisma.reconciliationReport.update({
      where: { id: reportId },
      data: {
        data,
        notes: `${report.notes}\nDiscrepancy ${discrepancyIndex} resolved: ${action}`
      }
    })

    return true
  }

  async getReconciliationStats(month?: string) {
    const where: any = {}
    if (month) {
      where.month = month
    }

    const reports = await prisma.reconciliationReport.findMany({
      where,
      select: {
        data: true,
        paymentGateway: true,
        month: true
      }
    })

    const stats = {
      totalReports: reports.length,
      totalTransactions: 0,
      totalMatched: 0,
      totalDiscrepancies: 0,
      byGateway: {} as Record<string, { total: number; matched: number; discrepancies: number }>
    }

    for (const report of reports) {
      const data = report.data as any
      if (data) {
        stats.totalTransactions += data.totalTransactions || 0
        stats.totalMatched += data.matched || 0
        stats.totalDiscrepancies += data.unmatched || 0

        if (!stats.byGateway[report.paymentGateway]) {
          stats.byGateway[report.paymentGateway] = {
            total: 0,
            matched: 0,
            discrepancies: 0
          }
        }
        stats.byGateway[report.paymentGateway].total += data.totalTransactions || 0
        stats.byGateway[report.paymentGateway].matched += data.matched || 0
        stats.byGateway[report.paymentGateway].discrepancies += data.unmatched || 0
      }
    }

    stats.totalMatched = Math.round(stats.totalMatched)
    stats.totalDiscrepancies = Math.round(stats.totalDiscrepancies)

    return stats
  }
}

export const reconciliationService = new ReconciliationService()
