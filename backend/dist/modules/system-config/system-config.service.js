"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SystemConfigService {
    async getAll() {
        const configs = await prisma.systemConfig.findMany({
            orderBy: { key: 'asc' }
        });
        return configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {});
    }
    async getByKey(key) {
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });
        return config;
    }
    async set(key, value, description) {
        const config = await prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });
        return config;
    }
    async setBatch(configs) {
        const results = await Promise.all(configs.map(config => prisma.systemConfig.upsert({
            where: { key: config.key },
            update: { value: config.value, description: config.description },
            create: { key: config.key, value: config.value, description: config.description }
        })));
        return results;
    }
}
exports.systemConfigService = new SystemConfigService();
//# sourceMappingURL=system-config.service.js.map