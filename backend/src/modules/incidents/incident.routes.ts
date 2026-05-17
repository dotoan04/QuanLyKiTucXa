import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { incidentController } from './incident.controller'

const router = Router()

router.use(authenticate)

router.get('/stats/summary', requireRole('admin', 'staff', 'technician'), incidentController.getIncidentStats)
router.get('/stats', requireRole('admin', 'staff', 'technician'), incidentController.getIncidentStats)
router.get('/my-incidents', incidentController.getMyIncidents)

router.get('/', requireRole('admin', 'staff', 'technician'), incidentController.getIncidents)
router.get('/:id', incidentController.getIncidentById)
router.post('/', incidentController.createIncident)
router.put('/:id', incidentController.updateIncident)
router.put('/:id/assign', requireRole('admin', 'staff', 'technician'), incidentController.assignIncident)
router.put('/:id/status', requireRole('admin', 'staff', 'technician'), incidentController.updateIncidentStatus)
router.put('/:id/resolve', requireRole('admin', 'staff', 'technician'), incidentController.resolveIncident)
router.delete('/:id', requireRole('admin'), incidentController.deleteIncident)

export default router
