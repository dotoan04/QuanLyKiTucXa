interface RegistrationQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    studentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
interface CreateRegistrationInput {
    studentId: string;
    preferredRoomTypeId: string;
    preferredRoomId?: string;
    desiredStartDate: Date;
    documents?: string[];
    priorityGroup?: string;
}
interface ApproveRegistrationInput {
    registrationId: string;
    roomId?: string;
    reviewNote?: string;
}
interface RejectRegistrationInput {
    registrationId: string;
    reviewNote: string;
}
declare class RegistrationService {
    findAll(params: RegistrationQueryParams): Promise<{
        registrations: ({
            student: {
                id: string;
                user: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                };
                studentCode: string;
                faculty: string | null;
                priorityGroup: string | null;
            };
            preferredRoomType: {
                rooms: {
                    id: string;
                    building: string;
                    roomNumber: string;
                    floor: number;
                }[];
            } & {
                id: string;
                name: string;
                capacity: number;
                monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                amenities: import("@prisma/client/runtime/library").JsonValue | null;
                description: string | null;
                genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
            };
            preferredRoom: {
                id: string;
                building: string;
                roomNumber: string;
                floor: number;
            } | null;
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
    findById(id: string): Promise<{
        student: {
            id: string;
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
            studentCode: string;
            idCardNumber: string | null;
            faculty: string | null;
            emergencyContact: import("@prisma/client/runtime/library").JsonValue;
            priorityGroup: string | null;
        };
        preferredRoomType: {
            rooms: {
                id: string;
                building: string;
                roomNumber: string;
                floor: number;
                roomTypeId: string;
                status: import("@prisma/client").$Enums.RoomStatus;
                currentOccupancy: number;
                images: string[];
                notes: string | null;
            }[];
        } & {
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        };
        preferredRoom: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
            images: string[];
            notes: string | null;
        } | null;
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
    }>;
    calculatePriorityScore(student: any): Promise<number>;
    createForUser(data: Omit<CreateRegistrationInput, 'studentId'>, userId: string): Promise<{
        student: {
            id: string;
            user: {
                email: string;
                fullName: string;
                phone: string | null;
            };
            studentCode: string;
            faculty: string | null;
            priorityGroup: string | null;
        };
        preferredRoomType: {
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
    getMyRegistrationsByUserId(userId: string): Promise<({
        preferredRoomType: {
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        };
        preferredRoom: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
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
    })[]>;
    create(data: CreateRegistrationInput, userId: string): Promise<{
        student: {
            id: string;
            user: {
                email: string;
                fullName: string;
                phone: string | null;
            };
            studentCode: string;
            faculty: string | null;
            priorityGroup: string | null;
        };
        preferredRoomType: {
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
    approve(data: ApproveRegistrationInput, approvedBy: string): Promise<{
        contract: {
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
        registrationId: string;
    }>;
    reject(data: RejectRegistrationInput, rejectedBy: string): Promise<boolean>;
    getAvailableRooms(roomTypeId?: string, building?: string, genderRestriction?: string): Promise<Record<string, Record<number, ({
        roomType: {
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue;
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
    })[]>>>;
    getMyRegistrations(studentId: string): Promise<({
        preferredRoomType: {
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        };
        preferredRoom: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
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
    })[]>;
    getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>;
}
export declare const registrationService: RegistrationService;
export {};
//# sourceMappingURL=registrations.service.d.ts.map