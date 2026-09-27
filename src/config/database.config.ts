import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Client } from '../modules/client/entities/client.entity';
import { Card } from '../modules/card/entities/card.entity';
import { Transaction } from '../modules/transaction/entities/transaction.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bank_inc_db',
  entities: [Client, Card, Transaction],
  synchronize: process.env.DB_SYNCHRONIZE === 'false' ? false : true,
  logging: process.env.DB_LOGGING === 'true',
  autoLoadEntities: true,
});
