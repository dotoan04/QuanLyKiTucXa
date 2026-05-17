import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { financialReportController } from './financial-report.controller'

const router = Router()

// All routes require admin or accountant role
router.use(authenticate, requireRole('admin', 'accountant'))

// Generate a financial report for a given month
router.post('/generate', asyncHandler(financialReportController.generate))

// Get monthly stats for sparkline/chart (last N months)
router.get('/stats', asyncHandler(financialReportController.getMonthlyStats))

// Export as CSV
router.get('/export/csv', asyncHandler(financialReportController.exportCsv))

// Export as JSON
router.get('/export/json', asyncHandler(financialReportController.exportJson))

export default router
