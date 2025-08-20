export type DocumentAIConfig = {
    azureSearch: {
        endpoint: string;
        key: string;
        indexName: string;
    };
    openai: {
        apiKey: string;
        apiVersion: string;
        apiBase: string;
        embeddingDeployment: string;
        embeddingModel: string;
    };
    documentProcessing: {
        chunkSize: number;
        chunkOverlap: number;
    };
};