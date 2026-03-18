import { InvoiceStatus, PaymentMethod } from '@prisma/client';
interface InvoiceQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    studentId?: string;
    roomId?: string;
    month?: string;
    year?: number;
    search?: string;
}
interface GenerateInvoiceInput {
    contractId: string;
    invoiceMonth: Date;
    electricityPrev: number;
    electricityCurr: number;
    waterPrev: number;
    waterCurr: number;
    otherFees?: any;
    dueDays?: number;
}
interface UpdateInvoiceInput {
    status?: InvoiceStatus;
    electricityPrice?: number;
    waterPrice?: number;
    otherFees?: any;
    dueDate?: Date;
    paymentMethod?: PaymentMethod;
    paymentRef?: string;
}
declare class InvoiceService {
    findAll(params: InvoiceQueryParams): Promise<{
        invoices: ({
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
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    findById(id: string): Promise<{
        contract: {
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
    }>;
    generateInvoice(data: GenerateInvoiceInput): Promise<{
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
    }>;
    generateBatchInvoices(contractIds: string[], invoiceMonth: Date, dueDays?: number): Promise<{
        generated: number;
        skipped: number;
        invoices: {
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
        }[];
    }>;
    update(id: string, data: UpdateInvoiceInput): Promise<{
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
    }>;
    processPayment(id: string, paymentMethod: PaymentMethod, paymentRef?: string): Promise<{
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
    }>;
    getMonthlyStats(year?: number, month?: number): Promise<{
        period: {
            year: number;
            month: number;
            startDate: Date;
            endDate: Date;
        };
        counts: {
            total: number;
            paid: number;
            unpaid: number;
            overdue: number;
            collectionRate: number;
        };
        amounts: {
            total: number;
            paid: number;
            unpaid: number;
            paidPercentage: number;
        };
        dailyPayments: {
            date: Date | null;
            amount: number;
        }[];
    }>;
    getStudentSummary(studentId: string): Promise<{
        unpaid: {
            count: number;
            total: number;
            invoices: ({
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
            })[];
        };
        overdue: {
            count: number;
            total: number;
            invoices: ({
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
            })[];
        };
        recentPayments: ({
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
        })[];
    }>;
    updateOverdueInvoices(): Promise<{
        updated: number;
    }>;
    getSummaryStats(): Promise<{
        total: number;
        paid: number;
        unpaid: number;
        overdue: number;
        collectionRate: number;
        totalAmount: number;
        paidAmount: number;
        unpaidAmount: number;
    }>;
}
export declare const invoiceService: InvoiceService;
export {};
//# sourceMappingURL=invoice.service.d.ts.map