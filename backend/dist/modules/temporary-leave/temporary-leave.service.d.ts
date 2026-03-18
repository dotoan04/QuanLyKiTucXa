interface TemporaryLeaveInput {
    contractId: string;
    leaveDate: Date;
    returnDate: Date;
    reason?: string;
    contactPhone?: string;
    emergencyContact?: string;
}
interface TemporaryLeaveStatus {
    id: string;
    contractId: string;
    leaveDate: Date;
    returnDate: Date;
    reason?: string;
    status: string;
    daysRemaining: number;
    isOverdue: boolean;
    [key: string]: unknown;
}
declare class TemporaryLeaveService {
    create(data: TemporaryLeaveInput, userId: string): Promise<{
        contract: {
            student: {
                user: {
                    id: string;
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
        emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        leaveDate: Date;
        contactPhone: string | null;
        actualReturnDate: Date | null;
    }>;
    getMyLeaves(userId: string): Promise<TemporaryLeaveStatus[]>;
    getAllLeaves(params: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        leaves: ({
            contract: {
                student: {
                    user: {
                        id: string;
                        email: string;
                        fullName: string;
                        phone: string | null;
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
            emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
            contractId: string;
            returnDate: Date;
            reason: string | null;
            leaveDate: Date;
            contactPhone: string | null;
            actualReturnDate: Date | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    markAsReturned(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        leaveDate: Date;
        contactPhone: string | null;
        actualReturnDate: Date | null;
    }>;
    cancel(id: string, userId: string): Promise<boolean>;
    checkOverdueLeaves(): Promise<{
        overdueCount: number;
        leaves: ({
            contract: {
                student: {
                    user: {
                        id: string;
                        email: string;
                        fullName: string;
                        phone: string | null;
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
            emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
            contractId: string;
            returnDate: Date;
            reason: string | null;
            leaveDate: Date;
            contactPhone: string | null;
            actualReturnDate: Date | null;
        })[];
    }>;
}
export declare const temporaryLeaveService: TemporaryLeaveService;
export {};
//# sourceMappingURL=temporary-leave.service.d.ts.map