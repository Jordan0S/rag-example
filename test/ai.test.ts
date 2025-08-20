import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIService } from '../src/features/ai/ai.service';
import { DocumentsService } from '../src/features/documents/documents.service';
import { AIModule } from '../src/features/ai/ai.module';
import { DocumentsModule } from '../src/features/documents/documents.module';
import aiConfig from '../src/shared/config/ai.config';
import documentAIConfig from '../src/shared/config/document-ai.config';

describe('AIService', () => {
  let aiService: AIService;
  let documentsService: DocumentsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [aiConfig, documentAIConfig],
        }),
        AIModule,
        DocumentsModule,
      ],
    }).compile();

    aiService = module.get<AIService>(AIService);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(aiService).toBeDefined();
    expect(documentsService).toBeDefined();
  });

  describe('AI Conversation', () => {
    it('should respond to a simple greeting', async () => {
      const response = await aiService.getAIResponse('Hello, how are you?');
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      console.log('AI Response:', response);
    });
  });

  describe('Document Search', () => {
    it('should search for similar documents', async () => {
      // This assumes you have some documents indexed in your Azure AI Search
      const query = 'test document search';
      const results = await documentsService.searchSimilar(query, 2);
      
      console.log(`Search results for "${query}":`, results);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('AI with Tools', () => {
    it('should use document search tool', async () => {
      // This will use the document search tool through the AI agent
      const response = await aiService.getAIResponse(
        'Search for documents about artificial intelligence'
      );
      
      console.log('AI Response with document search:', response);
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });
});
