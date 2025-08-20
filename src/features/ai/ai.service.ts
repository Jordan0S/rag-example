import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { PromptEntity } from 'src/shared/database/entities/prompt.entity';
import { Repository } from 'typeorm';
import { DocumentsService } from '../documents/documents.service';

export type AITool = {
    name: string;
    description: string;
    parameters: any;
    execute: (args: any) => Promise<any>;
};

@Injectable()
export class AIService {
    private readonly logger = new Logger(AIService.name);
    private agent: AgentExecutor;
    private isInitialized = false;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(PromptEntity)
        private readonly repository: Repository<PromptEntity>,
        private readonly documentService: DocumentsService
    ) { }

    public async initializeAgent() {
        if (this.isInitialized) return;
        const tools: AITool[] = [{
            name: 'querySimilar',
            description: 'Busca documentos similares basados en una consulta. Útil cuando el usuario pregunta sobre información que podría estar en documentos cargados previamente.',
            execute: async ({ query, limit = 4 }: { query: string; limit?: number }) => {
                this.logger.log(`Searching for documents similar to: ${query}`);
                try {
                    const results = await this.documentService.querySimilar(query, limit);
                    this.logger.log(`Found ${results.length} similar documents`);
                    return results.map(r => r.content).join("\n\n") || "No hay información relevante en los documentos";
                } catch (error) {
                    this.logger.error('Error in querySimilar:', error);
                    return 'Error al buscar documentos similares';
                }
            },
            parameters: {
                type: 'object',
                required: ['query'],
                properties: {
                    query: {
                        type: 'string',
                        description: 'La consulta para buscar documentos similares.',
                    },
                    limit: {
                        type: 'number',
                        description: 'El número máximo de resultados a devolver (por defecto: 4)',
                        default: 4
                    },
                },
            }
        }];

        const model = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
            modelName: 'gpt-4.1',
            temperature: 0.2,
        });

        const systemPrompt = await this.repository.findOne({
            where: { name: 'main-agent' },
            select: ['content'],
        });

        if (!systemPrompt) {
            this.logger.error('No system prompt found');
            return;
        }

        const prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt?.content ?? ''],
            new MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
            new MessagesPlaceholder('agent_scratchpad'),
        ]);

        const lcTools = tools.map(
            (t) =>
                new DynamicStructuredTool({
                    name: t.name,
                    description: t.description,
                    schema: t.parameters,
                    func: t.execute,
                })
        );

        const agent = await createOpenAIToolsAgent({
            llm: model,
            tools: lcTools,
            prompt,
        });

        this.agent = AgentExecutor.fromAgentAndTools({
            agent,
            tools: lcTools,
            returnIntermediateSteps: true,
        });

        this.isInitialized = true;
        this.logger.log('AI Agent initialized without memory');
    }

    public async getAIResponse(input: string): Promise<string> {
        if (!this.isInitialized) await this.initializeAgent();

        try {
            const result = await this.agent.invoke({
                input,
                chat_history: []
            });
            return result.output ?? 'No pude procesar tu solicitud.';
        } catch (error) {
            this.logger.error('Error getting AI response:', error);
            return 'No pude procesar tu solicitud.';
        }
    }
}
