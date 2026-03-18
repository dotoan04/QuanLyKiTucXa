interface GetAllParams {
    page: number;
    limit: number;
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}
declare class AuditLogService {
    create(data: {
        userId?: string;
        action: string;
        entity?: string;
        entityId?: string;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }>;
    getAll({ page, limit, action, entity, userId, startDate, endDate }: GetAllParams): Promise<{
        items: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            entity: string | null;
            entityId: string | null;
            details: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getById(id: string): Promise<({
        user: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }) | null>;
    getByEntity(entity: string, entityId: string): Promise<({
        user: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
}
export declare const auditLogService: AuditLogService;
export {};
//# sourceMappingURL=audit-log.service.d.ts.map