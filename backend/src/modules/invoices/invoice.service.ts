import { PrismaClient, InvoiceStatus, PaymentMethod } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface InvoiceQueryParams {
  page?: number
  limit?: number
  status?: string
  studentId?: string
  roomId?: string
  month?: string
  year?: number
  search?: string
}

interface GenerateInvoiceInput {
  contractId: string
  invoiceMonth: Date
  electricityPrev: number
  electricityCurr: number
  waterPrev: number
  waterCurr: number
  otherFees?: any
  dueDays?: number
}

interface UpdateInvoiceInput {
  status?: InvoiceStatus
  electricityPrice?: number
  waterPrice?: number
  otherFees?: any
  dueDate?: Date
  paymentMethod?: PaymentMethod
  paymentRef?: string
}

class InvoiceService {
  async findAll(params: InvoiceQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = {}

    if (params.search) {
      where.OR = [
        { contract: { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } } },
        { contract: { student: { studentCode: { contains: params.search, mode: 'insensitive' } } } },
        { contract: { room: { roomNumber: { contains: params.search, mode: 'insensitive' } } } }
      ]
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.studentId) {
      where.contract = {
        studentId: params.studentId
      }
    }

    if (params.roomId) {
      where.contract = {
        roomId: params.roomId
      }
    }

    if (params.year && params.month) {
      const startDate = new Date(params.year, parseInt(params.month) - 1, 1)
      const endDate = new Date(params.year, parseInt(params.month), 0, 23, 59, 59)
      where.invoiceMonth = {
        gte: startDate,
        lte: endDate
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          contract: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phone: true
                    }
                  }
                }
              },
              room: {
                include: {
                  roomType: true
                }
              }
            }
          }
        },
        orderBy: { invoiceMonth: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    return {
      invoices,
      page,
      limit,
      total
    }
  }

  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    avatarUrl: true
                  }
                }
              }
            },
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      throw AppError.notFound('Invoice')
    }

    return invoice
  }

  async generateInvoice(data: GenerateInvoiceInput) {
    // Check if contract exists and is active
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        student: true,
        room: {
          include: {
            roomType: true
          }
        }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.status !== 'active') {
      throw AppError.badRequest('Cannot generate invoice for inactive contract')
    }

    // Check if invoice already exists for this month
    const startDate = new Date(data.invoiceMonth.getFullYear(), data.invoiceMonth.getMonth(), 1)
    const endDate = new Date(data.invoiceMonth.getFullYear(), data.invoiceMonth.getMonth() + 1, 0, 23, 59, 59)

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        contractId: data.contractId,
        invoiceMonth: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    if (existingInvoice) {
      throw AppError.conflict('Invoice already exists for this month')
    }

    // Get system configuration for prices
    const electricityPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'electricity_price' }
    })
    const waterPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'water_price' }
    })

    const electricityPrice = parseFloat(electricityPriceConfig?.value || '3500')
    const waterPrice = parseFloat(waterPriceConfig?.value || '20000')
    const dueDays = data.dueDays || 15

    // Calculate amounts
    const electricityUsage = data.electricityCurr - data.electricityPrev
    const waterUsage = data.waterCurr - data.waterPrev
    const electricityAmount = electricityUsage * electricityPrice
    const waterAmount = waterUsage * waterPrice
    const roomFee = contract.monthlyRent.toNumber()

    // Calculate other fees
    let otherFeesTotal = 0
    if (data.otherFees) {
      if (Array.isArray(data.otherFees)) {
        otherFeesTotal = data.otherFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0)
      } else if (typeof data.otherFees === 'object') {
        otherFeesTotal = Object.values(data.otherFees).reduce((sum: number, value: any) => sum + (Number(value) || 0), 0)
      }
    }

    const totalAmount = roomFee + electricityAmount + waterAmount + otherFeesTotal
    const dueDate = new Date(startDate.getTime() + dueDays * 24 * 60 * 60 * 1000)

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        contractId: data.contractId,
        invoiceMonth: data.invoiceMonth,
        roomFee: contract.monthlyRent,
        electricityPrev: data.electricityPrev,
        electricityCurr: data.electricityCurr,
        electricityPrice,
        waterPrev: data.waterPrev,
        waterCurr: data.waterCurr,
        waterPrice,
        otherFees: data.otherFees,
        totalAmount,
        dueDate,
        status: InvoiceStatus.unpaid
      },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    // Create notification for student
    const monthYear = data.invoiceMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const formattedTotal = totalAmount.toLocaleString('vi-VN')
    await prisma.notification.create({
      data: {
        userId: contract.student.userId,
        type: 'invoice_due',
        title: 'New Invoice Available',
        message: `Your invoice for ${monthYear} is now available. Total: ${formattedTotal} VND`,
        referenceId: invoice.id,
        referenceType: 'invoice'
      }
    })

    return invoice
  }

  async generateBatchInvoices(contractIds: string[] | undefined | null, invoiceMonth: Date, dueDays?: number) {
    if (!(invoiceMonth instanceof Date) || Number.isNaN(invoiceMonth.getTime())) {
      throw AppError.badRequest('invoiceMonth không hợp lệ')
    }

    let ids: string[]
    if (contractIds === undefined || contractIds === null) {
      const active = await prisma.contract.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      ids = active.map((c) => c.id)
    } else if (!Array.isArray(contractIds)) {
      throw AppError.badRequest('contractIds phải là mảng')
    } else {
      ids = contractIds
    }

    if (ids.length === 0) {
      return {
        generated: 0,
        skipped: 0,
        invoices: []
      }
    }

    const startDate = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth(), 1)
    const endDate = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth() + 1, 0, 23, 59, 59)
    const monthStr = `${invoiceMonth.getFullYear()}-${String(invoiceMonth.getMonth() + 1).padStart(2, '0')}`

    // Active contracts in scope (all active if contractIds omitted; else subset)
    const contracts = await prisma.contract.findMany({
      where: {
        id: { in: ids },
        status: 'active'
      },
      include: {
        student: true,
        room: {
          include: {
            roomType: true
          }
        },
        _count: {
          select: {
            invoices: {
              where: {
                invoiceMonth: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    })

    // Filter contracts that don't have invoices for this month
    const contractsWithoutInvoice = contracts.filter(c => c._count.invoices === 0)

    if (contractsWithoutInvoice.length === 0) {
      throw AppError.badRequest('All selected contracts already have invoices for this month')
    }

    // Get system configuration
    const electricityPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'electricity_price' }
    })
    const waterPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'water_price' }
    })

    const electricityPrice = parseFloat(electricityPriceConfig?.value || '3500')
    const waterPrice = parseFloat(waterPriceConfig?.value || '20000')
    const dueDaysCount = dueDays || 15
    const dueDate = new Date(startDate.getTime() + dueDaysCount * 24 * 60 * 60 * 1000)

    // Create invoices in batch
    const invoices = await Promise.all(
      contractsWithoutInvoice.map(async (contract) => {
        // Fetch approved meter reading for this room
        const reading = await prisma.meterReading.findUnique({
          where: {
            roomId_month: {
              roomId: contract.roomId,
              month: monthStr
            }
          }
        })

        // If no approved reading, skip this contract
        if (!reading || reading.status !== 'approved') {
          return null
        }

        const electricityPrev = reading.electricityOld.toNumber()
        const electricityCurr = reading.electricityNew.toNumber()
        const waterPrev = reading.waterOld.toNumber()
        const waterCurr = reading.waterNew.toNumber()

        const electricityUsage = electricityCurr - electricityPrev
        const waterUsage = waterCurr - waterPrev
        const electricityAmount = electricityUsage * electricityPrice
        const waterAmount = waterUsage * waterPrice
        const roomFee = contract.monthlyRent.toNumber()
        const totalAmount = roomFee + electricityAmount + waterAmount

        const invoice = await prisma.invoice.create({
          data: {
            contractId: contract.id,
            invoiceMonth,
            roomFee: contract.monthlyRent,
            electricityPrev,
            electricityCurr,
            electricityPrice,
            waterPrev,
            waterCurr,
            waterPrice,
            totalAmount,
            dueDate,
            status: InvoiceStatus.unpaid
          }
        })

        // Create notification
        const monthYearStr = invoiceMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        const totalStr = totalAmount.toLocaleString('vi-VN')
        await prisma.notification.create({
          data: {
            userId: contract.student.userId,
            type: 'invoice_due',
            title: 'New Invoice Available',
            message: `Your invoice for ${monthYearStr} is now available. Total: ${totalStr} VND`,
            referenceId: invoice.id,
            referenceType: 'invoice'
          }
        })

        return invoice
      })
    )

    // Filter out nulls (skipped contracts)
    const generatedInvoices = invoices.filter(inv => inv !== null)

    return {
      generated: generatedInvoices.length,
      skipped: contracts.length - generatedInvoices.length,
      invoices: generatedInvoices
    }
  }

  async update(id: string, data: UpdateInvoiceInput) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            student: true,
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      throw AppError.notFound('Invoice')
    }

    // If status is being changed to paid, require payment method
    if (data.status === InvoiceStatus.paid && !invoice.paymentMethod && !data.paymentMethod) {
      throw AppError.badRequest('Payment method is required when marking as paid')
    }

    // Recalculate total if prices or fees change
    let totalAmount = invoice.totalAmount.toNumber()

    if (data.electricityPrice !== undefined || data.waterPrice !== undefined || data.otherFees !== undefined) {
      const electricityPrice = data.electricityPrice ?? invoice.electricityPrice.toNumber()
      const waterPrice = data.waterPrice ?? invoice.waterPrice.toNumber()

      const electricityUsage = invoice.electricityCurr.toNumber() - invoice.electricityPrev.toNumber()
      const waterUsage = invoice.waterCurr.toNumber() - invoice.waterPrev.toNumber()

      const electricityAmount = electricityUsage * electricityPrice
      const waterAmount = waterUsage * waterPrice

      let otherFeesTotal = 0
      if (data.otherFees) {
        if (Array.isArray(data.otherFees)) {
          otherFeesTotal = data.otherFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0)
        } else if (typeof data.otherFees === 'object') {
          otherFeesTotal = Object.values(data.otherFees).reduce((sum: number, value: any) => sum + (Number(value) || 0), 0)
        }
      } else if (invoice.otherFees) {
        if (Array.isArray(invoice.otherFees)) {
          otherFeesTotal = invoice.otherFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0)
        } else if (typeof invoice.otherFees === 'object') {
          otherFeesTotal = Object.values(invoice.otherFees as any).reduce((sum: number, value: any) => sum + (Number(value) || 0), 0)
        }
      }

      totalAmount = invoice.roomFee.toNumber() + electricityAmount + waterAmount + otherFeesTotal
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        electricityPrice: data.electricityPrice,
        waterPrice: data.waterPrice,
        otherFees: data.otherFees,
        dueDate: data.dueDate,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef,
        paidAt: data.status === InvoiceStatus.paid && !invoice.paidAt ? new Date() : undefined
      },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    return updatedInvoice
  }

  async processPayment(id: string, paymentMethod: PaymentMethod, paymentRef?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      throw AppError.notFound('Invoice')
    }

    if (invoice.status === InvoiceStatus.paid) {
      throw AppError.badRequest('Invoice is already paid')
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.paid,
        paymentMethod,
        paymentRef,
        paidAt: new Date()
      },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    // Create payment confirmation notification
    const paymentAmount = Number(updatedInvoice.totalAmount).toLocaleString('vi-VN')
    await prisma.notification.create({
      data: {
        userId: updatedInvoice.contract.student.userId,
        type: 'invoice_due',
        title: 'Payment Confirmed',
        message: `Your payment of ${paymentAmount} VND has been confirmed. Thank you!`,
        referenceId: updatedInvoice.id,
        referenceType: 'invoice'
      }
    })

    return updatedInvoice
  }

  async getMonthlyStats(year?: number, month?: number) {
    const currentYear = year || new Date().getFullYear()
    const currentMonth = month || new Date().getMonth() + 1

    const startDate = new Date(currentYear, currentMonth - 1, 1)
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    const [total, paid, unpaid, overdue, totalAmount, paidAmount, unpaidAmount] = await Promise.all([
      prisma.invoice.count({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.invoice.count({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          },
          status: InvoiceStatus.paid
        }
      }),
      prisma.invoice.count({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          },
          status: InvoiceStatus.unpaid
        }
      }),
      prisma.invoice.count({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          },
          status: InvoiceStatus.overdue
        }
      }),
      prisma.invoice.aggregate({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.invoice.aggregate({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          },
          status: InvoiceStatus.paid
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.invoice.aggregate({
        where: {
          invoiceMonth: {
            gte: startDate,
            lte: endDate
          },
          status: { in: [InvoiceStatus.unpaid, InvoiceStatus.overdue] }
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Get daily payment stats for the month
    const dailyPayments = await prisma.invoice.groupBy({
      by: ['paidAt'],
      where: {
        invoiceMonth: {
          gte: startDate,
          lte: endDate
        },
        paidAt: {
          not: null
        },
        status: InvoiceStatus.paid
      },
      _sum: {
        totalAmount: true
      },
      orderBy: {
        paidAt: 'asc'
      }
    })

    return {
      period: {
        year: currentYear,
        month: currentMonth,
        startDate,
        endDate
      },
      counts: {
        total,
        paid,
        unpaid,
        overdue,
        collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0
      },
      amounts: {
        total: totalAmount._sum.totalAmount?.toNumber() || 0,
        paid: paidAmount._sum.totalAmount?.toNumber() || 0,
        unpaid: unpaidAmount._sum.totalAmount?.toNumber() || 0,
        paidPercentage: totalAmount._sum.totalAmount ? Math.round((paidAmount._sum.totalAmount?.toNumber() || 0) / totalAmount._sum.totalAmount.toNumber() * 100) : 0
      },
      dailyPayments: dailyPayments.map(dp => ({
        date: dp.paidAt,
        amount: dp._sum.totalAmount?.toNumber() || 0
      }))
    }
  }

  async getStudentSummary(studentId: string) {
    const [unpaidInvoices, overdueInvoices, paidInvoices, totalUnpaid, totalOverdue] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          contract: { studentId },
          status: InvoiceStatus.unpaid,
          dueDate: { gte: new Date() }
        },
        include: {
          contract: {
            include: {
              room: {
                include: {
                  roomType: true
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.invoice.findMany({
        where: {
          contract: { studentId },
          status: { in: [InvoiceStatus.unpaid, InvoiceStatus.overdue] },
          dueDate: { lt: new Date() }
        },
        include: {
          contract: {
            include: {
              room: {
                include: {
                  roomType: true
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.invoice.findMany({
        where: {
          contract: { studentId },
          status: InvoiceStatus.paid
        },
        include: {
          contract: {
            include: {
              room: {
                include: {
                  roomType: true
                }
              }
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        take: 6
      }),
      prisma.invoice.aggregate({
        where: {
          contract: { studentId },
          status: InvoiceStatus.unpaid,
          dueDate: { gte: new Date() }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.invoice.aggregate({
        where: {
          contract: { studentId },
          status: InvoiceStatus.overdue
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Update overdue status for unpaid invoices past due date
    await prisma.invoice.updateMany({
      where: {
        contract: { studentId },
        status: InvoiceStatus.unpaid,
        dueDate: { lt: new Date() }
      },
      data: {
        status: InvoiceStatus.overdue
      }
    })

    return {
      unpaid: {
        count: unpaidInvoices.length,
        total: totalUnpaid._sum.totalAmount?.toNumber() || 0,
        invoices: unpaidInvoices
      },
      overdue: {
        count: overdueInvoices.length,
        total: totalOverdue._sum.totalAmount?.toNumber() || 0,
        invoices: overdueInvoices
      },
      recentPayments: paidInvoices
    }
  }

  async updateOverdueInvoices() {
    const result = await prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.unpaid,
        dueDate: { lt: new Date() }
      },
      data: {
        status: InvoiceStatus.overdue
      }
    })

    return {
      updated: result.count
    }
  }

  async getSummaryStats() {
    const [total, paid, unpaid, overdue, totalAmount, paidAmount, unpaidAmount] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: InvoiceStatus.paid } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.unpaid } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.overdue } }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { status: InvoiceStatus.paid },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.unpaid, InvoiceStatus.overdue] } },
        _sum: { totalAmount: true }
      })
    ])

    return {
      total,
      paid,
      unpaid,
      overdue,
      collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
      totalAmount: totalAmount._sum.totalAmount?.toNumber() || 0,
      paidAmount: paidAmount._sum.totalAmount?.toNumber() || 0,
      unpaidAmount: unpaidAmount._sum.totalAmount?.toNumber() || 0
    }
  }
}

export const invoiceService = new InvoiceService()
