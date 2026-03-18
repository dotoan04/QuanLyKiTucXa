"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendIncidentUpdateEmail = exports.sendInvoiceReminderEmail = exports.sendResetPasswordEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@ktx.edu.vn',
        to: email,
        subject: 'Đặt lại mật khẩu - Ký túc xá',
        html: `
      <h1>Đặt lại mật khẩu</h1>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào link bên dưới để tiếp tục:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Link này sẽ hết hạn sau 1 giờ.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    `
    });
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
const sendInvoiceReminderEmail = async (email, invoiceMonth, amount, dueDate) => {
    await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@ktx.edu.vn',
        to: email,
        subject: `Nhắc nhở thanh toán hóa đơn ${invoiceMonth} - Ký túc xá`,
        html: `
      <h1>Nhắc nhở thanh toán hóa đơn</h1>
      <p>Bạn có hóa đơn ${invoiceMonth} chưa thanh toán:</p>
      <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
      <p><strong>Hạn thanh toán:</strong> ${dueDate.toLocaleDateString('vi-VN')}</p>
      <p>Vui lòng thanh toán trước hạn để tránh bị phạt trễ.</p>
    `
    });
};
exports.sendInvoiceReminderEmail = sendInvoiceReminderEmail;
const sendIncidentUpdateEmail = async (email, incidentTitle, status) => {
    await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@ktx.edu.vn',
        to: email,
        subject: `Cập nhật sự cố: ${incidentTitle} - Ký túc xá`,
        html: `
      <h1>Cập nhật trạng thái sự cố</h1>
      <p><strong>Sự cố:</strong> ${incidentTitle}</p>
      <p><strong>Trạng thái mới:</strong> ${status}</p>
    `
    });
};
exports.sendIncidentUpdateEmail = sendIncidentUpdateEmail;
//# sourceMappingURL=email.js.map