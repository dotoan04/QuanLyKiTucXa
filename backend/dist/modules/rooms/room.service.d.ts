import { RoomStatus, GenderRestriction } from '@prisma/client';
interface CreateRoomInput {
    roomNumber: string;
    floor: number;
    building: string;
    roomTypeId: string;
    status?: RoomStatus;
    notes?: string;
    images?: string[];
}
interface UpdateRoomInput {
    roomNumber?: string;
    floor?: number;
    building?: string;
    roomTypeId?: string;
    status?: RoomStatus;
    notes?: string;
    images?: string[];
}
interface CreateRoomTypeInput {
    name: string;
    capacity: number;
    monthlyPrice: number;
    amenities?: string[];
    description?: string;
    genderRestriction?: GenderRestriction;
}
interface UpdateRoomTypeInput {
    name?: string;
    capacity?: number;
    monthlyPrice?: number;
    amenities?: string[];
    description?: string;
    genderRestriction?: GenderRestriction;
}
interface RoomQueryParams {
    page?: number;
    limit?: number;
    building?: string;
    floor?: number;
    status?: RoomStatus;
    roomTypeId?: string;
    search?: string;
}
interface RoomTypeQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}
declare class RoomService {
    getRooms(params: RoomQueryParams): Promise<{
        rooms: {
            currentOccupancy: number;
            _count: {
                contracts: number;
            };
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
                genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
            };
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
            roomTypeId: string;
            status: import("@prisma/client").$Enums.RoomStatus;
            images: string[];
            notes: string | null;
        }[];
        total: number;
    }>;
    getRoomById(id: string): Promise<{
        currentOccupancy: number;
        _count: {
            contracts: number;
        };
        contracts: ({
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
        incidents: {
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
        }[];
        id: string;
        building: string;
        roomNumber: string;
        floor: number;
        roomTypeId: string;
        status: import("@prisma/client").$Enums.RoomStatus;
        images: string[];
        notes: string | null;
    }>;
    createRoom(data: CreateRoomInput): Promise<{
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
    }>;
    updateRoom(id: string, data: UpdateRoomInput): Promise<{
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
    }>;
    deleteRoom(id: string): Promise<boolean>;
    getRoomStats(): Promise<{
        total: number;
        available: number;
        occupied: number;
        maintenance: number;
        reserved: number;
        buildings: {
            name: string;
            count: number;
        }[];
        floorsByBuilding: {
            building: string;
            floor: number;
            count: number;
        }[];
        roomTypes: {
            id: string;
            name: string;
            capacity: number;
            roomCount: number;
        }[];
    }>;
    getRoomTypes(params: RoomTypeQueryParams): Promise<{
        roomTypes: {
            roomCount: number;
            _count: {
                rooms: number;
            };
            id: string;
            name: string;
            capacity: number;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
        }[];
        total: number;
    }>;
    getRoomTypeById(id: string): Promise<{
        roomCount: number;
        _count: {
            rooms: number;
        };
        rooms: {
            id: string;
            building: string;
            roomNumber: string;
            floor: number;
            status: import("@prisma/client").$Enums.RoomStatus;
        }[];
        id: string;
        name: string;
        capacity: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
    }>;
    createRoomType(data: CreateRoomTypeInput): Promise<{
        id: string;
        name: string;
        capacity: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
    }>;
    updateRoomType(id: string, data: UpdateRoomTypeInput): Promise<{
        id: string;
        name: string;
        capacity: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
    }>;
    getAvailableRooms(): Promise<{
        buildings: {
            name: string;
            floors: {
                number: number;
                rooms: {
                    id: string;
                    roomNumber: string;
                    building: string;
                    floor: number;
                    status: import("@prisma/client").$Enums.RoomStatus;
                    roomType: {
                        id: string;
                        name: string;
                        capacity: number;
                        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                        amenities: import("@prisma/client/runtime/library").JsonValue;
                        genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
                    };
                    activeContracts: number;
                    slotsLeft: number;
                }[];
            }[];
        }[];
        rooms: {
            id: string;
            roomNumber: string;
            building: string;
            floor: number;
            status: import("@prisma/client").$Enums.RoomStatus;
            roomType: {
                id: string;
                name: string;
                capacity: number;
                monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                amenities: import("@prisma/client/runtime/library").JsonValue;
                genderRestriction: import("@prisma/client").$Enums.GenderRestriction | null;
            };
            activeContracts: number;
            slotsLeft: number;
        }[];
    }>;
    deleteRoomType(id: string): Promise<boolean>;
}
export declare const roomService: RoomService;
export {};
//# sourceMappingURL=room.service.d.ts.map