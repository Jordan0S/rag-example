import { config } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PromptEntity } from './entities/prompt.entity';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'technical-test',
    entities: [PromptEntity],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: false,
    logging: process.env.NODE_ENV === 'development',
});
export default AppDataSource;