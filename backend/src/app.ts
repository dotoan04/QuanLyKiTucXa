import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { rateLimit } from 'express-rate-limit'
import { errorHandler } from './common/middlewares/error.middleware'
import { notFoundHandler } from './common/middlewares/not-found.middleware'
import authRoutes from './modules/auth/auth.routes'
import roomRoutes from './modules/rooms/room.routes'
import studentRoutes from './modules/students/student.routes'
import contractRoutes from './modules/contracts/contract.routes'
import invoiceRoutes from './modules/invoices/invoice.routes'
import incidentRoutes from './modules/incidents/incident.routes'
import chatbotRoutes from './modules/chatbot/chatbot.routes'
import notificationRoutes from './modules/notifications/notification.routes'
import registrationRoutes from './modules/registrations/registrations.routes'
import returnRoutes from './modules/returns/returns.routes'
import renewalRoutes from './modules/renewals/renewals.routes'
import temporaryLeaveRoutes from './modules/temporary-leave/temporary-leave.routes'
import transferRoutes from './modules/transfers/transfers.routes'
import violationRoutes from './modules/violations/violations.routes'
import reconciliationRoutes from './modules/reconciliation/reconciliation.routes'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import directorRoutes from './modules/director/director.routes'
import systemConfigRoutes from './modules/system-config/system-config.routes'
import auditLogRoutes from './modules/audit-log/audit-log.routes'
import maintenanceRoutes from './modules/maintenance/maintenance.routes'
import financialReportRoutes from './modules/financial-report/financial-report.routes'
import meterReadingRoutes from './modules/meter-readings/meter-reading.routes'
import pdfGeneratorRoutes from './modules/pdf-generator/pdf-generator.routes'
import appointmentRoutes from './modules/appointments/appointments.routes'
import paymentQRroutes from './modules/payments/payment-qr.routes'
const app = express()

/** Public URL users open in browser (emails, CORS). Docker: use localhost, not http://frontend:3000 */
function buildAllowedCorsOrigins(): string[] {
  const primary = (process.env.FRONTEND_URL || 'http://localhost:3000').trim()
  const extra = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set([primary, ...extra])]
}

const allowedCorsOrigins = buildAllowedCorsOrigins()

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedCorsOrigins.includes(origin)) return callback(null, origin)
      callback(null, false)
    },
    credentials: true
  })
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
})
app.use('/api/v1', apiLimiter)

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts.' }
})
app.use('/api/v1/auth', authLimiter)

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'KTX Management API is running',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/rooms', roomRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/contracts', contractRoutes)
app.use('/api/v1/invoices', invoiceRoutes)
app.use('/api/v1/incidents', incidentRoutes)
app.use('/api/v1/chatbot', chatbotRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/registrations', registrationRoutes)
app.use('/api/v1/returns', returnRoutes)
app.use('/api/v1/renewals', renewalRoutes)
app.use('/api/v1/temporary-leave', temporaryLeaveRoutes)
app.use('/api/v1/transfers', transferRoutes)
app.use('/api/v1/violations', violationRoutes)
app.use('/api/v1/reconciliation', reconciliationRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/director', directorRoutes)
app.use('/api/v1/system-config', systemConfigRoutes)
app.use('/api/v1/audit-logs', auditLogRoutes)
app.use('/api/v1/maintenance', maintenanceRoutes)
app.use('/api/v1/financial-reports', financialReportRoutes)
app.use('/api/v1/meter-readings', meterReadingRoutes)
app.use('/api/v1/pdf', pdfGeneratorRoutes)
app.use('/api/v1/appointments', appointmentRoutes)
app.use('/api/v1/payments', paymentQRroutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
