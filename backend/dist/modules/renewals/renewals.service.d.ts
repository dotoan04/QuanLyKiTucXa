interface RenewContractInput {
    contractId: string;
    newEndDate: Date;
    newMonthlyRent?: number;
    additionalDeposit?: number;
    keepSameRoom: boolean;
}
interface RenewalEligibility {
    contractId: string;
    studentId: string;
    currentEndDate: Date | null;
    daysUntilExpiry: number;
    isEligible: boolean;
    reason?: string;
}
declare class RenewalService {
    checkRenewalEligibility(contractId: string): Promise<RenewalEligibility>;
    getContractsExpiringSoon(days?: number): Promise<({
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
    renewContract(data: RenewContractInput, userId: string): Promise<{
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
    }>;
    sendRenewalReminders(): Promise<{
        sent: number;
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
    }>;
    getRenewalHistory(contractId: string): Promise<{
        current: {
            student: {
                user: {
                    id: string;
                    email: string;
                    fullName: string;
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
        previous: {
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
        }[];
    }>;
}
export declare const renewalService: RenewalService;
export {};
//# sourceMappingURL=renewals.service.d.ts.map