import { Request, Response, NextFunction } from 'express'
import { invoiceService } from './invoice.service'
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response'
import { PaymentMethod } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { auditLogService } from '../audit-log/audit-log.service'

class InvoiceController {
  private parseInvoiceMonth(value: unknown) {
    if (!value) {
      throw AppError.badRequest('Thiếu invoiceMonth')
    }

    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) {
      throw AppError.badRequest('invoiceMonth không hợp lệ. Định dạng hợp lệ: YYYY-MM hoặc ISO date')
    }

    return date
  }

  getCurrentInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const student = await prisma.student.findFirst({
      where: { userId: req.user!.userId }
    })

    if (!student) {
      return sendSuccess(res, null)
    }

    // Get the most recent unpaid/overdue invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        contract: { studentId: student.id },
        status: { in: ['unpaid', 'overdue'] }
      },
      orderBy: { invoiceMonth: 'desc' },
      include: {
        contract: {
          include: {
            room: { include: { roomType: true } }
          }
        }
      }
    })

    return sendSuccess(res, invoice)
  }

  getInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      studentId: req.query.studentId as string,
      roomId: req.query.roomId as string,
      month: req.query.month as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      search: req.query.search as string
    }

    const result = await invoiceService.findAll(params)

    return sendPaginated(
      res,
      result.invoices,
      params.page,
      params.limit,
      result.total
    )
  }

  getInvoiceById = async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await invoiceService.findById(req.params.id)
    return sendSuccess(res, invoice)
  }

  generateInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await invoiceService.generateInvoice({
      contractId: req.body.contractId,
      invoiceMonth: this.parseInvoiceMonth(req.body.invoiceMonth),
      electricityPrev: req.body.electricityPrev,
      electricityCurr: req.body.electricityCurr,
      waterPrev: req.body.waterPrev,
      waterCurr: req.body.waterCurr,
      otherFees: req.body.otherFees,
      dueDays: req.body.dueDays
    })
    return sendCreated(res, invoice, 'Invoice generated successfully')
  }

  generateBatchInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await invoiceService.generateBatchInvoices(
      req.body.contractIds,
      this.parseInvoiceMonth(req.body.invoiceMonth),
      req.body.dueDays
    )
    return sendCreated(res, result, `${result.generated} invoices generated, ${result.skipped} skipped`)
  }

  updateInvoice = async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await invoiceService.update(req.params.id, {
      status: req.body.status,
      electricityPrice: req.body.electricityPrice,
      waterPrice: req.body.waterPrice,
      otherFees: req.body.otherFees,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      paymentMethod: req.body.paymentMethod,
      paymentRef: req.body.paymentRef
    })
    return sendSuccess(res, invoice, 'Invoice updated successfully')
  }

  processPayment = async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await invoiceService.processPayment(
      req.params.id,
      req.body.paymentMethod as PaymentMethod,
      req.body.paymentRef
    )
    auditLogService.create({
      userId: req.user?.userId,
      action: 'pay',
      entity: 'Invoice',
      entityId: req.params.id,
      details: { paymentMethod: req.body.paymentMethod, paymentRef: req.body.paymentRef },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {})
    return sendSuccess(res, invoice, 'Payment processed successfully')
  }

  getMonthlyStats = async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await invoiceService.getMonthlyStats(
      req.query.year ? parseInt(req.query.year as string) : undefined,
      req.query.month ? parseInt(req.query.month as string) : undefined
    )
    return sendSuccess(res, stats)
  }

  getStudentSummary = async (req: Request, res: Response, _next: NextFunction) => {
    const summary = await invoiceService.getStudentSummary(req.params.studentId)
    return sendSuccess(res, summary)
  }

  updateOverdueInvoices = async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await invoiceService.updateOverdueInvoices()
    return sendSuccess(res, result, `${result.updated} invoices updated to overdue status`)
  }

  getMyInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    // Get student ID from authenticated user
    const prisma = (await import('@prisma/client')).PrismaClient
    const client = new prisma()

    const student = await client.student.findFirst({
      where: { userId: req.user!.userId }
    })

    if (!student) {
      return sendSuccess(res, { unpaid: { count: 0, total: 0, invoices: [] }, overdue: { count: 0, total: 0, invoices: [] }, recentPayments: [] })
    }

    const summary = await invoiceService.getStudentSummary(student.id)
    return sendSuccess(res, summary)
  }

  getInvoiceSummary = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await invoiceService.getSummaryStats()
    return sendSuccess(res, stats)
  }
}

export const invoiceController = new InvoiceController()
