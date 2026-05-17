import PDFDocument from 'pdfkit'
import { Decimal } from '@prisma/client/runtime/library'
import * as fs from 'fs'
import * as path from 'path'

interface DepositReceiptInput {
  receiptCode: string
  studentName: string
  studentCode: string
  roomNumber: string
  building: string
  roomTypeName: string
  depositAmount: number
  monthlyRent: number
  durationMonths: number
  startDate: Date
  deadline: Date
  qrContent: string
  ktxName: string
  ktxAddress: string
  ktxPhone: string
}

interface ContractPdfInput {
  contractCode: string
  studentName: string
  studentCode: string
  idCardNumber: string
  studentPhone: string
  studentFaculty: string
  roomNumber: string
  building: string
  roomTypeName: string
  capacity: number
  startDate: Date
  endDate: Date
  monthlyRent: number
  depositAmount: number
  electricityInitial?: number
  waterInitial?: number
  amenities: Array<{ name: string; condition: string; note?: string }>
  ktxName: string
  ktxAddress: string
  ktxRepresentative: string
  ktxPhone: string
}

const FONT_PATHS = [
  // Windows - regular fonts that support Vietnamese
  'C:/Windows/Fonts/arial.ttf',
  'C:/Windows/Fonts/tahoma.ttf',
  'C:/Windows/Fonts/verdana.ttf',
  // Linux (Docker)
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  // macOS
  '/Library/Fonts/Arial.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
]

function findFontPath(): string | null {
  for (const p of FONT_PATHS) {
    if (fs.existsSync(p)) return p
  }
  return null
}

class PdfGeneratorService {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  generateQrContent(prefix: string, id: string, code: string, amount: number): string {
    return `${prefix}-${id.slice(0, 8)}-${code}`
  }

  private registerFont(doc: InstanceType<typeof PDFDocument>) {
    const fontPath = findFontPath()
    if (fontPath) {
      doc.registerFont('VNFont', fontPath)
      doc.registerFont('VNFont-Bold', fontPath)
    }
  }

  private font(doc: InstanceType<typeof PDFDocument>, bold = false): string {
    try {
      return bold ? 'VNFont-Bold' : 'VNFont'
    } catch {
      return bold ? 'Helvetica-Bold' : 'Helvetica'
    }
  }

  async generateDepositReceipt(input: DepositReceiptInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      this.registerFont(doc)
      const buffers: Buffer[] = []
      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100

      // Header
      doc.rect(40, 30, pageWidth + 20, 70).fill('#10b981')
      doc.fillColor('#ffffff')
      doc.fontSize(20).font(this.font(doc, true))
      doc.text(input.ktxName, 50, 45, { width: pageWidth, align: 'center' })
      doc.fontSize(10).font(this.font(doc))
      doc.text(input.ktxAddress, 50, 72, { width: pageWidth, align: 'center' })
      doc.text(`Tel: ${input.ktxPhone}`, 50, 86, { width: pageWidth, align: 'center' })

      // Title
      doc.fillColor('#111827')
      doc.moveDown(2)
      doc.fontSize(16).font(this.font(doc, true))
      doc.text('PHIẾU THU TIỀN CỌC', { align: 'center' })
      doc.moveDown(0.3)
      doc.fontSize(11).font(this.font(doc))
      doc.text(`Mã phiếu: ${input.receiptCode}`, { align: 'center' })

      doc.moveDown(1)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(0.8)

      // Student info section
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('THÔNG TIN SINH VIÊN')
      doc.moveDown(0.5)

      const infoY = doc.y
      doc.font(this.font(doc)).fontSize(11).fillColor('#4b5563')
      doc.text('Họ và tên:', 50, infoY)
      doc.font(this.font(doc, true)).text(input.studentName, 160, infoY)
      doc.font(this.font(doc)).text('MSSV:', 50, infoY + 20)
      doc.font(this.font(doc, true)).text(input.studentCode, 160, infoY + 20)
      doc.font(this.font(doc)).text('Phòng:', 50, infoY + 40)
      doc.font(this.font(doc, true)).text(`${input.roomNumber} - Tòa ${input.building} (${input.roomTypeName})`, 160, infoY + 40)

      doc.moveDown(2)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(0.8)

      // Payment details
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('THÔNG TIN THANH TOÁN')
      doc.moveDown(0.5)

      const detailY = doc.y
      doc.font(this.font(doc)).fontSize(11).fillColor('#4b5563')
      doc.text('Tiền cọc cần đóng:', 50, detailY)
      doc.font(this.font(doc, true)).fillColor('#dc2626').fontSize(14)
      doc.text(this.formatCurrency(input.depositAmount), 220, detailY - 2)

      doc.fillColor('#4b5563').font(this.font(doc)).fontSize(11)
      doc.text('Tiền phòng/tháng:', 50, detailY + 28)
      doc.font(this.font(doc, true)).text(this.formatCurrency(input.monthlyRent), 220, detailY + 28)

      doc.font(this.font(doc)).fillColor('#4b5563')
      doc.text('Thời hạn nộp:', 50, detailY + 56)
      doc.font(this.font(doc, true)).text(this.formatDate(input.deadline), 220, detailY + 56)

      doc.font(this.font(doc)).fillColor('#4b5563')
      doc.text('Ngày bắt đầu thuê:', 50, detailY + 84)
      doc.font(this.font(doc, true)).text(this.formatDate(input.startDate), 220, detailY + 84)

      doc.moveDown(4.5)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(0.8)

      // QR Code section
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('THÔNG TIN CHUYỂN KHOẢN')
      doc.moveDown(0.5)

      doc.font(this.font(doc)).fontSize(11).fillColor('#4b5563')
      doc.text('Nội dung chuyển khoản:', 50, doc.y)
      doc.moveDown(0.3)
      doc.font(this.font(doc, true)).fontSize(12).fillColor('#1f2937')
      doc.text(input.qrContent, 50, doc.y, { width: pageWidth - 20 })
      doc.moveDown(1)

      doc.font(this.font(doc)).fontSize(10).fillColor('#6b7280')
      doc.text('Vui lòng dùng ứng dụng ngân hàng để quét mã QR hoặc chuyển khoản trực tiếp.', 50, doc.y, { width: pageWidth })
      doc.moveDown(0.3)
      doc.text('Dùng nội dung chuyển khoản chính xác để hệ thống tự động xác nhận.', 50, doc.y, { width: pageWidth })

      // Footer
      doc.moveDown(2)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(1)

      const footerY = doc.y
      doc.font(this.font(doc)).fontSize(10).fillColor('#6b7280')
      doc.text(`Ngày tạo: ${this.formatDate(new Date())}`, 50, footerY, { width: pageWidth / 2, align: 'center' })
      doc.text('Đại diện KTX', 50 + pageWidth / 2, footerY, { width: pageWidth / 2, align: 'center' })

      doc.moveDown(2)
      const signY = doc.y
      doc.text('Sinh viên', 50 + pageWidth / 4 - 50, signY, { width: 120, align: 'center' })
      doc.text('Ký, ghi rõ họ tên', 50 + pageWidth / 4 - 50, signY + 16, { width: 120, align: 'center', lineBreak: false })

      doc.text('Quản lý KTX', 50 + 3 * pageWidth / 4 - 50, signY, { width: 120, align: 'center' })
      doc.text('Ký, ghi rõ họ tên', 50 + 3 * pageWidth / 4 - 50, signY + 16, { width: 120, align: 'center', lineBreak: false })

      doc.end()
    })
  }

  async generateContractPdf(input: ContractPdfInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 }
      })

      this.registerFont(doc)
      const buffers: Buffer[] = []
      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100

      // Header
      doc.rect(40, 25, pageWidth + 20, 60).fill('#2563eb')
      doc.fillColor('#ffffff')
      doc.fontSize(18).font(this.font(doc, true))
      doc.text('HỢP ĐỒNG THUÊ PHÒNG KÝ TÚC XÁ', 50, 38, { width: pageWidth, align: 'center' })
      doc.fontSize(10).font(this.font(doc))
      doc.text(`${input.ktxName} - ${input.ktxAddress}`, 50, 60, { width: pageWidth, align: 'center' })

      // Contract code
      doc.fillColor('#111827')
      doc.moveDown(1.5)
      doc.fontSize(11).font(this.font(doc))
      doc.text(`Mã hợp đồng: ${input.contractCode}`, { align: 'right' })

      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(0.8)

      // Parties
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('BÊN A: ĐẠI DIỆN KÝ TÚC XÁ')
      doc.font(this.font(doc)).fontSize(11).fillColor('#4b5563')
      doc.text(`- Đơn vị: ${input.ktxName}`, 60)
      doc.text(`- Địa chỉ: ${input.ktxAddress}`, 60)
      doc.text(`- Tel: ${input.ktxPhone}`, 60)
      doc.text(`- Đại diện: ${input.ktxRepresentative}`, 60)

      doc.moveDown(0.8)
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('BÊN B: SINH VIÊN THUÊ PHÒNG')
      doc.font(this.font(doc)).fontSize(11).fillColor('#4b5563')
      doc.text(`- Họ và tên: ${input.studentName}`, 60)
      doc.text(`- MSSV: ${input.studentCode}`, 60)
      doc.text(`- CCCD: ${input.idCardNumber || 'Chưa cập nhật'}`, 60)
      doc.text(`- SDT: ${input.studentPhone || 'Chưa cập nhật'}`, 60)
      doc.text(`- Khoa: ${input.studentFaculty || 'Chưa cập nhật'}`, 60)

      doc.moveDown(0.8)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(0.8)

      // Room Info
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('THÔNG TIN PHÒNG THUÊ')
      doc.moveDown(0.5)

      const roomTableTop = doc.y
      const colWidths = [140, 140, pageWidth - 280]
      const rowHeight = 22

      doc.rect(50, roomTableTop, pageWidth, rowHeight * 6).stroke('#9ca3af')

      const roomRows = [
        ['Số phòng', `${input.roomNumber} - Tòa ${input.building}`],
        ['Loại phòng', input.roomTypeName],
        ['Sức chứa', `${input.capacity} người`],
        ['Thời gian thuê', `${this.formatDate(input.startDate)} - ${this.formatDate(input.endDate)}`],
        ['Giá thuê', this.formatCurrency(input.monthlyRent) + '/tháng'],
        ['Tiền cọc', this.formatCurrency(input.depositAmount)]
      ]

      roomRows.forEach((row, i) => {
        const y = roomTableTop + i * rowHeight
        doc.moveTo(50, y + rowHeight).lineTo(50 + pageWidth, y + rowHeight).stroke('#9ca3af')
        doc.moveTo(190, y).lineTo(190, y + rowHeight * 6).stroke('#9ca3af')

        doc.font(this.font(doc, true)).fontSize(10).fillColor('#374151')
        doc.text(row[0], 55, y + 6, { width: colWidths[0] - 10 })
        doc.font(this.font(doc)).fillColor('#4b5563')
        doc.text(row[1], 195, y + 6, { width: colWidths[1] - 10 })
      })

      doc.y = roomTableTop + rowHeight * 6 + 12

      // Meter readings
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('CHỈ SỐ BAN ĐẦU KHI VÀO Ở')
      doc.moveDown(0.5)

      const hasReadings = input.electricityInitial !== undefined || input.waterInitial !== undefined

      const meterTableTop = doc.y
      doc.rect(50, meterTableTop, pageWidth, rowHeight * 2).stroke('#9ca3af')
      doc.moveTo(190, meterTableTop).lineTo(190, meterTableTop + rowHeight * 2).stroke('#9ca3af')
      doc.moveTo(meterTableTop, meterTableTop + rowHeight).lineTo(meterTableTop + pageWidth, meterTableTop + rowHeight).stroke('#9ca3af')

      doc.font(this.font(doc, true)).fontSize(10).fillColor('#374151')
      doc.text('Chỉ số điện', 55, meterTableTop + 6)
      doc.font(this.font(doc)).fillColor('#4b5563')
      doc.text(hasReadings && input.electricityInitial !== undefined ? `${input.electricityInitial} kWh` : 'Chưa ghi (chờ bàn giao)', 195, meterTableTop + 6)

      doc.font(this.font(doc, true)).fillColor('#374151')
      doc.text('Chỉ số nước', 55, meterTableTop + rowHeight + 6)
      doc.font(this.font(doc)).fillColor('#4b5563')
      doc.text(hasReadings && input.waterInitial !== undefined ? `${input.waterInitial} m3` : 'Chưa ghi (chờ bàn giao)', 195, meterTableTop + rowHeight + 6)

      doc.y = meterTableTop + rowHeight * 2 + 12

      // Amenity Checklist
      if (input.amenities && input.amenities.length > 0) {
        doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
        doc.text('TÌNH TRẠNG CSVC KHI BÀN GIAO')
        doc.moveDown(0.5)

        const amenTableTop = doc.y
        const amenRowH = 18
        const totalH = amenRowH * (input.amenities.length + 1)

        doc.rect(50, amenTableTop, pageWidth, totalH).stroke('#9ca3af')

        // Header row
        doc.font(this.font(doc, true)).fontSize(9).fillColor('#374151')
        doc.text('Hạng mục', 55, amenTableTop + 5, { width: 100 })
        doc.text('Tình trạng', 160, amenTableTop + 5, { width: 80 })
        doc.text('Ghi chú', 240, amenTableTop + 5, { width: pageWidth - 190 })

        doc.moveTo(50, amenTableTop + amenRowH).lineTo(50 + pageWidth, amenTableTop + amenRowH).stroke('#9ca3af')

        const conditionLabels: Record<string, string> = { good: 'Tốt', fair: 'Bình thường', poor: 'Kém' }
        input.amenities.forEach((item, i) => {
          const y = amenTableTop + (i + 1) * amenRowH
          if (i < input.amenities.length - 1) {
            doc.moveTo(50, y + amenRowH).lineTo(50 + pageWidth, y + amenRowH).stroke('#e5e7eb')
          }
          doc.font(this.font(doc)).fontSize(9).fillColor('#4b5563')
          doc.text(item.name, 55, y + 4, { width: 100 })
          doc.text(conditionLabels[item.condition] || item.condition, 160, y + 4, { width: 80 })
          doc.text(item.note || '-', 240, y + 4, { width: pageWidth - 190 })
        })

        doc.y = amenTableTop + totalH + 12
      }

      // Terms
      doc.fontSize(12).font(this.font(doc, true)).fillColor('#374151')
      doc.text('ĐIỀU KHOẢN')
      doc.moveDown(0.5)

      const terms = [
        '1. Thanh toán tiền phòng hàng tháng trước ngày 15 hàng tháng.',
        '2. Đơn giá điện, nước áp dụng theo quy định của KTX.',
        '3. Tuân thủ nội quy KTX, không sử dụng thiết bị trái phép.',
        '4. Bảo quản CSVC phòng, bồi thường nếu làm hư hỏng.',
        '5. Hợp đồng chấm dứt khi hết hạn hoặc vi phạm nghiêm trọng nội quy.',
        '6. Tiền cọc được hoàn trả sau khi trả phòng và thanh toán hết các khoản.'
      ]

      doc.font(this.font(doc)).fontSize(10).fillColor('#4b5563')
      terms.forEach(term => {
        doc.text(term, 60, doc.y, { width: pageWidth - 20 })
        doc.moveDown(0.2)
      })

      // Signatures
      doc.moveDown(2)
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#d1d5db')
      doc.moveDown(1)

      const signY = doc.y
      doc.font(this.font(doc, true)).fontSize(10).fillColor('#374151')
      doc.text('BÊN A: ĐẠI DIỆN KTX', 50, signY, { width: pageWidth / 2, align: 'center' })
      doc.text('BÊN B: SINH VIÊN', 50 + pageWidth / 2, signY, { width: pageWidth / 2, align: 'center' })

      doc.moveDown(3)
      const sigY = doc.y
      doc.font(this.font(doc)).fontSize(10).fillColor('#6b7280')
      doc.text('Ký, ghi rõ họ tên', 50, sigY, { width: pageWidth / 2, align: 'center' })
      doc.text('Ký, ghi rõ họ tên', 50 + pageWidth / 2, sigY, { width: pageWidth / 2, align: 'center' })

      doc.moveDown(0.5)
      doc.font(this.font(doc, true)).fontSize(11).fillColor('#111827')
      doc.text(input.ktxRepresentative, 50, doc.y, { width: pageWidth / 2, align: 'center' })
      doc.text(input.studentName, 50 + pageWidth / 2, doc.y, { width: pageWidth / 2, align: 'center' })

      doc.end()
    })
  }
}

export const pdfGeneratorService = new PdfGeneratorService()
