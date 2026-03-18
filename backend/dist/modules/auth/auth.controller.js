"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../common/utils/response");
class AuthController {
    register = async (req, res, _next) => {
        const result = await auth_service_1.authService.register(req.body);
        return (0, response_1.sendCreated)(res, result, 'Registration successful');
    };
    login = async (req, res, _next) => {
        const result = await auth_service_1.authService.login(req.body.email, req.body.password);
        return (0, response_1.sendSuccess)(res, result, 'Login successful');
    };
    refreshToken = async (req, res, _next) => {
        const result = await auth_service_1.authService.refreshToken(req.body.refreshToken);
        return (0, response_1.sendSuccess)(res, result, 'Token refreshed');
    };
    logout = async (req, res, _next) => {
        await auth_service_1.authService.logout(req.body.refreshToken);
        return (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    };
    getMe = async (req, res, _next) => {
        const user = await auth_service_1.authService.getUserById(req.user.userId);
        return (0, response_1.sendSuccess)(res, user);
    };
    updateMe = async (req, res, _next) => {
        const user = await auth_service_1.authService.updateUser(req.user.userId, req.body);
        return (0, response_1.sendSuccess)(res, user, 'Profile updated');
    };
    changePassword = async (req, res, _next) => {
        await auth_service_1.authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
        return (0, response_1.sendSuccess)(res, null, 'Password changed successfully');
    };
    forgotPassword = async (req, res, _next) => {
        await auth_service_1.authService.forgotPassword(req.body.email);
        return (0, response_1.sendSuccess)(res, null, 'Reset email sent if account exists');
    };
    resetPassword = async (req, res, _next) => {
        await auth_service_1.authService.resetPassword(req.body.token, req.body.password);
        return (0, response_1.sendSuccess)(res, null, 'Password reset successful');
    };
    getUsers = async (req, res, _next) => {
        const result = await auth_service_1.authService.getUsers(req.query);
        return (0, response_1.sendSuccess)(res, result);
    };
    getUser = async (req, res, _next) => {
        const user = await auth_service_1.authService.getUserById(req.params.id);
        return (0, response_1.sendSuccess)(res, user);
    };
    createUser = async (req, res, _next) => {
        const user = await auth_service_1.authService.createUser({
            email: req.body.email,
            password: req.body.password,
            fullName: req.body.fullName,
            role: req.body.role,
            phone: req.body.phone,
            position: req.body.position,
            department: req.body.department
        });
        return (0, response_1.sendCreated)(res, user, 'Tạo tài khoản thành công');
    };
    updateUser = async (req, res, _next) => {
        const user = await auth_service_1.authService.updateUser(req.params.id, req.body);
        return (0, response_1.sendSuccess)(res, user, 'Cập nhật thành công');
    };
    deleteUser = async (req, res, _next) => {
        await auth_service_1.authService.deleteUser(req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Đã vô hiệu hóa tài khoản');
    };
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map