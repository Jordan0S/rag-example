import { registerAs } from '@nestjs/config';

export default registerAs('documentAI', () => ({
  azureSearch: {
    endpoint: process.env.AZURE_SEARCH_ENDPOINT,
    key: process.env.AZURE_SEARCH_KEY,
    indexName: process.env.AZURE_SEARCH_INDEX_NAME || 'documents',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiVersion: process.env.OPENAI_API_VERSION || '2023-05-15',
    embeddingDeployment: process.env.OPENAI_API_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002',
    embeddingModel: process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-ada-002',
  },
  documentProcessing: {
    chunkSize: parseInt(process.env.DOCUMENT_CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.DOCUMENT_CHUNK_OVERLAP || '200', 10),
  },
}));
