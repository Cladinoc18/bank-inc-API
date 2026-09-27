import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Card } from '../card/entities/card.entity';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { AnulateTransactionDto } from './dto/anulate-transaction.dto';
import { CardUtils } from '../../common/utils/card.utils';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Executes a purchase transaction ensuring business rules and ACID consistency.
   */
  async purchase(purchaseTransactionDto: PurchaseTransactionDto): Promise<{
    transactionId: string;
    cardId: string;
    price: number;
    status: TransactionStatus;
    createdAt: Date;
    remainingBalance: number;
  }> {
    const { cardId, price } = purchaseTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = await queryRunner.manager.findOne(Card, {
        where: { cardId },
        relations: ['client'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!card) {
        throw new NotFoundException(`Tarjeta con ID ${cardId} no encontrada`);
      }

      if (!card.isEnrolled) {
        throw new BadRequestException('La tarjeta no ha sido activada en el proceso de emisión');
      }

      if (card.isBlocked) {
        throw new BadRequestException('La tarjeta se encuentra bloqueada para transacciones');
      }

      if (!card.client) {
        throw new BadRequestException('La tarjeta no tiene un cliente asignado');
      }

      if (!CardUtils.isCardNotExpired(card.expirationDate)) {
        throw new BadRequestException(
          `La tarjeta se encuentra vencida. Fecha de vencimiento: ${card.expirationDate}`,
        );
      }

      const currentBalance = Number(card.balance);
      const purchasePrice = Number(price);

      if (currentBalance < purchasePrice) {
        throw new BadRequestException(
          `Saldo insuficiente para realizar la compra. Saldo disponible: $${currentBalance} USD, Monto requerido: $${purchasePrice} USD`,
        );
      }

      // Generate unique transactionId
      let transactionId: string;
      let exists = true;
      let attempts = 0;
      do {
        transactionId = CardUtils.generateTransactionId();
        const existingTx = await queryRunner.manager.findOne(Transaction, {
          where: { transactionId },
        });
        exists = !!existingTx;
        attempts++;
        if (attempts > 10) {
          throw new BadRequestException('No se pudo generar un ID de transacción único');
        }
      } while (exists);

      // Deduct balance
      card.balance = Number((currentBalance - purchasePrice).toFixed(2));
      await queryRunner.manager.save(Card, card);

      // Create and save transaction
      const transaction = queryRunner.manager.create(Transaction, {
        transactionId,
        cardId: card.cardId,
        price: purchasePrice,
        status: TransactionStatus.APPROVED,
      });

      const savedTransaction = await queryRunner.manager.save(Transaction, transaction);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Compra exitosa ID ${transactionId} en tarjeta ${cardId} por $${purchasePrice}. Saldo restante: $${card.balance}`,
      );

      return {
        transactionId: savedTransaction.transactionId,
        cardId: savedTransaction.cardId,
        price: savedTransaction.price,
        status: savedTransaction.status,
        createdAt: savedTransaction.createdAt,
        remainingBalance: card.balance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves a transaction by its ID.
   */
  async findById(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['card', 'card.client'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${transactionId} no encontrada`);
    }

    return transaction;
  }

  /**
   * Annuls a purchase transaction within the 24-hour window and refunds balance atomically.
   */
  async anulate(anulateTransactionDto: AnulateTransactionDto): Promise<{
    message: string;
    transactionId: string;
    cardId: string;
    refundedAmount: number;
    newBalance: number;
    status: TransactionStatus;
  }> {
    const { cardId, transactionId } = anulateTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transacción con ID ${transactionId} no encontrada`);
      }

      if (transaction.cardId !== cardId) {
        throw new BadRequestException(
          `La transacción ${transactionId} no corresponde a la tarjeta suministrada ${cardId}`,
        );
      }

      if (transaction.status === TransactionStatus.ANNULLED) {
        throw new BadRequestException('La transacción ya se encuentra anulada previamente');
      }

      if (!CardUtils.isWithin24Hours(transaction.createdAt)) {
        throw new BadRequestException(
          'No es posible anular la transacción: ha superado el límite permitido de 24 horas',
        );
      }

      // Lock card and refund balance
      const card = await queryRunner.manager.findOne(Card, {
        where: { cardId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!card) {
        throw new NotFoundException(`Tarjeta asociada con ID ${cardId} no encontrada`);
      }

      const refundAmount = Number(transaction.price);
      card.balance = Number((Number(card.balance) + refundAmount).toFixed(2));
      transaction.status = TransactionStatus.ANNULLED;

      await queryRunner.manager.save(Card, card);
      await queryRunner.manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Transacción ${transactionId} anulada con éxito. Reembolso: $${refundAmount}. Nuevo saldo: $${card.balance}`,
      );

      return {
        message: 'Transacción anulada exitosamente',
        transactionId: transaction.transactionId,
        cardId: transaction.cardId,
        refundedAmount: refundAmount,
        newBalance: card.balance,
        status: TransactionStatus.ANNULLED,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
