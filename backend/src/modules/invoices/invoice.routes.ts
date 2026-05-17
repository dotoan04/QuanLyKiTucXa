import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { invoiceController } from './invoice.controller'

const router = Router()

router.use(authenticate)

router.get('/stats/summary', requireRole('admin', 'staff', 'accountant', 'director'), invoiceController.getInvoiceSummary)
router.get('/stats/monthly', requireRole('admin', 'staff', 'accountant', 'director'), invoiceController.getMonthlyStats)
router.get('/students/:studentId/summary', requireRole('admin', 'staff', 'accountant'), invoiceController.getStudentSummary)
router.get('/my-invoices', invoiceController.getMyInvoices)
router.get('/current', invoiceController.getCurrentInvoice)

router.get('/', requireRole('admin', 'staff', 'accountant'), invoiceController.getInvoices)
router.get('/:id', requireRole('admin', 'staff', 'accountant'), invoiceController.getInvoiceById)
router.post('/generate', requireRole('admin', 'staff', 'accountant'), invoiceController.generateInvoice)
router.post('/generate-batch', requireRole('admin', 'staff', 'accountant'), invoiceController.generateBatchInvoices)
router.put('/:id', requireRole('admin', 'staff', 'accountant'), invoiceController.updateInvoice)
router.post('/:id/payment', requireRole('admin', 'staff', 'accountant'), invoiceController.processPayment)

router.put('/overdue/update', requireRole('admin', 'accountant'), invoiceController.updateOverdueInvoices)

export default router
