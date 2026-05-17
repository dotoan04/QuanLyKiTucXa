import { Request, Response, NextFunction } from 'express'
import { generatePaymentQR, formatTransferContent, BankQRParams } from '../../common/utils/qr-generator'
import { PrismaClient } from '@prisma/client'
import { sendSuccess } from '../../common/utils/response'

const prisma = new PrismaClient()

class PaymentQRController {
  /**
   * Get QR code for invoice payment
   * GET /payments/qr/invoice/:invoiceId
   */
  getInvoiceQR = async (req: Request, res: Response, _next: NextFunction) => {
    const invoiceId = req.params.invoiceId

    // Get invoice with contract and student info
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } })
    }

    // Get bank configuration from system config
    const bankConfigs = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'payment_bank_name' } }),
      prisma.systemConfig.findUnique({ where: { key: 'payment_bank_account' } }),
      prisma.systemConfig.findUnique({ where: { key: 'payment_account_name' } }),
    ])

    const bankName = bankConfigs[0]?.value || 'Vietcombank'
    const bankAccount = bankConfigs[1]?.value || '1234567890'
    const accountName = bankConfigs[2]?.value || 'KY TUC XA TRUONG DAI HOC'

    // Generate transfer content
    const transferContent = formatTransferContent(
      invoice.contract.student.studentCode,
      invoice.contract.student.user.fullName
    )

    // QR code parameters
    const qrParams: BankQRParams = {
      bankAccount,
      bankName,
      accountName,
      amount: invoice.totalAmount.toNumber(),
      content: transferContent
    }

    // Generate QR code
    try {
      const qrDataUrl = await generatePaymentQR(qrParams)

      return sendSuccess(res, {
        qrCode: qrDataUrl,
        bankName,
        bankAccount,
        accountName,
        amount: invoice.totalAmount.toNumber(),
        transferContent
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      return res.status(500).json({ error: { message: 'Failed to generate QR code' } })
    }
  }

  /**
   * Get QR code for registration deposit payment
   * GET /payments/qr/registration/:registrationId
   */
  getRegistrationQR = async (req: Request, res: Response, _next: NextFunction) => {
    const registrationId = req.params.registrationId

    // Get registration with student info
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (!registration) {
      return res.status(404).json({ error: { message: 'Registration not found' } })
    }

    if (!registration.depositAmount) {
      return res.status(400).json({ error: { message: 'No deposit amount specified' } })
    }

    // Get bank configuration from system config
    const bankConfigs = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'payment_bank_name' } }),
      prisma.systemConfig.findUnique({ where: { key: 'payment_bank_account' } }),
      prisma.systemConfig.findUnique({ where: { key: 'payment_account_name' } }),
    ])

    const bankName = bankConfigs[0]?.value || 'Vietcombank'
    const bankAccount = bankConfigs[1]?.value || '1234567890'
    const accountName = bankConfigs[2]?.value || 'KY TUC XA TRUONG DAI HOC'

    // Generate transfer content
    const transferContent = formatTransferContent(
      registration.student.studentCode,
      registration.student.user.fullName
    )

    // QR code parameters
    const qrParams: BankQRParams = {
      bankAccount,
      bankName,
      accountName,
      amount: registration.depositAmount.toNumber(),
      content: transferContent
    }

    // Generate QR code
    try {
      const qrDataUrl = await generatePaymentQR(qrParams)

      return sendSuccess(res, {
        qrCode: qrDataUrl,
        bankName,
        bankAccount,
        accountName,
        amount: registration.depositAmount.toNumber(),
        transferContent
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      return res.status(500).json({ error: { message: 'Failed to generate QR code' } })
    }
  }
}

export const paymentQRController = new PaymentQRController()
