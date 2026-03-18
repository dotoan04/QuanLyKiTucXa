interface StudentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    faculty?: string;
    academicYear?: number;
}
interface UpdateStudentInput {
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    hometown?: string;
    faculty?: string;
    academicYear?: number;
    priorityGroup?: string;
    emergencyContact?: any;
}
declare class StudentService {
    findAll(params: StudentQueryParams): Promise<{
        students: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
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
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    findById(id: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            createdAt: Date;
        };
        _count: {
            contracts: number;
        };
        contracts: ({
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
    }>;
    findByCode(studentCode: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
        };
        _count: {
            contracts: number;
        };
        contracts: ({
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
    }>;
    findByUserId(userId: string): Promise<({
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
        };
        _count: {
            contracts: number;
        };
        contracts: ({
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
    }) | null>;
    update(id: string, data: UpdateStudentInput): Promise<{
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
    }>;
    getStudentContracts(studentId: string): Promise<({
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
    })[]>;
    getStudentInvoices(studentId: string): Promise<({
        contract: {
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
        status: import("@prisma/client").$Enums.InvoiceStatus;
        contractId: string;
        invoiceMonth: Date;
        roomFee: import("@prisma/client/runtime/library").Decimal;
        electricityPrev: import("@prisma/client/runtime/library").Decimal;
        electricityCurr: import("@prisma/client/runtime/library").Decimal;
        electricityPrice: import("@prisma/client/runtime/library").Decimal;
        waterPrev: import("@prisma/client/runtime/library").Decimal;
        waterCurr: import("@prisma/client/runtime/library").Decimal;
        waterPrice: import("@prisma/client/runtime/library").Decimal;
        otherFees: import("@prisma/client/runtime/library").JsonValue | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date;
        paidAt: Date | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        paymentRef: string | null;
    })[]>;
    getStudentIncidents(studentId: string): Promise<({
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
    })[]>;
    getStats(): Promise<{
        totalStudents: number;
        activeContracts: number;
        occupancyRate: number;
        studentsByFaculty: {
            faculty: string | null;
            count: number;
        }[];
        studentsByYear: {
            year: number | null;
            count: number;
        }[];
    }>;
}
export declare const studentService: StudentService;
export {};
//# sourceMappingURL=student.service.d.ts.map