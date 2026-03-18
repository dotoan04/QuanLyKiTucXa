import { UserRole } from '@prisma/client';
interface RegisterInput {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    studentCode?: string;
    idCardNumber?: string;
    dateOfBirth?: Date;
    gender?: string;
    hometown?: string;
    faculty?: string;
    academicYear?: number;
}
declare class AuthService {
    private generateTokens;
    register(data: RegisterInput): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("@prisma/client").$Enums.UserRole;
            phone: string | null;
            avatarUrl: string | null;
            student: {
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
            } | null;
            staffInfo: {
                id: string;
                userId: string;
                position: string;
                department: string | null;
            } | null;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(_refreshToken: string): Promise<boolean>;
    getUserById(userId: string): Promise<{
        student: {
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
        } | null;
        staffInfo: {
            id: string;
            userId: string;
            position: string;
            department: string | null;
        } | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        fullName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser(userId: string, data: Partial<{
        fullName: string;
        phone: string;
        avatarUrl: string;
    }>): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        fullName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    forgotPassword(email: string): Promise<boolean>;
    resetPassword(token: string, password: string): Promise<boolean>;
    getUsers(query: {
        page?: string;
        limit?: string;
        role?: string;
        search?: string;
    }): Promise<{
        users: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            fullName: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        page: number;
        limit: number;
        total: number;
    }>;
    deleteUser(userId: string): Promise<boolean>;
    createUser(data: {
        email: string;
        password: string;
        fullName: string;
        role: UserRole;
        phone?: string;
        position?: string;
        department?: string;
    }): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map