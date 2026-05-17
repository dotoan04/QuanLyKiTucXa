import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { contractController } from './contract.controller'

const router = Router()

router.use(authenticate)

router.get('/stats/summary', requireRole('admin', 'staff', 'accountant'), contractController.getContractStats)
router.get('/stats', requireRole('admin', 'staff', 'accountant'), contractController.getContractStats)

router.get('/registrations', requireRole('admin', 'staff'), contractController.getRegistrationRequests)
router.post('/registrations', requireRole('student'), contractController.createRegistrationRequest)
router.put('/registrations/:id/approve', requireRole('admin', 'staff'), contractController.approveRegistrationRequest)
router.put('/registrations/:id/reject', requireRole('admin', 'staff'), contractController.rejectRegistrationRequest)

router.get('/', requireRole('admin', 'staff', 'accountant'), contractController.getContracts)
router.get('/:id', requireRole('admin', 'staff', 'accountant'), contractController.getContractById)
router.post('/', requireRole('admin', 'staff'), contractController.createContract)
router.put('/:id', requireRole('admin', 'staff'), contractController.updateContract)
router.put('/:id/terminate', requireRole('admin', 'staff'), contractController.terminateContract)

router.get('/handover/pending', requireRole('admin', 'staff', 'technician'), contractController.getPendingHandovers)
router.post('/:id/handover', requireRole('admin', 'staff', 'technician'), contractController.createHandover)
router.get('/:id/handover', contractController.getHandover)
router.put('/:id/handover', requireRole('admin', 'staff', 'technician'), contractController.updateHandover)
router.post('/:id/handover/complete', requireRole('admin', 'staff', 'technician'), contractController.completeHandover)

export default router
