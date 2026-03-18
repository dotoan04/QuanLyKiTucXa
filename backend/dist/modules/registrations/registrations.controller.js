"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationController = void 0;
const response_1 = require("../../common/utils/response");
const registrations_service_1 = require("./registrations.service");
class RegistrationController {
    // Get all registration requests with pagination and filters
    getAll = async (req, res, _next) => {
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            status: req.query.status,
            studentId: req.query.studentId,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const result = await registrations_service_1.registrationService.findAll(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    // Get registration request by ID
    getById = async (req, res, _next) => {
        const { id } = req.params;
        const result = await registrations_service_1.registrationService.findById(id);
        return (0, response_1.sendSuccess)(res, result);
    };
    // Create new registration request (student submits)
    create = async (req, res, _next) => {
        const user = req.user;
        // Get the student record linked to this user
        const result = await registrations_service_1.registrationService.createForUser(req.body, user.userId);
        return (0, response_1.sendCreated)(res, result, 'Đăng ký phòng thành công');
    };
    // Get available rooms for registration
    getAvailableRooms = async (req, res, _next) => {
        const params = {
            roomTypeId: req.query.roomTypeId,
            building: req.query.building,
            genderRestriction: req.query.genderRestriction
        };
        const result = await registrations_service_1.registrationService.getAvailableRooms(params.roomTypeId, params.building, params.genderRestriction);
        return (0, response_1.sendSuccess)(res, result);
    };
    // Get my registrations (for student)
    getMyRegistrations = async (req, res, _next) => {
        const user = req.user;
        const result = await registrations_service_1.registrationService.getMyRegistrationsByUserId(user.userId);
        return (0, response_1.sendSuccess)(res, result);
    };
    // Approve registration request (for admin/staff)
    approve = async (req, res, _next) => {
        const { id } = req.params;
        const user = req.user;
        const data = { registrationId: id, ...req.body };
        const result = await registrations_service_1.registrationService.approve(data, user.userId);
        return (0, response_1.sendSuccess)(res, result, 'Đã duyệt đăng ký thành công');
    };
    // Reject registration request (for admin/staff)
    reject = async (req, res, _next) => {
        const { id } = req.params;
        const user = req.user;
        const data = { registrationId: id, ...req.body };
        await registrations_service_1.registrationService.reject(data, user.userId);
        return (0, response_1.sendSuccess)(res, null, 'Đã từ chối đăng ký');
    };
    // Get statistics
    getStats = async (req, res, _next) => {
        const stats = await registrations_service_1.registrationService.getStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
}
exports.registrationController = new RegistrationController();
//# sourceMappingURL=registrations.controller.js.map