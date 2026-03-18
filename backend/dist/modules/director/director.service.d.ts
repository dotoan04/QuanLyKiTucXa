type ReportType = 'financial' | 'occupancy';
declare class DirectorService {
    getRoomTypePolicies(): Promise<{
        id: string;
        name: string;
        capacity: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        roomCount: number;
    }[]>;
    approveRoomTypePrice(roomTypeId: string, monthlyPrice: number, reviewerId: string, note?: string): Promise<{
        id: string;
        name: string;
        capacity: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
    }>;
    getPeriodicReport(startDate: Date, endDate: Date, type: ReportType): Promise<{
        type: "financial";
        summary: {
            from: Date;
            to: Date;
            totalInvoices: number;
            totalRevenue: number;
            paidRevenue: number;
            unpaidRevenue: number;
            totalRooms?: undefined;
            totalCapacity?: undefined;
            totalOccupancy?: undefined;
            occupancyRate?: undefined;
        };
        items: {
            id: string;
            contract: {
                student: {
                    user: {
                        fullName: string;
                    };
                    studentCode: string;
                };
                room: {
                    building: string;
                    roomNumber: string;
                };
            };
            status: import("@prisma/client").$Enums.InvoiceStatus;
            invoiceMonth: Date;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } | {
        type: "occupancy";
        summary: {
            from: Date;
            to: Date;
            totalRooms: number;
            totalCapacity: number;
            totalOccupancy: number;
            occupancyRate: number;
            totalInvoices?: undefined;
            totalRevenue?: undefined;
            paidRevenue?: undefined;
            unpaidRevenue?: undefined;
        };
        items: {
            id: string;
            roomType: {
                name: string;
                capacity: number;
            };
            building: string;
            roomNumber: string;
            floor: number;
            status: import("@prisma/client").$Enums.RoomStatus;
            currentOccupancy: number;
        }[];
    }>;
    toCsv(report: any): string;
}
export declare const directorService: DirectorService;
export {};
//# sourceMappingURL=director.service.d.ts.map