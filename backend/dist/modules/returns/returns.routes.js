"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const returns_controller_1 = require("./returns.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.createReturnRequest));
router.get('/my', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.getMyReturnRequests));
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.getAllReturnRequests));
router.get('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.getReturnRequestById));
router.post('/:id/schedule', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.scheduleInspection));
router.post('/:id/complete', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.completeInspection));
router.post('/:id/refund', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.processRefund));
router.delete('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(returns_controller_1.returnController.cancelReturnRequest));
exports.default = router;
//# sourceMappingURL=returns.routes.js.map