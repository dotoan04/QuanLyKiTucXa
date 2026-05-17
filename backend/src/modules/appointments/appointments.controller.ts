import { Request, Response, NextFunction } from 'express'
import { appointmentsService } from './appointments.service'
import { sendSuccess, sendCreated } from '../../common/utils/response'

class AppointmentsController {
  /** Sinh viên: lịch hẹn xem phòng của tôi */
  findMine = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.findMineForStudentUser(req.user!.userId)
    return sendSuccess(res, result)
  }

  findAll = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.findAll(req.query as any)
    return sendSuccess(res, result)
  }

  findById = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.findById(req.params.id)
    return sendSuccess(res, result)
  }

  create = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await appointmentsService.create({
      ...req.body,
      createdById: user.userId
    })
    return sendCreated(res, result)
  }

  update = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.update(req.params.id, req.body)
    return sendSuccess(res, result)
  }

  updateItemStatus = async (req: Request, res: Response, _next: NextFunction) => {
    const { id, registrationId } = req.params
    const { status, note } = req.body
    const result = await appointmentsService.updateItemStatus(id, registrationId, status, note)
    return sendSuccess(res, result)
  }

  addRegistrations = async (req: Request, res: Response, _next: NextFunction) => {
    const { registrationIds } = req.body
    const result = await appointmentsService.addRegistrations(req.params.id, registrationIds)
    return sendSuccess(res, result)
  }

  removeRegistration = async (req: Request, res: Response, _next: NextFunction) => {
    await appointmentsService.removeRegistration(req.params.id, req.params.registrationId)
    return sendSuccess(res, { message: 'Removed' })
  }

  complete = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.complete(req.params.id)
    return sendSuccess(res, result)
  }

  cancel = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.cancel(req.params.id)
    return sendSuccess(res, result)
  }

  getPendingRegistrations = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await appointmentsService.getPendingRegistrations(req.query as any)
    return sendSuccess(res, result)
  }
}

export const appointmentsController = new AppointmentsController()
