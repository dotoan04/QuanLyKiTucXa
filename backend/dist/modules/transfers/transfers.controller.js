"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferController = void 0;
const response_1 = require("../../common/utils/response");
const transfers_service_1 = require("./transfers.service");
class TransferController {
    createTransferRequest = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await transfers_service_1.transferService.createTransferRequest(req.body, userId);
        return (0, response_1.sendCreated)(res, result, 'Transfer request created successfully');
    };
    getMyTransfers = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await transfers_service_1.transferService.getMyTransfers(userId);
        return (0, response_1.sendSuccess)(res, result);
    };
    getAllTransfers = async (req, res, _next) => {
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            status: req.query.status
        };
        const result = await transfers_service_1.transferService.getAllTransfers(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    processTransfer = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await transfers_service_1.transferService.processTransfer(req.body, userId);
        return (0, response_1.sendSuccess)(res, result, 'Transfer processed successfully');
    };
    cancelTransfer = async (req, res, _next) => {
        const { id } = req.params;
        const userId = req.user.userId;
        await transfers_service_1.transferService.cancelTransfer(id, userId);
        return (0, response_1.sendSuccess)(res, null, 'Transfer cancelled');
    };
    getTransferFee = async (req, res, _next) => {
        const { fromRoomId, toRoomId } = req.query;
        const result = await transfers_service_1.transferService.getTransferFee(fromRoomId, toRoomId);
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.transferController = new TransferController();
//# sourceMappingURL=transfers.controller.js.map