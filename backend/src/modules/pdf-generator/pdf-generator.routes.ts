import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { pdfGeneratorController } from './pdf-generator.controller'

const router = Router()

router.use(authenticate)

router.get(
  '/deposit-receipt/:registrationId',
  requireRole('admin', 'staff'),
  asyncHandler(pdfGeneratorController.generateDepositReceipt)
)

router.get(
  '/contract/:contractId',
  requireRole('admin', 'staff', 'student'),
  asyncHandler(pdfGeneratorController.generateContractPdf)
)

export default router
