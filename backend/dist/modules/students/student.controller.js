"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = void 0;
const student_service_1 = require("./student.service");
const response_1 = require("../../common/utils/response");
const app_error_1 = require("../../common/utils/app-error");
class StudentController {
    getStudents = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search,
            faculty: req.query.faculty,
            academicYear: req.query.academicYear ? parseInt(req.query.academicYear) : undefined
        };
        const result = await student_service_1.studentService.findAll(params);
        return (0, response_1.sendPaginated)(res, result.students, params.page, params.limit, result.total);
    };
    getStudentByCode = async (req, res, _next) => {
        const student = await student_service_1.studentService.findByCode(req.params.code);
        return (0, response_1.sendSuccess)(res, student);
    };
    getStudentById = async (req, res, _next) => {
        const student = await student_service_1.studentService.findById(req.params.id);
        return (0, response_1.sendSuccess)(res, student);
    };
    updateStudent = async (req, res, _next) => {
        const student = await student_service_1.studentService.update(req.params.id, {
            dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
            gender: req.body.gender,
            hometown: req.body.hometown,
            faculty: req.body.faculty,
            academicYear: req.body.academicYear,
            priorityGroup: req.body.priorityGroup,
            emergencyContact: req.body.emergencyContact
        });
        return (0, response_1.sendSuccess)(res, student, 'Student updated successfully');
    };
    getStudentContracts = async (req, res, _next) => {
        const contracts = await student_service_1.studentService.getStudentContracts(req.params.id);
        return (0, response_1.sendSuccess)(res, contracts);
    };
    getStudentInvoices = async (req, res, _next) => {
        const invoices = await student_service_1.studentService.getStudentInvoices(req.params.id);
        return (0, response_1.sendSuccess)(res, invoices);
    };
    getStudentIncidents = async (req, res, _next) => {
        const incidents = await student_service_1.studentService.getStudentIncidents(req.params.id);
        return (0, response_1.sendSuccess)(res, incidents);
    };
    getStudentStats = async (_req, res, _next) => {
        const stats = await student_service_1.studentService.getStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
    getMyProfile = async (req, res, _next) => {
        const student = await student_service_1.studentService.findByUserId(req.user.userId);
        if (!student) {
            return (0, response_1.sendSuccess)(res, null);
        }
        return (0, response_1.sendSuccess)(res, student);
    };
    getMyContracts = async (req, res, _next) => {
        const student = await student_service_1.studentService.findByUserId(req.user.userId);
        if (!student) {
            return (0, response_1.sendSuccess)(res, []);
        }
        const contracts = await student_service_1.studentService.getStudentContracts(student.id);
        return (0, response_1.sendSuccess)(res, contracts);
    };
    updateMyProfile = async (req, res, _next) => {
        const student = await student_service_1.studentService.findByUserId(req.user.userId);
        if (!student) {
            throw app_error_1.AppError.notFound('Student profile');
        }
        const updated = await student_service_1.studentService.update(student.id, {
            dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
            gender: req.body.gender,
            hometown: req.body.hometown,
            faculty: req.body.faculty,
            academicYear: req.body.academicYear,
            priorityGroup: req.body.priorityGroup,
            emergencyContact: req.body.emergencyContact
        });
        return (0, response_1.sendSuccess)(res, updated, 'Profile updated successfully');
    };
}
exports.studentController = new StudentController();
//# sourceMappingURL=student.controller.js.map