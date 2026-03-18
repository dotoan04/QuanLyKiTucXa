import { Decimal } from '@prisma/client/runtime/library';
interface CreateViolationInput {
    studentId: string;
    incidentId?: string;
    type: string;
    description: string;
    evidence?: any;
    penaltyLevel?: 'low' | 'medium' | 'high' | 'severe';
    penaltyAmount?: number;
}
interface ProcessViolationInput {
    violationId: string;
    penaltyAmount: number;
    notes?: string;
}
declare class ViolationService {
    create(data: CreateViolationInput, reportedBy: string): Promise<{
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
        incident: {
            id: string;
            category: import("@prisma/client").$Enums.IncidentCategory;
            title: string;
        } | null;
        reporter: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        description: string;
        studentId: string;
        type: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        penaltyLevel: string;
        penaltyAmount: Decimal | null;
        penaltyApplied: boolean;
        incidentId: string | null;
        reportedBy: string;
    }>;
    determinePenaltyLevel(violationCount: number, type: string): 'low' | 'medium' | 'high' | 'severe';
    calculatePenaltyAmount(level: 'low' | 'medium' | 'high' | 'severe'): number;
    getAll(params: {
        status?: string;
        studentId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        violations: ({
            student: {
                user: {
                    id: string;
                    email: string;
                    fullName: string;
                    phone: string | null;
                };
                contracts: ({
                    room: {
                        roomNumber: string;
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
                })[];
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
            incident: {
                id: string;
                category: import("@prisma/client").$Enums.IncidentCategory;
                title: string;
            } | null;
            reporter: {
                id: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            notes: string | null;
            description: string;
            studentId: string;
            type: string;
            evidence: import("@prisma/client/runtime/library").JsonValue | null;
            penaltyLevel: string;
            penaltyAmount: Decimal | null;
            penaltyApplied: boolean;
            incidentId: string | null;
            reportedBy: string;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getById(id: string): Promise<{
        student: {
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
            contracts: ({
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
            })[];
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
        incident: ({
            room: {
                building: string;
                roomNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.IncidentPriority;
            status: import("@prisma/client").$Enums.IncidentStatus;
            images: string[];
            description: string;
            roomId: string;
            reporterId: string;
            category: import("@prisma/client").$Enums.IncidentCategory;
            title: string;
            assignedTo: string | null;
            resolvedAt: Date | null;
            resolutionNote: string | null;
        }) | null;
        reporter: {
            id: string;
            email: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        description: string;
        studentId: string;
        type: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        penaltyLevel: string;
        penaltyAmount: Decimal | null;
        penaltyApplied: boolean;
        incidentId: string | null;
        reportedBy: string;
    }>;
    process(data: ProcessViolationInput): Promise<{
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
        status: string;
        notes: string | null;
        description: string;
        studentId: string;
        type: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        penaltyLevel: string;
        penaltyAmount: Decimal | null;
        penaltyApplied: boolean;
        incidentId: string | null;
        reportedBy: string;
    }>;
    getStudentViolationHistory(studentId: string): Promise<{
        violations: ({
            incident: {
                id: string;
                title: string;
            } | null;
            reporter: {
                id: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            notes: string | null;
            description: string;
            studentId: string;
            type: string;
            evidence: import("@prisma/client/runtime/library").JsonValue | null;
            penaltyLevel: string;
            penaltyAmount: Decimal | null;
            penaltyApplied: boolean;
            incidentId: string | null;
            reportedBy: string;
        })[];
        stats: {
            total: number;
            pending: number;
            processed: number;
            totalPenalty: number;
            byLevel: {
                low: number;
                medium: number;
                high: number;
                severe: number;
            };
        };
    }>;
    appeal(violationId: string, appealReason: string, userId: string): Promise<boolean>;
}
export declare const violationService: ViolationService;
export {};
//# sourceMappingURL=violations.service.d.ts.map