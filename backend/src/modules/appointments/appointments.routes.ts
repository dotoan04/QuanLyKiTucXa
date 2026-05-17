import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { appointmentsController } from './appointments.controller'

const router = Router()

router.use(authenticate)

router.get('/my', requireRole('student'), asyncHandler(appointmentsController.findMine))

router.use(requireRole('admin', 'staff'))

router.get('/', asyncHandler(appointmentsController.findAll))
router.get('/pending-registrations', asyncHandler(appointmentsController.getPendingRegistrations))
router.get('/:id', asyncHandler(appointmentsController.findById))

router.post('/', asyncHandler(appointmentsController.create))
router.put('/:id', asyncHandler(appointmentsController.update))
router.post('/:id/registrations', asyncHandler(appointmentsController.addRegistrations))
router.delete('/:id/registrations/:registrationId', asyncHandler(appointmentsController.removeRegistration))
router.put('/:id/items/:registrationId/status', asyncHandler(appointmentsController.updateItemStatus))
router.post('/:id/complete', asyncHandler(appointmentsController.complete))
router.post('/:id/cancel', asyncHandler(appointmentsController.cancel))

export default router
