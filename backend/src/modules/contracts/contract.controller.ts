import { Request, Response, NextFunction } from 'express'
import { contractService } from './contract.service'
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response'
import { auditLogService } from '../audit-log/audit-log.service'

function logAction(
  req: Request,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  auditLogService.create({
    userId: req.user?.userId,
    action,
    entity,
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(() => {})
}

class ContractController {
  getContracts = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      studentId: req.query.studentId as string,
      roomId: req.query.roomId as string,
      search: req.query.search as string
    }

    const result = await contractService.findAll(params)

    return sendPaginated(
      res,
      result.contracts,
      params.page,
      params.limit,
      result.total
    )
  }

  getContractById = async (req: Request, res: Response, _next: NextFunction) => {
    const contract = await contractService.findById(req.params.id)
    return sendSuccess(res, contract)
  }

  createContract = async (req: Request, res: Response, _next: NextFunction) => {
    const contract = await contractService.create({
      studentId: req.body.studentId,
      roomId: req.body.roomId,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      monthlyRent: req.body.monthlyRent,
      depositAmount: req.body.depositAmount,
      contractPdfUrl: req.body.contractPdfUrl,
      approvedBy: req.user!.userId
    })
    logAction(req, 'create', 'Contract', contract.id, { studentId: req.body.studentId, roomId: req.body.roomId })
    return sendCreated(res, contract, 'Contract created successfully')
  }

  updateContract = async (req: Request, res: Response, _next: NextFunction) => {
    const contract = await contractService.update(req.params.id, {
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      status: req.body.status,
      monthlyRent: req.body.monthlyRent,
      depositAmount: req.body.depositAmount,
      contractPdfUrl: req.body.contractPdfUrl,
      approvedBy: req.body.approvedBy
    })
    logAction(req, 'update', 'Contract', req.params.id, req.body)
    return sendSuccess(res, contract, 'Contract updated successfully')
  }

  terminateContract = async (req: Request, res: Response, _next: NextFunction) => {
    const contract = await contractService.terminate(
      req.params.id,
      req.body.terminationReason,
      req.user!.userId
    )
    logAction(req, 'terminate', 'Contract', req.params.id, { reason: req.body.terminationReason })
    return sendSuccess(res, contract, 'Contract terminated successfully')
  }

  getContractStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await contractService.getStats()
    return sendSuccess(res, stats)
  }

  // ==================== ASSET HANDOVER ENDPOINTS ====================

  createHandover = async (req: Request, res: Response, _next: NextFunction) => {
    const handover = await contractService.createHandover(
      req.params.id,
      req.user!.userId,
      req.body.items
    )
    logAction(req, 'create', 'AssetHandover', handover.id, { contractId: req.params.id })
    return sendCreated(res, handover, 'Bàn giao tài sản đã được ghi nhận')
  }

  getHandover = async (req: Request, res: Response, _next: NextFunction) => {
    const handover = await contractService.getHandover(req.params.id)
    return sendSuccess(res, handover)
  }

  updateHandover = async (req: Request, res: Response, _next: NextFunction) => {
    const handover = await contractService.updateHandover(req.params.id, {
      items: req.body.items,
      electricityInitial: req.body.electricityInitial,
      waterInitial: req.body.waterInitial,
      electricityPhoto: req.body.electricityPhoto,
      waterPhoto: req.body.waterPhoto,
      roomPhotos: req.body.roomPhotos,
      notes: req.body.notes
    })
    logAction(req, 'update', 'AssetHandover', handover.id, { contractId: req.params.id })
    return sendSuccess(res, handover, 'Cập nhật bàn giao thành công')
  }

  completeHandover = async (req: Request, res: Response, _next: NextFunction) => {
    const handover = await contractService.completeHandover(req.params.id, req.user!.userId)
    logAction(req, 'complete', 'AssetHandover', handover.id, { contractId: req.params.id })
    return sendSuccess(res, handover, 'Hoàn tất bàn giao phòng thành công')
  }

  getPendingHandovers = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string
    }
    const result = await contractService.getPendingHandovers(params)
    return sendPaginated(res, result.handovers, params.page, params.limit, result.total)
  }

  // ==================== REGISTRATION REQUEST ENDPOINTS ====================

  createRegistrationRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const registration = await contractService.createRegistrationRequest({
      studentId: req.body.studentId,
      preferredRoomTypeId: req.body.preferredRoomTypeId,
      preferredRoomId: req.body.preferredRoomId,
      desiredStartDate: new Date(req.body.desiredStartDate)
    })
    logAction(req, 'create', 'RegistrationRequest', registration.id, { studentId: req.body.studentId })
    return sendCreated(res, registration, 'Registration request submitted successfully')
  }

  getRegistrationRequests = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      search: req.query.search as string
    }

    const result = await contractService.getRegistrationRequests(params)

    return sendPaginated(
      res,
      result.requests,
      params.page,
      params.limit,
      result.total
    )
  }

  approveRegistrationRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await contractService.approveRegistrationRequest(
      req.params.id,
      req.body.roomId,
      req.user!.userId,
      req.body.reviewNote
    )
    logAction(req, 'approve', 'RegistrationRequest', req.params.id, { roomId: req.body.roomId })
    return sendSuccess(res, result, 'Registration approved successfully')
  }

  rejectRegistrationRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await contractService.rejectRegistrationRequest(
      req.params.id,
      req.user!.userId,
      req.body.reviewNote
    )
    logAction(req, 'reject', 'RegistrationRequest', req.params.id, { reason: req.body.reviewNote })
    return sendSuccess(res, result, 'Registration rejected successfully')
  }
}

export const contractController = new ContractController()
