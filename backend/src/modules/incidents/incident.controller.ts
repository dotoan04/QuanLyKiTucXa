import { Request, Response, NextFunction } from 'express'
import { incidentService } from './incident.service'
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response'
import { IncidentCategory, IncidentPriority, IncidentStatus } from '@prisma/client'

class IncidentController {
  getIncidents = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      category: req.query.category as string,
      priority: req.query.priority as string,
      reporterId: req.query.reporterId as string,
      assignedTo: req.query.assignedTo as string,
      roomId: req.query.roomId as string,
      search: req.query.search as string
    }

    const result = await incidentService.findAll(params)

    return sendPaginated(
      res,
      result.incidents,
      params.page,
      params.limit,
      result.total
    )
  }

  getIncidentById = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.findById(req.params.id)
    return sendSuccess(res, incident)
  }

  createIncident = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.create({
      reporterId: req.user!.userId,
      roomId: req.body.roomId,
      category: req.body.category as IncidentCategory,
      title: req.body.title,
      description: req.body.description,
      images: req.body.images,
      priority: req.body.priority as IncidentPriority
    })
    return sendCreated(res, incident, 'Incident reported successfully')
  }

  updateIncident = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.update(req.params.id, {
      category: req.body.category as IncidentCategory,
      title: req.body.title,
      description: req.body.description,
      images: req.body.images,
      priority: req.body.priority as IncidentPriority
    })
    return sendSuccess(res, incident, 'Incident updated successfully')
  }

  assignIncident = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.assignIncident(
      req.params.id,
      req.body.assignedTo,
      req.user!.userId
    )
    return sendSuccess(res, incident, 'Incident assigned successfully')
  }

  updateIncidentStatus = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.updateStatus(
      req.params.id,
      req.body.status as IncidentStatus,
      req.user!.userId
    )
    return sendSuccess(res, incident, 'Incident status updated successfully')
  }

  resolveIncident = async (req: Request, res: Response, _next: NextFunction) => {
    const incident = await incidentService.resolveIncident(
      req.params.id,
      req.body.resolutionNote,
      req.user!.userId
    )
    return sendSuccess(res, incident, 'Incident resolved successfully')
  }

  deleteIncident = async (req: Request, res: Response, _next: NextFunction) => {
    await incidentService.deleteIncident(req.params.id)
    return sendSuccess(res, null, 'Incident deleted successfully')
  }

  getIncidentStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await incidentService.getStats()
    return sendSuccess(res, stats)
  }

  getMyIncidents = async (req: Request, res: Response, _next: NextFunction) => {
    const incidents = await incidentService.getMyIncidents(req.user!.userId)
    return sendSuccess(res, incidents)
  }
}

export const incidentController = new IncidentController()
