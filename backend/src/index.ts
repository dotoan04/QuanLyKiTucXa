import 'dotenv/config'
import app from './app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📚 API available at http://localhost:${PORT}/api/v1`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  console.log('👋 Server shut down gracefully')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  console.log('👋 Server shut down gracefully')
  process.exit(0)
})

startServer()
