import { Request, Response, NextFunction } from 'express'
import { validate as isUuid } from 'uuid'
import { pdfGeneratorService } from './pdf-generator.service'
import { AppError } from '../../common/utils/app-error'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class PdfGeneratorController {
  generateDepositReceipt = async (req: Request, res: Response, _next: NextFunction) => {
    const { registrationId } = req.params

    if (!registrationId || !isUuid(registrationId)) {
      throw AppError.badRequest('registrationId phải là UUID hợp lệ')
    }

    const registration = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true,
        assignedRoom: true
      }
    })

    if (!registration) {
      throw AppError.notFound('Registration request')
    }

    if (!registration.assignedRoom) {
      throw AppError.badRequest('Chưa phân phòng, không thể tạo phiếu thu')
    }

    const qrContent = pdfGeneratorService.generateQrContent(
      'COC',
      registration.id,
      registration.student.studentCode,
      registration.depositAmount?.toNumber() || 0
    )

    const pdfBuffer = await pdfGeneratorService.generateDepositReceipt({
      receiptCode: `PT-${registration.id.slice(0, 8).toUpperCase()}`,
      studentName: registration.student.user.fullName,
      studentCode: registration.student.studentCode,
      roomNumber: registration.assignedRoom.roomNumber,
      building: registration.assignedRoom.building,
      roomTypeName: registration.preferredRoomType.name,
      depositAmount: registration.depositAmount?.toNumber() || 0,
      monthlyRent: registration.preferredRoomType.monthlyPrice.toNumber(),
      durationMonths: registration.desiredDuration || 12,
      startDate: registration.desiredStartDate,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      qrContent,
      ktxName: 'Ký Túc Xá Đại Học ABC',
      ktxAddress: '123 Đường XYZ, Quận 1, TP.HCM',
      ktxPhone: '(028) 1234 5678'
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="phieu-thu-${registration.student.studentCode}.pdf"`)
    res.send(pdfBuffer)
  }

  generateContractPdf = async (req: Request, res: Response, _next: NextFunction) => {
    const { contractId } = req.params

    if (!contractId || !isUuid(contractId)) {
      throw AppError.badRequest('contractId phải là UUID hợp lệ')
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: { include: { user: true } },
        room: { include: { roomType: true } },
        assetHandover: true
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    const pdfBuffer = await pdfGeneratorService.generateContractPdf({
      contractCode: `HD-${contract.id.slice(0, 8).toUpperCase()}`,
      studentName: contract.student.user.fullName,
      studentCode: contract.student.studentCode,
      idCardNumber: contract.student.idCardNumber || '',
      studentPhone: contract.student.user.phone || '',
      studentFaculty: contract.student.faculty || '',
      roomNumber: contract.room.roomNumber,
      building: contract.room.building,
      roomTypeName: contract.room.roomType.name,
      capacity: contract.room.roomType.capacity,
      startDate: contract.startDate,
      endDate: contract.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      monthlyRent: contract.monthlyRent.toNumber(),
      depositAmount: contract.depositAmount.toNumber(),
      electricityInitial: contract.assetHandover?.electricityInitial?.toNumber(),
      waterInitial: contract.assetHandover?.waterInitial?.toNumber(),
      amenities: (contract.assetHandover?.items as any[]) || [],
      ktxName: 'Ký Túc Xá Đại Học ABC',
      ktxAddress: '123 Đường XYZ, Quận 1, TP.HCM',
      ktxRepresentative: 'Nguyễn Văn A',
      ktxPhone: '(028) 1234 5678'
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="hop-dong-${contract.student.studentCode}.pdf"`)
    res.send(pdfBuffer)
  }
}

export const pdfGeneratorController = new PdfGeneratorController()
