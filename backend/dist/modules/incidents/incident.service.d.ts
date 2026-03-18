import { IncidentCategory, IncidentPriority, IncidentStatus } from '@prisma/client';
interface IncidentQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    reporterId?: string;
    assignedTo?: string;
    roomId?: string;
    search?: string;
}
interface CreateIncidentInput {
    reporterId: string;
    roomId: string;
    category: IncidentCategory;
    title: string;
    description: string;
    images?: string[];
    priority?: IncidentPriority;
}
interface UpdateIncidentInput {
    category?: IncidentCategory;
    title?: string;
    description?: string;
    images?: string[];
    priority?: IncidentPriority;
}
declare class IncidentService {
    findAll(params: IncidentQueryParams): Promise<{
        incidents: ({
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
            reporter: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
            assignee: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
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
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    findById(id: string): Promise<{
        room: {
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
            })[];
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
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
    }>;
    create(data: CreateIncidentInput): Promise<{
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
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
    }>;
    update(id: string, data: UpdateIncidentInput): Promise<{
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
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
    }>;
    assignIncident(id: string, assignedTo: string, assignedBy: string): Promise<{
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
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
    }>;
    updateStatus(id: string, status: IncidentStatus, updatedBy: string): Promise<{
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
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
    }>;
    resolveIncident(id: string, resolutionNote: string, resolvedBy: string): Promise<{
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
        reporter: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
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
    }>;
    deleteIncident(id: string): Promise<boolean>;
    getStats(): Promise<{
        total: number;
        byStatus: {
            pending: number;
            inProgress: number;
            resolved: number;
            closed: number;
        };
        byCategory: {
            category: import("@prisma/client").$Enums.IncidentCategory;
            count: number;
        }[];
        byPriority: {
            priority: import("@prisma/client").$Enums.IncidentPriority;
            count: number;
        }[];
        topAssignees: {
            user: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            } | null;
            count: number;
        }[];
        avgResolutionTime: number;
        recentIncidents: ({
            room: {
                building: string;
                roomNumber: string;
            };
            reporter: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
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
        })[];
    }>;
    getMyIncidents(userId: string): Promise<{
        reported: ({
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
            assignee: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
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
        })[];
        assigned: ({
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
            reporter: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
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
        })[];
    }>;
}
export declare const incidentService: IncidentService;
export {};
//# sourceMappingURL=incident.service.d.ts.map