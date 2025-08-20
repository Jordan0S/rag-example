import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { AzureAISearchQueryType, AzureAISearchVectorStore } from '@langchain/community/vectorstores/azure_aisearch';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { v4 as uuidv4 } from 'uuid';
import { DocumentAIConfig } from './dto/document-ai.config';


@Injectable()
export class DocumentsService implements OnModuleInit {
    private readonly logger = new Logger(DocumentsService.name);
    private vectorStore: AzureAISearchVectorStore;
    private embeddings: OpenAIEmbeddings;
    private config: DocumentAIConfig;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.config = this.configService.get<DocumentAIConfig>('documentAI') as DocumentAIConfig;
    }

    async onModuleInit() {
        await this.initializeVectorStore();
    }

    private async initializeVectorStore() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: this.config.openai.apiKey,
            modelName: this.config.openai.embeddingModel,
        });

        try {
            // Initialize with Azure AI Search configuration
            const azureConfig = {
                endpoint: this.config.azureSearch.endpoint,
                key: this.config.azureSearch.key,
                indexName: this.config.azureSearch.indexName,
                search: {
                    type: AzureAISearchQueryType.SimilarityHybrid,
                },
            };

            this.vectorStore = new AzureAISearchVectorStore(this.embeddings, azureConfig);

            // Verify the index exists by making a simple query
            await this.vectorStore.similaritySearch('test', 1);
            this.logger.log(`Using existing index: ${this.config.azureSearch.indexName}`);
        } catch (error) {
            if (error.statusCode === 404) {
                // Index doesn't exist, create a new one
                this.logger.log(`Index not found. Creating new index: ${this.config.azureSearch.indexName}`);

                this.vectorStore = await AzureAISearchVectorStore.fromTexts(
                    ['Initial document'],
                    [{ source: 'initial' }],
                    this.embeddings,
                    {
                        endpoint: this.config.azureSearch.endpoint,
                        key: this.config.azureSearch.key,
                        indexName: this.config.azureSearch.indexName,
                        search: {
                            type: AzureAISearchQueryType.SimilarityHybrid,
                        },
                    }
                );

                this.logger.log(`Successfully created index: ${this.config.azureSearch.indexName}`);
            } else {
                this.logger.error('Error initializing vector store', error);
                throw error;
            }
        }
    }

    async searchDocuments(query: string, k = 4): Promise<Document[]> {
        if (!this.vectorStore) {
            await this.initializeVectorStore();
        }
        return this.vectorStore.similaritySearch(query, k);
    }

    async addDocuments(documents: Document[]): Promise<void> {
        if (!this.vectorStore) {
            await this.initializeVectorStore();
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.documentProcessing.chunkSize,
            chunkOverlap: this.config.documentProcessing.chunkOverlap,
        });

        const splitDocs = await textSplitter.splitDocuments(documents);
        await this.vectorStore.addDocuments(splitDocs);
    }

    async uploadDocument(file: Express.Multer.File, metadata: Record<string, any> = {}): Promise<{ documentId: string; chunks: number }> {
        try {
            // Process document based on file type
            let documents: Document[] = [];
            const documentId = metadata.documentId || uuidv4();

            if (file.mimetype === "application/pdf") {
                const uint8Array = new Uint8Array(file.buffer);
                const fileBlob = new Blob([uint8Array], { type: "application/pdf" });
                const loader = new WebPDFLoader(fileBlob, {
                    splitPages: true
                });
                documents = await loader.load();
            } else if (file.mimetype === 'text/plain') {
                const text = file.buffer.toString('utf-8');
                documents = [new Document({
                    pageContent: text,
                    metadata: {
                        source: file.originalname,
                        ...metadata,
                    }
                })];
            } else {
                throw new BadRequestException('Unsupported file type. Only PDF and TXT files are supported.');
            }

            this.logger.log("Splitting documents into chunks");
            const chunks = await this.splitDocuments(documents);

            const chunksWithMetadata = chunks.map(chunk => ({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    documentId,
                    source: file.originalname,
                    ...metadata,
                },
            }));

            this.logger.log("Storing in vector database");
            const result = await this.vectorStore.addDocuments(chunksWithMetadata);
            if (result.length > 0) {
                this.logger.log(`Stored ${result.length} chunks`);
            }

            return {
                documentId,
                chunks: chunksWithMetadata.length,
            };
        } catch (error) {
            this.logger.error('Error processing document:', error);
            throw new BadRequestException(`Failed to process document: ${error.message}`);
        }
    }

    private async loadDocument(filePath: string): Promise<Document[]> {
        const extension = filePath.split('.').pop()?.toLowerCase();

        let loader;
        switch (extension) {
            case 'pdf':
                loader = new PDFLoader(filePath, {
                    splitPages: true,
                });
                break;
            case 'txt':
            case 'md':
                loader = new TextLoader(filePath);
                break;
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }

        return loader.load();
    }

    private async splitDocuments(documents: Document[]): Promise<Document[]> {
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.documentProcessing.chunkSize,
            chunkOverlap: this.config.documentProcessing.chunkOverlap,
        });

        return textSplitter.splitDocuments(documents);
    }

    async ingestDocument(filePath: string): Promise<{ success: boolean; chunks?: number; error?: string }> {
        try {
            // Load document
            const documents = await this.loadDocument(filePath);

            // Split into chunks
            const splitDocs = await this.splitDocuments(documents);

            // Add to vector store
            await this.vectorStore.addDocuments(splitDocs);

            return {
                success: true,
                chunks: splitDocs.length
            };
        } catch (error) {
            this.logger.error('Error ingesting document', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async querySimilar(query: string, k = 5): Promise<Array<{ content: string; metadata: any; score: number }>> {
        try {
            const results = await this.vectorStore.similaritySearchWithScore(query, k);
            return results.map(([doc, score]) => ({
                content: doc.pageContent,
                metadata: doc.metadata,
                score,
            }));
        } catch (error) {
            this.logger.error('Error querying similar documents:', error);
            throw new Error('Failed to query similar documents');
        }
    }

    // Method to search for similar documents
    public async searchSimilar(query: string, limit: number = 4): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error('Vector store not initialized');
        }
        return this.vectorStore.similaritySearch(query, limit);
    }
}
