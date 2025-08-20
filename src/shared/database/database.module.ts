import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { PromptEntity } from './entities/prompt.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', ''),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'technical-test'),
        entities: [PromptEntity],
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        synchronize: configService.get<boolean>('DB_SYNC', false),
        migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', true),
        logging: configService.get<boolean>('DB_LOGGING', false),
        ssl: configService.get<boolean>('DB_SSL', false)
          ? { rejectUnauthorized: false }
          : undefined,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
