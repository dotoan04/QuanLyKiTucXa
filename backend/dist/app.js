"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = require("express-rate-limit");
const error_middleware_1 = require("./common/middlewares/error.middleware");
const not_found_middleware_1 = require("./common/middlewares/not-found.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const room_routes_1 = __importDefault(require("./modules/rooms/room.routes"));
const student_routes_1 = __importDefault(require("./modules/students/student.routes"));
const contract_routes_1 = __importDefault(require("./modules/contracts/contract.routes"));
const invoice_routes_1 = __importDefault(require("./modules/invoices/invoice.routes"));
const incident_routes_1 = __importDefault(require("./modules/incidents/incident.routes"));
const chatbot_routes_1 = __importDefault(require("./modules/chatbot/chatbot.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const registrations_routes_1 = __importDefault(require("./modules/registrations/registrations.routes"));
const returns_routes_1 = __importDefault(require("./modules/returns/returns.routes"));
const renewals_routes_1 = __importDefault(require("./modules/renewals/renewals.routes"));
const temporary_leave_routes_1 = __importDefault(require("./modules/temporary-leave/temporary-leave.routes"));
const transfers_routes_1 = __importDefault(require("./modules/transfers/transfers.routes"));
const violations_routes_1 = __importDefault(require("./modules/violations/violations.routes"));
const reconciliation_routes_1 = __importDefault(require("./modules/reconciliation/reconciliation.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const director_routes_1 = __importDefault(require("./modules/director/director.routes"));
const system_config_routes_1 = __importDefault(require("./modules/system-config/system-config.routes"));
const audit_log_routes_1 = __importDefault(require("./modules/audit-log/audit-log.routes"));
const maintenance_routes_1 = __importDefault(require("./modules/maintenance/maintenance.routes"));
const financial_report_routes_1 = __importDefault(require("./modules/financial-report/financial-report.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/v1', apiLimiter);
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts.' }
});
app.use('/api/v1/auth', authLimiter);
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'KTX Management API is running',
        timestamp: new Date().toISOString()
    });
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/rooms', room_routes_1.default);
app.use('/api/v1/students', student_routes_1.default);
app.use('/api/v1/contracts', contract_routes_1.default);
app.use('/api/v1/invoices', invoice_routes_1.default);
app.use('/api/v1/incidents', incident_routes_1.default);
app.use('/api/v1/chatbot', chatbot_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/registrations', registrations_routes_1.default);
app.use('/api/v1/returns', returns_routes_1.default);
app.use('/api/v1/renewals', renewals_routes_1.default);
app.use('/api/v1/temporary-leave', temporary_leave_routes_1.default);
app.use('/api/v1/transfers', transfers_routes_1.default);
app.use('/api/v1/violations', violations_routes_1.default);
app.use('/api/v1/reconciliation', reconciliation_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/director', director_routes_1.default);
app.use('/api/v1/system-config', system_config_routes_1.default);
app.use('/api/v1/audit-logs', audit_log_routes_1.default);
app.use('/api/v1/maintenance', maintenance_routes_1.default);
app.use('/api/v1/financial-reports', financial_report_routes_1.default);
app.use(not_found_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map