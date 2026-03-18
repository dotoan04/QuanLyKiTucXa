"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigController = void 0;
const system_config_service_1 = require("./system-config.service");
const response_1 = require("../../common/utils/response");
class SystemConfigController {
    getAll = async (req, res, _next) => {
        const configs = await system_config_service_1.systemConfigService.getAll();
        return (0, response_1.sendSuccess)(res, configs);
    };
    getByKey = async (req, res, _next) => {
        const { key } = req.params;
        const config = await system_config_service_1.systemConfigService.getByKey(key);
        return (0, response_1.sendSuccess)(res, config);
    };
    set = async (req, res, _next) => {
        const { key } = req.params;
        const { value, description } = req.body;
        const config = await system_config_service_1.systemConfigService.set(key, value, description);
        return (0, response_1.sendSuccess)(res, config);
    };
    setBatch = async (req, res, _next) => {
        const configs = req.body;
        const result = await system_config_service_1.systemConfigService.setBatch(configs);
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.systemConfigController = new SystemConfigController();
//# sourceMappingURL=system-config.controller.js.map