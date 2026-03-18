interface DashboardStats {
    overview: {
        totalRooms: number;
        occupiedRooms: number;
        availableRooms: number;
        totalStudents: number;
        activeContracts: number;
        totalRevenue: number;
        pendingInvoices: number;
        openTickets: number;
        occupancyRate: number;
    };
    revenue: {
        thisMonth: number;
        lastMonth: number;
        byRoomType: Array<{
            type: string;
            revenue: number;
            count: number;
        }>;
        trend: Array<{
            month: string;
            revenue: number;
        }>;
    };
    students: {
        byFaculty: Array<{
            faculty: string;
            count: number;
        }>;
        byYear: Array<{
            year: number;
            count: number;
        }>;
        newThisMonth: number;
        totalActive: number;
    };
    incidents: {
        open: number;
        inProgress: number;
        resolved: number;
        avgResolutionTime: number;
        byCategory: Array<{
            category: string;
            count: number;
        }>;
    };
    financial: {
        totalCollected: number;
        totalOutstanding: number;
        collectionRate: number;
        overdueAmount: number;
        byPaymentMethod: Array<{
            method: string;
            amount: number;
        }>;
    };
}
declare class DashboardService {
    getDashboardStats(): Promise<DashboardStats>;
    getRevenueReport(startDate: Date, endDate: Date): Promise<({
        contract: {
            student: {
                user: {
                    email: string;
                    fullName: string;
                };
            } & {
                id: string;
                userId: string;
                studentCode: string;
                idCardNumber: string | null;
                dateOfBirth: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                hometown: string | null;
                faculty: string | null;
                academicYear: number | null;
                emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
                priorityGroup: string | null;
            };
            room: {
                roomType: {
                    id: string;
                    name: string;
                    capacity: number;
                    monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                    amenities: import("@prisma/client/runtime/library").JsonValue | null;
                    description: string | null;
                    genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
                };
            } & {
                id: string;
                building: string;
                roomNumber: string;
                floor: number;
                roomTypeId: string;
                status: import("@prisma/client").$Enums.RoomStatus;
                currentOccupancy: number;
                images: string[];
                notes: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ContractStatus;
            studentId: string;
            roomId: string;
            startDate: Date;
            endDate: Date | null;
            monthlyRent: import("@prisma/client/runtime/library").Decimal;
            depositAmount: import("@prisma/client/runtime/library").Decimal;
            contractPdfUrl: string | null;
            approvedBy: string | null;
            terminationReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        contractId: string;
        invoiceMonth: Date;
        roomFee: import("@prisma/client/runtime/library").Decimal;
        electricityPrev: import("@prisma/client/runtime/library").Decimal;
        electricityCurr: import("@prisma/client/runtime/library").Decimal;
        electricityPrice: import("@prisma/client/runtime/library").Decimal;
        waterPrev: import("@prisma/client/runtime/library").Decimal;
        waterCurr: import("@prisma/client/runtime/library").Decimal;
        waterPrice: import("@prisma/client/runtime/library").Decimal;
        otherFees: import("@prisma/client/runtime/library").JsonValue | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date;
        paidAt: Date | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        paymentRef: string | null;
    })[]>;
    getOccupancyReport(): Promise<{
        summary: {
            totalRooms: number;
            totalCapacity: number;
            currentOccupancy: number;
            occupancyRate: number;
        };
        buildings: {
            building: string;
            totalRooms: number;
            occupied: number;
            available: number;
            totalCapacity: number;
            currentOccupancy: number;
            occupancyRate: number;
        }[];
        floors: {
            building: string;
            floor: number;
            totalRooms: number;
            occupied: number;
            available: number;
            totalCapacity: number;
            currentOccupancy: number;
            occupancyRate: number;
        }[];
    }>;
}
export declare const dashboardService: DashboardService;
export {};
//# sourceMappingURL=dashboard.service.d.ts.map