import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Card } from '../../card/entities/card.entity';

export enum TransactionStatus {
  APPROVED = 'APPROVED',
  ANNULLED = 'ANNULLED',
}

export const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string | number): number => (typeof value === 'string' ? parseFloat(value) : value),
};

@Entity('transactions')
export class Transaction {
  @PrimaryColumn({ name: 'transaction_id', length: 36 })
  transactionId: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.APPROVED,
  })
  status: TransactionStatus;

  @Column({ name: 'card_id', length: 16 })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
