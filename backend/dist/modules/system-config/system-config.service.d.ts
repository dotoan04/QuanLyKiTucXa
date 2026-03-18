declare class SystemConfigService {
    getAll(): Promise<Record<string, string>>;
    getByKey(key: string): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    } | null>;
    set(key: string, value: string, description?: string): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }>;
    setBatch(configs: {
        key: string;
        value: string;
        description?: string;
    }[]): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }[]>;
}
export declare const systemConfigService: SystemConfigService;
export {};
//# sourceMappingURL=system-config.service.d.ts.map