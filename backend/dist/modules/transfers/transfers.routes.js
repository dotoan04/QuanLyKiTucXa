"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transfers_controller_1 = require("./transfers.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.createTransferRequest));
router.get('/my', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.getMyTransfers));
router.get('/fee', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.getTransferFee));
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.getAllTransfers));
router.put('/:id/process', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.processTransfer));
router.delete('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(transfers_controller_1.transferController.cancelTransfer));
exports.default = router;
//# sourceMappingURL=transfers.routes.js.map