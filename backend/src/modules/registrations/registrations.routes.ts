import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { registrationController } from './registrations.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

const uploadDir = path.join(process.cwd(), 'uploads', 'registrations')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype.split('/')[1]) || file.mimetype === 'application/pdf'
    if (ext || mime) cb(null, true)
    else cb(new Error('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF) và tài liệu (PDF, DOC, DOCX). Tối đa 10MB.'))
  }
})

// Multer error handler middleware
function handleMulterError(err: Error, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File quá lớn. Tối đa 10MB.' } })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, error: { code: 'TOO_MANY_FILES', message: 'Quá nhiều file. Tối đa 5 tài liệu.' } })
    }
    return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } })
  }
  if (err.message.includes('Chỉ hỗ trợ') || err.message.includes('10MB')) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_FILE_TYPE', message: err.message } })
  }
  next(err)
}

// Student routes — đăng ký gửi JSON (link minh chứng Google Drive), không upload file server
router.get(
  '/room-types',
  authenticate,
  requireRole('student'),
  asyncHandler(registrationController.getRoomTypesForRegistration)
)
router.get(
  '/available',
  authenticate,
  requireRole('student'),
  asyncHandler(registrationController.getAvailableRooms)
)
router.post('/', authenticate, requireRole('student'), asyncHandler(registrationController.create))
router.get('/my', authenticate, asyncHandler(registrationController.getMyRegistrations))
router.post('/:id/cancel', authenticate, requireRole('student'), asyncHandler(registrationController.cancelByStudent))
router.post('/:id/upload-payment', authenticate, requireRole('student'), (req, res, next) => {
  upload.single('paymentProof')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, asyncHandler(registrationController.uploadPaymentProof))

// Admin/Staff routes
router.get(
  '/assignable-rooms',
  authenticate,
  requireRole('admin', 'staff'),
  asyncHandler(registrationController.getAssignableRooms)
)
router.get('/stats', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(registrationController.getStats))
router.get('/', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(registrationController.getAll))
router.get('/:id', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(registrationController.getById))
router.post('/:id/approve', authenticate, requireRole('admin', 'staff'), asyncHandler(registrationController.approve))
router.post('/:id/reject', authenticate, requireRole('admin', 'staff'), asyncHandler(registrationController.reject))
router.post('/:id/confirm-deposit', authenticate, requireRole('accountant'), asyncHandler(registrationController.confirmDeposit))
router.post('/:id/reject-deposit', authenticate, requireRole('accountant'), asyncHandler(registrationController.rejectDeposit))
router.post('/:id/confirm-payment', authenticate, requireRole('admin', 'staff'), asyncHandler(registrationController.confirmPayment))
router.post('/:id/cancel-by-staff', authenticate, requireRole('admin', 'staff'), asyncHandler(registrationController.cancelByStaff))

export default router
