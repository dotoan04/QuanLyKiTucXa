"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentController = void 0;
const incident_service_1 = require("./incident.service");
const response_1 = require("../../common/utils/response");
class IncidentController {
    getIncidents = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            status: req.query.status,
            category: req.query.category,
            priority: req.query.priority,
            reporterId: req.query.reporterId,
            assignedTo: req.query.assignedTo,
            roomId: req.query.roomId,
            search: req.query.search
        };
        const result = await incident_service_1.incidentService.findAll(params);
        return (0, response_1.sendPaginated)(res, result.incidents, params.page, params.limit, result.total);
    };
    getIncidentById = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.findById(req.params.id);
        return (0, response_1.sendSuccess)(res, incident);
    };
    createIncident = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.create({
            reporterId: req.user.userId,
            roomId: req.body.roomId,
            category: req.body.category,
            title: req.body.title,
            description: req.body.description,
            images: req.body.images,
            priority: req.body.priority
        });
        return (0, response_1.sendCreated)(res, incident, 'Incident reported successfully');
    };
    updateIncident = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.update(req.params.id, {
            category: req.body.category,
            title: req.body.title,
            description: req.body.description,
            images: req.body.images,
            priority: req.body.priority
        });
        return (0, response_1.sendSuccess)(res, incident, 'Incident updated successfully');
    };
    assignIncident = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.assignIncident(req.params.id, req.body.assignedTo, req.user.userId);
        return (0, response_1.sendSuccess)(res, incident, 'Incident assigned successfully');
    };
    updateIncidentStatus = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.updateStatus(req.params.id, req.body.status, req.user.userId);
        return (0, response_1.sendSuccess)(res, incident, 'Incident status updated successfully');
    };
    resolveIncident = async (req, res, _next) => {
        const incident = await incident_service_1.incidentService.resolveIncident(req.params.id, req.body.resolutionNote, req.user.userId);
        return (0, response_1.sendSuccess)(res, incident, 'Incident resolved successfully');
    };
    deleteIncident = async (req, res, _next) => {
        await incident_service_1.incidentService.deleteIncident(req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Incident deleted successfully');
    };
    getIncidentStats = async (_req, res, _next) => {
        const stats = await incident_service_1.incidentService.getStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
    getMyIncidents = async (req, res, _next) => {
        const incidents = await incident_service_1.incidentService.getMyIncidents(req.user.userId);
        return (0, response_1.sendSuccess)(res, incidents);
    };
}
exports.incidentController = new IncidentController();
//# sourceMappingURL=incident.controller.js.map