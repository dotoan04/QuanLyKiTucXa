"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api/v1`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('👋 Server shut down gracefully');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    console.log('👋 Server shut down gracefully');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map