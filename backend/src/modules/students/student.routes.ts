import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { studentController } from './student.controller'

const router = Router()

router.use(authenticate)

router.get('/stats/summary', studentController.getStudentStats)
router.get('/stats', studentController.getStudentStats)
router.get('/me', studentController.getMyProfile)
router.put('/me', studentController.updateMyProfile)
router.get('/my-contracts', studentController.getMyContracts)

router.get('/by-code/:code', requireRole('admin', 'staff', 'accountant'), studentController.getStudentByCode)
router.get('/:id/contracts', requireRole('admin', 'staff', 'accountant'), studentController.getStudentContracts)
router.get('/:id/invoices', requireRole('admin', 'staff', 'accountant'), studentController.getStudentInvoices)
router.get('/:id/incidents', requireRole('admin', 'staff'), studentController.getStudentIncidents)

router.get('/', requireRole('admin', 'staff', 'accountant'), studentController.getStudents)
router.get('/:id', requireRole('admin', 'staff', 'accountant'), studentController.getStudentById)
router.put('/:id', requireRole('admin', 'staff'), studentController.updateStudent)

export default router
