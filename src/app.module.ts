import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ClientModule } from './modules/client/client.module';
import { CardModule } from './modules/card/card.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    ClientModule,
    CardModule,
    TransactionModule,
  ],
})
export class AppModule {}
