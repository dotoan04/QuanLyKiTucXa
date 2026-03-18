interface SearchResult {
    id: string;
    title: string;
    content: string;
    similarity: number;
    metadata: any;
}
export interface IndexStats {
    totalDocuments: number;
    totalChunks: number;
    categories: string[];
    lastUpdated: Date | null;
}
declare class KnowledgeBaseService {
    private collection;
    getCollection(): Promise<any>;
    indexKnowledgeBase(forceReindex?: boolean): Promise<{
        success: boolean;
        message: string;
        indexed: number;
    }>;
    search(query: string, limit?: number): Promise<SearchResult[]>;
    addKnowledgeEntry(entry: {
        title: string;
        content: string;
        category: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string;
        content: string;
    }>;
    updateKnowledgeEntry(id: string, data: {
        title?: string;
        content?: string;
        category?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string;
        content: string;
    }>;
    deleteKnowledgeEntry(id: string): Promise<boolean>;
    getIndexStats(): Promise<IndexStats>;
    searchDatabase(query: string, limit?: number): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string;
        content: string;
    }[]>;
}
export declare const knowledgeBaseService: KnowledgeBaseService;
export {};
//# sourceMappingURL=knowledge-base.service.d.ts.map