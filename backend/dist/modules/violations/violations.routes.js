"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const violations_controller_1 = require("./violations.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.create));
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.getAll));
router.get('/student/:studentId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.getStudentHistory));
router.get('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.getById));
router.put('/:id/process', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.process));
router.post('/:id/appeal', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(violations_controller_1.violationController.appeal));
exports.default = router;
//# sourceMappingURL=violations.routes.js.map