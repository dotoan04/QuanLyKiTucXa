import { Decimal } from '@prisma/client/runtime/library';
interface TransferRequestInput {
    contractId: string;
    toRoomId: string;
    reason?: string;
}
interface ProcessTransferInput {
    transferId: string;
    status: 'approved' | 'rejected';
    reviewNote?: string;
}
declare class TransferService {
    createTransferRequest(data: TransferRequestInput, userId: string): Promise<{
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
        fromRoom: {
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
        toRoom: {
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
        status: string;
        contractId: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reason: string | null;
        fromRoomId: string;
        toRoomId: string;
        transferFee: Decimal | null;
    }>;
    getAllTransfers(params: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        transfers: ({
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
            reviewer: {
                id: string;
                fullName: string;
            } | null;
            fromRoom: {
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
            toRoom: {
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
            status: string;
            contractId: string;
            reviewNote: string | null;
            reviewedBy: string | null;
            reviewedAt: Date | null;
            reason: string | null;
            fromRoomId: string;
            toRoomId: string;
            transferFee: Decimal | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getMyTransfers(userId: string): Promise<({
        fromRoom: {
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
        toRoom: {
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
        status: string;
        contractId: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reason: string | null;
        fromRoomId: string;
        toRoomId: string;
        transferFee: Decimal | null;
    })[]>;
    processTransfer(data: ProcessTransferInput, reviewerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        contractId: string;
        reviewNote: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reason: string | null;
        fromRoomId: string;
        toRoomId: string;
        transferFee: Decimal | null;
    } | {
        status: string;
    }>;
    cancelTransfer(transferId: string, userId: string): Promise<boolean>;
    getTransferFee(fromRoomId: string, toRoomId: string): Promise<{
        fromRoom: {
            id: string;
            roomNumber: string;
            price: number;
        };
        toRoom: {
            id: string;
            roomNumber: string;
            price: number;
        };
        fee: number;
    }>;
}
export declare const transferService: TransferService;
export {};
//# sourceMappingURL=transfers.service.d.ts.map