/**
 * Script cài đặt thông tin ngân hàng cho hệ thống
 * Chạy: npm run setup-bank-config
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupBankConfig() {
  console.log('🏦 Thiết lập thông tin ngân hàng cho hệ thống...\n')

  const bankConfigs = [
    {
      key: 'payment_bank_name',
      value: 'VpBank',
      description: 'Tên ngân hàng nhận thanh toán',
      note: 'Có thể thay đổi: VpBank, Techcombank, MB Bank, BIDV, v.v.'
    },
    {
      key: 'payment_bank_account',
      value: '0359092788',
      description: 'Số tài khoản ngân hàng nhận thanh toán',
      note: 'Số tài khoản thực tế của ký túc xá'
    },
    {
      key: 'payment_account_name',
      value: 'KY TUC XA TRUONG DAI HOC',
      description: 'Tên chủ tài khoản ngân hàng',
      note: 'Tên chính xác trên tài khoản ngân hàng'
    }
  ]

  console.log('Thông tin sẽ được cấu hình:')
  console.log('=========================================')

  for (const config of bankConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description
      },
      create: {
        key: config.key,
        value: config.value,
        description: config.description
      }
    })
    console.log(`✓ ${config.description}:`)
    console.log(`  Giá trị: ${config.value}`)
    console.log(`  Lưu ý: ${config.note}`)
    console.log('-----------------------------------------')
  }

  console.log('\n✅ Hoàn tất cấu hình thông tin ngân hàng!')
  console.log('\n📝 Các bước tiếp theo:')
  console.log('   1. Kiểm tra và cập nhật thông tin ngân hàng nếu cần')
  console.log('   2. Chạy backend để khởi tạo API QR code')
  console.log('   3. Sinh viên có thể quét QR để thanh toán')
}

setupBankConfig()
  .catch((error) => {
    console.error('\n❌ Lỗi khi thiết lập cấu hình:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
