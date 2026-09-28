import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Client } from '../modules/client/entities/client.entity';
import { Card } from '../modules/card/entities/card.entity';
import { Transaction } from '../modules/transaction/entities/transaction.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const commonOptions = {
    entities: [Client, Card, Transaction],
    synchronize: process.env.DB_SYNCHRONIZE === 'false' ? false : true,
    logging: process.env.DB_LOGGING === 'true',
    autoLoadEntities: true,
  };

  // Si se proporciona DATABASE_URL (estándar en Render, Railway, Heroku, etc.)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ...commonOptions,
      ssl:
        process.env.DB_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
    };
  }

  // Conexión por variables individuales (desarrollo local y Docker Compose)
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bank_inc_db',
    ...commonOptions,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  };
};
