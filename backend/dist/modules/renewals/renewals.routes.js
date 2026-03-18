"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const renewals_controller_1 = require("./renewals.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/expiring', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), renewals_controller_1.renewalController.getExpiringContracts);
router.post('/reminders', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), renewals_controller_1.renewalController.sendReminders);
router.get('/:contractId/eligibility', auth_middleware_1.authenticate, renewals_controller_1.renewalController.checkEligibility);
router.get('/:contractId/history', auth_middleware_1.authenticate, renewals_controller_1.renewalController.getHistory);
router.post('/', auth_middleware_1.authenticate, renewals_controller_1.renewalController.renewContract);
exports.default = router;
//# sourceMappingURL=renewals.routes.js.map