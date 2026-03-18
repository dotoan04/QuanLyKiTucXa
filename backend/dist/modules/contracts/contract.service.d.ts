import { ContractStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
interface ContractQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    studentId?: string;
    roomId?: string;
    search?: string;
}
interface CreateContractInput {
    studentId: string;
    roomId: string;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
    depositAmount?: number;
    contractPdfUrl?: string;
    approvedBy?: string;
}
interface UpdateContractInput {
    endDate?: Date;
    status?: ContractStatus;
    monthlyRent?: number;
    depositAmount?: number;
    contractPdfUrl?: string;
    approvedBy?: string;
}
declare class ContractService {
    findAll(params: ContractQueryParams): Promise<{
        contracts: ({
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
            approver: {
                id: string;
                email: string;
                fullName: string;
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
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    findById(id: string): Promise<{
        student: {
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
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
        approver: {
            id: string;
            email: string;
            fullName: string;
        } | null;
        invoices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            contractId: string;
            invoiceMonth: Date;
            roomFee: Decimal;
            electricityPrev: Decimal;
            electricityCurr: Decimal;
            electricityPrice: Decimal;
            waterPrev: Decimal;
            waterCurr: Decimal;
            waterPrice: Decimal;
            otherFees: import("@prisma/client/runtime/library").JsonValue | null;
            totalAmount: Decimal;
            dueDate: Date;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            paymentRef: string | null;
        }[];
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
    }>;
    create(data: CreateContractInput): Promise<{
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
    }>;
    update(id: string, data: UpdateContractInput): Promise<{
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
    }>;
    terminate(id: string, terminationReason: string, approvedBy: string): Promise<{
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
    }>;
    createRegistrationRequest(data: {
        studentId: string;
        preferredRoomTypeId: string;
        preferredRoomId?: string;
        desiredStartDate: Date;
    }): Promise<{
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
        preferredRoomType: {
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        };
        preferredRoom: ({
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
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RegistrationStatus;
        studentId: string;
        preferredRoomTypeId: string;
        preferredRoomId: string | null;
        desiredStartDate: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        priorityScore: number;
        reviewNote: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    getRegistrationRequests(params: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<{
        requests: ({
            student: {
                user: {
                    id: string;
                    email: string;
                    fullName: string;
                    phone: string | null;
                    avatarUrl: string | null;
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
            preferredRoomType: {
                id: string;
                name: string;
                capacity: number;
                monthlyPrice: Decimal;
                amenities: import("@prisma/client/runtime/library").JsonValue | null;
                description: string | null;
                genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
            };
            preferredRoom: ({
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
            }) | null;
            reviewer: {
                id: string;
                email: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.RegistrationStatus;
            studentId: string;
            preferredRoomTypeId: string;
            preferredRoomId: string | null;
            desiredStartDate: Date;
            documents: import("@prisma/client/runtime/library").JsonValue | null;
            priorityScore: number;
            reviewNote: string | null;
            reviewedBy: string | null;
            reviewedAt: Date | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    approveRegistrationRequest(id: string, roomId: string, reviewerId: string, reviewNote?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectRegistrationRequest(id: string, reviewerId: string, reviewNote: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createHandover(contractId: string, confirmedBy: string, items: Array<{
        name: string;
        condition: string;
        note?: string;
    }>): Promise<{
        confirmer: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contractId: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        handoverAt: Date;
        confirmedBy: string | null;
    }>;
    getHandover(contractId: string): Promise<({
        confirmer: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contractId: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        handoverAt: Date;
        confirmedBy: string | null;
    }) | null>;
    getStats(): Promise<{
        total: number;
        active: number;
        expired: number;
        terminated: number;
        pending: number;
        occupancyRate: number;
    }>;
}
export declare const contractService: ContractService;
export {};
//# sourceMappingURL=contract.service.d.ts.map