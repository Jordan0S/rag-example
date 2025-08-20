import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import documentAIConfig from '../../shared/config/document-ai.config';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    ConfigModule.forFeature(documentAIConfig),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule { }
