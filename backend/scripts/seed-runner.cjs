const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPasswordHash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@ktx.edu.vn' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'System Administrator',
      phone: '0123456789',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
      isActive: true
    },
    create: {
      email: 'admin@ktx.edu.vn',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'System Administrator',
      phone: '0123456789',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
      isActive: true
    }
  })

  console.log('Seed completed. Admin: admin@ktx.edu.vn / admin123')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error('Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
