"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractController = void 0;
const contract_service_1 = require("./contract.service");
const response_1 = require("../../common/utils/response");
class ContractController {
    getContracts = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            status: req.query.status,
            studentId: req.query.studentId,
            roomId: req.query.roomId,
            search: req.query.search
        };
        const result = await contract_service_1.contractService.findAll(params);
        return (0, response_1.sendPaginated)(res, result.contracts, params.page, params.limit, result.total);
    };
    getContractById = async (req, res, _next) => {
        const contract = await contract_service_1.contractService.findById(req.params.id);
        return (0, response_1.sendSuccess)(res, contract);
    };
    createContract = async (req, res, _next) => {
        const contract = await contract_service_1.contractService.create({
            studentId: req.body.studentId,
            roomId: req.body.roomId,
            startDate: new Date(req.body.startDate),
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            monthlyRent: req.body.monthlyRent,
            depositAmount: req.body.depositAmount,
            contractPdfUrl: req.body.contractPdfUrl,
            approvedBy: req.user.userId
        });
        return (0, response_1.sendCreated)(res, contract, 'Contract created successfully');
    };
    updateContract = async (req, res, _next) => {
        const contract = await contract_service_1.contractService.update(req.params.id, {
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            status: req.body.status,
            monthlyRent: req.body.monthlyRent,
            depositAmount: req.body.depositAmount,
            contractPdfUrl: req.body.contractPdfUrl,
            approvedBy: req.body.approvedBy
        });
        return (0, response_1.sendSuccess)(res, contract, 'Contract updated successfully');
    };
    terminateContract = async (req, res, _next) => {
        const contract = await contract_service_1.contractService.terminate(req.params.id, req.body.terminationReason, req.user.userId);
        return (0, response_1.sendSuccess)(res, contract, 'Contract terminated successfully');
    };
    getContractStats = async (_req, res, _next) => {
        const stats = await contract_service_1.contractService.getStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
    // ==================== ASSET HANDOVER ENDPOINTS ====================
    createHandover = async (req, res, _next) => {
        const handover = await contract_service_1.contractService.createHandover(req.params.id, req.user.userId, req.body.items);
        return (0, response_1.sendCreated)(res, handover, 'Bàn giao tài sản đã được ghi nhận');
    };
    getHandover = async (req, res, _next) => {
        const handover = await contract_service_1.contractService.getHandover(req.params.id);
        return (0, response_1.sendSuccess)(res, handover);
    };
    // ==================== REGISTRATION REQUEST ENDPOINTS ====================
    createRegistrationRequest = async (req, res, _next) => {
        const registration = await contract_service_1.contractService.createRegistrationRequest({
            studentId: req.body.studentId,
            preferredRoomTypeId: req.body.preferredRoomTypeId,
            preferredRoomId: req.body.preferredRoomId,
            desiredStartDate: new Date(req.body.desiredStartDate)
        });
        return (0, response_1.sendCreated)(res, registration, 'Registration request submitted successfully');
    };
    getRegistrationRequests = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            status: req.query.status,
            search: req.query.search
        };
        const result = await contract_service_1.contractService.getRegistrationRequests(params);
        return (0, response_1.sendPaginated)(res, result.requests, params.page, params.limit, result.total);
    };
    approveRegistrationRequest = async (req, res, _next) => {
        const result = await contract_service_1.contractService.approveRegistrationRequest(req.params.id, req.body.roomId, req.user.userId, req.body.reviewNote);
        return (0, response_1.sendSuccess)(res, result, 'Registration approved successfully');
    };
    rejectRegistrationRequest = async (req, res, _next) => {
        const result = await contract_service_1.contractService.rejectRegistrationRequest(req.params.id, req.user.userId, req.body.reviewNote);
        return (0, response_1.sendSuccess)(res, result, 'Registration rejected successfully');
    };
}
exports.contractController = new ContractController();
//# sourceMappingURL=contract.controller.js.map