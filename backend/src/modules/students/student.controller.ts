import { Request, Response, NextFunction } from 'express'
import { studentService } from './student.service'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { AppError } from '../../common/utils/app-error'

class StudentController {
  getStudents = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      faculty: req.query.faculty as string,
      academicYear: req.query.academicYear ? parseInt(req.query.academicYear as string) : undefined
    }

    const result = await studentService.findAll(params)

    return sendPaginated(
      res,
      result.students,
      params.page,
      params.limit,
      result.total
    )
  }

  getStudentByCode = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.findByCode(req.params.code)
    return sendSuccess(res, student)
  }

  getStudentById = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.findById(req.params.id)
    return sendSuccess(res, student)
  }

  updateStudent = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.update(req.params.id, {
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      gender: req.body.gender,
      hometown: req.body.hometown,
      faculty: req.body.faculty,
      academicYear: req.body.academicYear,
      priorityGroup: req.body.priorityGroup,
      emergencyContact: req.body.emergencyContact
    })
    return sendSuccess(res, student, 'Student updated successfully')
  }

  getStudentContracts = async (req: Request, res: Response, _next: NextFunction) => {
    const contracts = await studentService.getStudentContracts(req.params.id)
    return sendSuccess(res, contracts)
  }

  getStudentInvoices = async (req: Request, res: Response, _next: NextFunction) => {
    const invoices = await studentService.getStudentInvoices(req.params.id)
    return sendSuccess(res, invoices)
  }

  getStudentIncidents = async (req: Request, res: Response, _next: NextFunction) => {
    const incidents = await studentService.getStudentIncidents(req.params.id)
    return sendSuccess(res, incidents)
  }

  getStudentStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await studentService.getStats()
    return sendSuccess(res, stats)
  }

  getMyProfile = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.findByUserId(req.user!.userId)
    if (!student) {
      return sendSuccess(res, null)
    }
    return sendSuccess(res, student)
  }

  getMyContracts = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.findByUserId(req.user!.userId)
    if (!student) {
      return sendSuccess(res, [])
    }
    const contracts = await studentService.getStudentContracts(student.id)
    return sendSuccess(res, contracts)
  }

  updateMyProfile = async (req: Request, res: Response, _next: NextFunction) => {
    const student = await studentService.findByUserId(req.user!.userId)
    if (!student) {
      throw AppError.notFound('Student profile')
    }

    const updated = await studentService.update(student.id, {
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      gender: req.body.gender,
      hometown: req.body.hometown,
      address: req.body.address,
      faculty: req.body.faculty,
      academicYear: req.body.academicYear ? parseInt(req.body.academicYear) : undefined,
      priorityGroup: req.body.priorityGroup,
      emergencyContact: req.body.emergencyContact,
      idCardNumber: req.body.idCardNumber,
      phone: req.body.phone
    })

    return sendSuccess(res, updated, 'Profile updated successfully')
  }
}

export const studentController = new StudentController()
