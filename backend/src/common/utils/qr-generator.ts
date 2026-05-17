import QRCode from 'qrcode'

export interface BankQRParams {
  bankAccount: string
  bankName: string
  accountName: string
  amount: number
  content: string
}

/**
 * Generate QR code for Vietnam bank transfer
 * Format: |bank_code|bank_number|account_number|amount|message|
 */
export function generateVietQRString(params: BankQRParams): string {
  const bankCodeMap: { [key: string]: string } = {
    'vcb': '970436',
    'vietcombank': '970436',
    'tcb': '970403',
    'techcombank': '970403',
    'mbbank': '970447',
    'mb': '970447',
    'bidv': '970418',
    'acb': '970419',
    'agribank': '970405',
    'sacombank': '970404',
    'vib': '970441',
  }

  // Extract bank code from bank name
  const bankNameLower = params.bankName.toLowerCase().replace(/\s+/g, '')
  const bankCode = bankCodeMap[bankNameLower] || '970436' // Default to Vietcombank

  // Format amount (no decimal points)
  const formattedAmount = Math.round(params.amount).toString()

  // Build QR string in Vietnam format
  // Format: |bank_code|bank_number|account_number|amount|message|
  const qrString = `|${bankCode}|${params.bankName}|${params.bankAccount}|${formattedAmount}|${params.content}|`

  return qrString
}

/**
 * Generate QR code image as data URL
 */
export async function generateQRCodeImage(qrString: string, options?: {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}): Promise<string> {
  return QRCode.toDataURL(qrString, {
    width: options?.width || 256,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  })
}

/**
 * Generate complete QR code for payment
 */
export async function generatePaymentQR(params: BankQRParams): Promise<string> {
  // Use VietQR API directly for a proper Vietnam banking QR code format
  try {
    const bankCodeMap: { [key: string]: string } = {
      'vcb': 'vietcombank',
      'vietcombank': 'vietcombank',
      'tcb': 'techcombank',
      'techcombank': 'techcombank',
      'mbbank': 'mb',
      'mb': 'mb',
      'bidv': 'bidv',
      'acb': 'acb',
      'agribank': 'agribank',
      'sacombank': 'sacombank',
      'vib': 'vib',
      'vtb': 'vietinbank',
      'vietinbank': 'vietinbank',
      'vpbank': 'vpbank',
      'vpb': 'vpbank'
    }

    const bankNameLower = params.bankName.toLowerCase().replace(/\s+/g, '')
    const bankCode = bankCodeMap[bankNameLower] || params.bankName

    const amount = Math.round(params.amount).toString()
    const addInfo = encodeURIComponent(params.content)
    const accountName = encodeURIComponent(params.accountName)
    
    return `https://img.vietqr.io/image/${bankCode}-${params.bankAccount}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`
  } catch (error) {
    const qrString = generateVietQRString(params)
    return generateQRCodeImage(qrString)
  }
}

/**
 * Format transfer content for student payment
 */
export function formatTransferContent(studentCode: string, fullName: string, prefix: string = 'KTX'): string {
  // Remove special characters and limit length
  const cleanName = fullName.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '').trim()
  const content = `${prefix} ${studentCode} ${cleanName}`.substring(0, 50) // Limit to 50 chars
  return content
}
