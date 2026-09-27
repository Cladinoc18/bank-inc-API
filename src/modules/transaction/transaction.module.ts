import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Card } from '../card/entities/card.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Card])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
