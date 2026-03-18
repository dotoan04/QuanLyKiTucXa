interface GetAllParams {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    roomId?: string;
    startDate?: Date;
    endDate?: Date;
}
declare class MaintenanceService {
    getAll({ page, limit, status, type, roomId, startDate, endDate }: GetAllParams): Promise<{
        items: ({
            room: {
                id: string;
                building: string;
                roomNumber: string;
                floor: number;
            } | null;
            assignee: {
                id: string;
                email: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MaintenanceStatus;
            notes: string | null;
            description: string | null;
            roomId: string | null;
            title: string;
            type: import("@prisma/client").$Enums.MaintenanceType;
            completedAt: Date | null;
            scheduledAt: Date;
            area: string | null;
            assigneeId: string | null;
            cost: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getById(id: string): Promise<({
        room: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
        } | null;
        assignee: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaintenanceStatus;
        notes: string | null;
        description: string | null;
        roomId: string | null;
        title: string;
        type: import("@prisma/client").$Enums.MaintenanceType;
        completedAt: Date | null;
        scheduledAt: Date;
        area: string | null;
        assigneeId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    create(data: {
        title: string;
        description?: string;
        type: string;
        roomId?: string;
        area?: string;
        scheduledAt: Date;
        assigneeId?: string;
    }): Promise<{
        room: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
        } | null;
        assignee: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaintenanceStatus;
        notes: string | null;
        description: string | null;
        roomId: string | null;
        title: string;
        type: import("@prisma/client").$Enums.MaintenanceType;
        completedAt: Date | null;
        scheduledAt: Date;
        area: string | null;
        assigneeId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        type?: string;
        roomId?: string;
        area?: string;
        scheduledAt?: Date;
        assigneeId?: string;
    }): Promise<{
        room: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
        } | null;
        assignee: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaintenanceStatus;
        notes: string | null;
        description: string | null;
        roomId: string | null;
        title: string;
        type: import("@prisma/client").$Enums.MaintenanceType;
        completedAt: Date | null;
        scheduledAt: Date;
        area: string | null;
        assigneeId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    complete(id: string, notes?: string, cost?: number): Promise<{
        room: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
        } | null;
        assignee: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaintenanceStatus;
        notes: string | null;
        description: string | null;
        roomId: string | null;
        title: string;
        type: import("@prisma/client").$Enums.MaintenanceType;
        completedAt: Date | null;
        scheduledAt: Date;
        area: string | null;
        assigneeId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MaintenanceStatus;
        notes: string | null;
        description: string | null;
        roomId: string | null;
        title: string;
        type: import("@prisma/client").$Enums.MaintenanceType;
        completedAt: Date | null;
        scheduledAt: Date;
        area: string | null;
        assigneeId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
export declare const maintenanceService: MaintenanceService;
export {};
//# sourceMappingURL=maintenance.service.d.ts.map