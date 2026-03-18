"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directorService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class DirectorService {
    async getRoomTypePolicies() {
        const roomTypes = await prisma.roomType.findMany({
            include: {
                _count: {
                    select: { rooms: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            capacity: rt.capacity,
            monthlyPrice: rt.monthlyPrice,
            genderRestriction: rt.genderRestriction,
            roomCount: rt._count.rooms
        }));
    }
    async approveRoomTypePrice(roomTypeId, monthlyPrice, reviewerId, note) {
        if (monthlyPrice <= 0) {
            throw app_error_1.AppError.badRequest('monthlyPrice phải lớn hơn 0');
        }
        const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        const updated = await prisma.roomType.update({
            where: { id: roomTypeId },
            data: { monthlyPrice }
        });
        await prisma.notification.create({
            data: {
                userId: reviewerId,
                type: 'system',
                title: 'Phê duyệt giá phòng thành công',
                message: `Đã cập nhật giá phòng ${updated.name} thành ${monthlyPrice.toLocaleString('vi-VN')}đ.${note ? ` Ghi chú: ${note}` : ''}`
            }
        });
        return updated;
    }
    async getPeriodicReport(startDate, endDate, type) {
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            throw app_error_1.AppError.badRequest('startDate/endDate không hợp lệ');
        }
        if (type === 'financial') {
            const invoices = await prisma.invoice.findMany({
                where: {
                    invoiceMonth: { gte: startDate, lte: endDate }
                },
                select: {
                    id: true,
                    invoiceMonth: true,
                    totalAmount: true,
                    status: true,
                    contract: {
                        select: {
                            room: { select: { roomNumber: true, building: true } },
                            student: {
                                select: {
                                    studentCode: true,
                                    user: { select: { fullName: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { invoiceMonth: 'asc' }
            });
            const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
            const paidRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
            const unpaidRevenue = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0);
            return {
                type,
                summary: {
                    from: startDate,
                    to: endDate,
                    totalInvoices: invoices.length,
                    totalRevenue,
                    paidRevenue,
                    unpaidRevenue
                },
                items: invoices
            };
        }
        const rooms = await prisma.room.findMany({
            select: {
                id: true,
                roomNumber: true,
                building: true,
                floor: true,
                currentOccupancy: true,
                status: true,
                roomType: {
                    select: {
                        name: true,
                        capacity: true
                    }
                }
            },
            orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }]
        });
        const totalCapacity = rooms.reduce((sum, r) => sum + r.roomType.capacity, 0);
        const totalOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
        return {
            type,
            summary: {
                from: startDate,
                to: endDate,
                totalRooms: rooms.length,
                totalCapacity,
                totalOccupancy,
                occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0
            },
            items: rooms
        };
    }
    toCsv(report) {
        if (report.type === 'financial') {
            const header = 'invoiceId,invoiceMonth,studentCode,studentName,room,totalAmount,status';
            const rows = report.items.map((i) => {
                const room = `${i.contract?.room?.building || ''}${i.contract?.room?.roomNumber || ''}`;
                return [
                    i.id,
                    new Date(i.invoiceMonth).toISOString().slice(0, 10),
                    i.contract?.student?.studentCode || '',
                    i.contract?.student?.user?.fullName || '',
                    room,
                    Number(i.totalAmount),
                    i.status
                ].join(',');
            });
            return [header, ...rows].join('\n');
        }
        const header = 'roomId,building,floor,roomNumber,roomType,capacity,currentOccupancy,status';
        const rows = report.items.map((r) => [
            r.id,
            r.building,
            r.floor,
            r.roomNumber,
            r.roomType?.name || '',
            r.roomType?.capacity || 0,
            r.currentOccupancy,
            r.status
        ].join(','));
        return [header, ...rows].join('\n');
    }
}
exports.directorService = new DirectorService();
//# sourceMappingURL=director.service.js.map