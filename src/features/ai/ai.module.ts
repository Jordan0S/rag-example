import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptEntity } from 'src/shared/database/entities/prompt.entity';
import aiConfig from '../../shared/config/ai.config';
import { DocumentsModule } from '../documents/documents.module';
import { AIService } from './ai.service';

@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
        TypeOrmModule.forFeature([PromptEntity]),
        DocumentsModule,
    ],
    providers: [AIService],
    exports: [AIService],
})
export class AIModule {
    constructor(
        private readonly aiService: AIService,
    ) { }

    async onModuleInit() {
        await this.aiService.initializeAgent();
    }
}
