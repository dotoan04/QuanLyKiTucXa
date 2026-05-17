import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBankConfig() {
  console.log('🏦 Cấu hình thông tin ngân hàng...')

  // Bank configuration
  const bankConfigs = [
    {
      key: 'payment_bank_name',
      value: 'VpBank',
      description: 'Tên ngân hàng nhận thanh toán'
    },
    {
      key: 'payment_bank_account',
      value: '0359092788',
      description: 'Số tài khoản ngân hàng nhận thanh toán'
    },
    {
      key: 'payment_account_name',
      value: 'KY TUC XA TRUONG DAI HOC',
      description: 'Tên chủ tài khoản ngân hàng'
    }
  ]

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
    console.log(`✅ Đã cấu hình: ${config.key} = ${config.value}`)
  }

  console.log('🎉 Hoàn tất cấu hình ngân hàng!')
}

seedBankConfig()
  .catch((error) => {
    console.error('❌ Lỗi khi cấu hình ngân hàng:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
