"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const system_config_controller_1 = require("./system-config.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(system_config_controller_1.systemConfigController.getAll));
router.get('/:key', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(system_config_controller_1.systemConfigController.getByKey));
router.put('/:key', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(system_config_controller_1.systemConfigController.set));
router.post('/batch', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(system_config_controller_1.systemConfigController.setBatch));
exports.default = router;
//# sourceMappingURL=system-config.routes.js.map