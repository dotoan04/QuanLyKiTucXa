"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_log_controller_1 = require("./audit-log.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(audit_log_controller_1.auditLogController.getAll));
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(audit_log_controller_1.auditLogController.getById));
router.get('/entity/:entity/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(audit_log_controller_1.auditLogController.getByEntity));
exports.default = router;
//# sourceMappingURL=audit-log.routes.js.map