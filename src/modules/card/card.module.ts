import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Client } from '../client/entities/client.entity';
import { CardService } from './card.service';
import { CardController } from './card.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Card, Client])],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService, TypeOrmModule],
})
export class CardModule {}
