import { Decimal } from '@prisma/client/runtime/library';
interface ReturnRequestInput {
    contractId: string;
    returnDate: Date;
    reason?: string;
}
interface ScheduleInspectionInput {
    returnRequestId: string;
    scheduledDate: Date;
    inspectorId: string;
}
interface CompleteInspectionInput {
    returnRequestId: string;
    damageNotes?: string;
    damagePhotos?: string[];
    damageAmount?: number;
    inspectionNotes?: string;
}
interface ProcessRefundInput {
    returnRequestId: string;
    bankAccount?: string;
    bankName?: string;
}
declare class ReturnService {
    createReturnRequest(data: ReturnRequestInput, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        damageAmount: Decimal | null;
        inspectionNotes: string | null;
        refundAmount: Decimal | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    }>;
    scheduleInspection(data: ScheduleInspectionInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        damageAmount: Decimal | null;
        inspectionNotes: string | null;
        refundAmount: Decimal | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    }>;
    completeInspection(data: CompleteInspectionInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        damageAmount: Decimal | null;
        inspectionNotes: string | null;
        refundAmount: Decimal | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    }>;
    processRefund(data: ProcessRefundInput): Promise<{
        depositAmount: number;
        damageAmount: number;
        refundAmount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        inspectionNotes: string | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    }>;
    getMyReturnRequests(userId: string): Promise<({
        contract: {
            room: {
                roomType: {
                    id: string;
                    name: string;
                    capacity: number;
                    monthlyPrice: Decimal;
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
            monthlyRent: Decimal;
            depositAmount: Decimal;
            contractPdfUrl: string | null;
            approvedBy: string | null;
            terminationReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        damageAmount: Decimal | null;
        inspectionNotes: string | null;
        refundAmount: Decimal | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    })[]>;
    getAllReturnRequests(params: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        requests: ({
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
                        monthlyPrice: Decimal;
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
                monthlyRent: Decimal;
                depositAmount: Decimal;
                contractPdfUrl: string | null;
                approvedBy: string | null;
                terminationReason: string | null;
            };
            inspector: {
                id: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            contractId: string;
            returnDate: Date;
            reason: string | null;
            scheduledDate: Date | null;
            damageNotes: string | null;
            damagePhotos: string[];
            damageAmount: Decimal | null;
            inspectionNotes: string | null;
            refundAmount: Decimal | null;
            bankAccount: string | null;
            bankName: string | null;
            completedAt: Date | null;
            inspectorId: string | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getReturnRequestById(id: string): Promise<{
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
                    monthlyPrice: Decimal;
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
            assetHandover: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                contractId: string;
                items: import("@prisma/client/runtime/library").JsonValue;
                handoverAt: Date;
                confirmedBy: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ContractStatus;
            studentId: string;
            roomId: string;
            startDate: Date;
            endDate: Date | null;
            monthlyRent: Decimal;
            depositAmount: Decimal;
            contractPdfUrl: string | null;
            approvedBy: string | null;
            terminationReason: string | null;
        };
        inspector: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        returnDate: Date;
        reason: string | null;
        scheduledDate: Date | null;
        damageNotes: string | null;
        damagePhotos: string[];
        damageAmount: Decimal | null;
        inspectionNotes: string | null;
        refundAmount: Decimal | null;
        bankAccount: string | null;
        bankName: string | null;
        completedAt: Date | null;
        inspectorId: string | null;
    }>;
    cancelReturnRequest(id: string, userId: string): Promise<boolean>;
}
export declare const returnService: ReturnService;
export {};
//# sourceMappingURL=returns.service.d.ts.map