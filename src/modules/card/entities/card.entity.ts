import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../client/entities/client.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';

export const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string | number): number => (typeof value === 'string' ? parseFloat(value) : value),
};

@Entity('cards')
export class Card {
  @PrimaryColumn({ name: 'card_id', length: 16 })
  cardId: string;

  @Column({ name: 'product_id', length: 6 })
  productId: string;

  @Column({ name: 'cardholder_name', nullable: true, length: 200 })
  cardholderName: string | null;

  @Column({ name: 'expiration_date', length: 7 }) // MM/YYYY
  expirationDate: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  balance: number;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ name: 'is_enrolled', default: false })
  isEnrolled: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'security_pin', length: 4, default: '1234' })
  pin: string;

  @ManyToOne(() => Client, (client) => client.cards, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  @OneToMany(() => Transaction, (transaction) => transaction.card)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
