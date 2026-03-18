"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const director_controller_1 = require("./director.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('director', 'admin'));
router.get('/policies/room-types', (0, async_handler_1.asyncHandler)(director_controller_1.directorController.getRoomTypePolicies));
router.put('/policies/room-types/:id/approve-price', (0, async_handler_1.asyncHandler)(director_controller_1.directorController.approveRoomTypePrice));
router.get('/reports/periodic', (0, async_handler_1.asyncHandler)(director_controller_1.directorController.getPeriodicReport));
router.get('/reports/export', (0, async_handler_1.asyncHandler)(director_controller_1.directorController.exportPeriodicReport));
exports.default = router;
//# sourceMappingURL=director.routes.js.map