import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class SystemConfigService {
  async getAll() {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    })
    return configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, string>)
  }

  async getByKey(key: string) {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    })
    return config
  }

  async set(key: string, value: string, description?: string) {
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    })
    return config
  }

  async setBatch(configs: { key: string; value: string; description?: string }[]) {
    const results = await Promise.all(
      configs.map(config =>
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { value: config.value, description: config.description },
          create: { key: config.key, value: config.value, description: config.description }
        })
      )
    )
    return results
  }
}

export const systemConfigService = new SystemConfigService()
