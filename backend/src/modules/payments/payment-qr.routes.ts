import { Router } from 'express'
import { paymentQRController } from './payment-qr.controller'
import { authenticate } from '../../common/middlewares/auth.middleware'

const router = Router()

// All payment QR routes require authentication
router.use(authenticate)

// Get QR code for invoice payment
router.get('/qr/invoice/:invoiceId', paymentQRController.getInvoiceQR)

// Get QR code for registration deposit payment
router.get('/qr/registration/:registrationId', paymentQRController.getRegistrationQR)

export default router
