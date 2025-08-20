import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './features/documents/documents.module';
import { MessagesModule } from './features/messages/messages.module';
import { DatabaseModule } from './shared/database/database.module';
import { AIModule } from './features/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AIModule,
    MessagesModule,
    DocumentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
