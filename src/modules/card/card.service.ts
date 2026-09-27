import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Card } from './entities/card.entity';
import { Client } from '../client/entities/client.entity';
import { EnrollCardDto } from './dto/enroll-card.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { CardUtils } from '../../common/utils/card.utils';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generates a 16-digit card number from a 6-digit productId and persists it.
   */
  async generateCardNumber(productId: string): Promise<{ cardNumber: string }> {
    if (!/^\d{6}$/.test(productId)) {
      throw new BadRequestException('El productId debe ser exactamente de 6 dígitos numéricos');
    }

    let cardNumber: string;
    let exists = true;
    let attempts = 0;

    // Ensure uniqueness
    do {
      cardNumber = CardUtils.generateCardNumber(productId);
      const existing = await this.cardRepository.findOne({ where: { cardId: cardNumber } });
      exists = !!existing;
      attempts++;
      if (attempts > 10) {
        throw new BadRequestException('No fue posible generar un número de tarjeta único, reintente');
      }
    } while (exists);

    const expirationDate = CardUtils.generateExpirationDate();

    const card = this.cardRepository.create({
      cardId: cardNumber,
      productId,
      expirationDate,
      balance: 0.0,
      currency: 'USD',
      isEnrolled: false,
      isBlocked: false,
      cardholderName: null,
      client: null,
    });

    await this.cardRepository.save(card);
    this.logger.log(`Tarjeta generada exitosamente: ${cardNumber}`);

    return { cardNumber };
  }

  /**
   * Assigns a client to the card and activates it (Enroll).
   */
  async enrollCard(enrollCardDto: EnrollCardDto): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { cardId: enrollCardDto.cardId },
      relations: ['client'],
    });

    if (!card) {
      throw new NotFoundException(`Tarjeta con ID ${enrollCardDto.cardId} no encontrada`);
    }

    if (card.isBlocked) {
      throw new BadRequestException('No es posible activar una tarjeta que se encuentra bloqueada');
    }

    const client = await this.clientRepository.findOne({
      where: { id: enrollCardDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${enrollCardDto.clientId} no encontrado`);
    }

    card.client = client;
    card.clientId = client.id;
    card.cardholderName = `${client.firstName} ${client.lastName}`.trim();
    card.isEnrolled = true;
    if (enrollCardDto.pin) {
      card.pin = enrollCardDto.pin;
    }

    const savedCard = await this.cardRepository.save(card);
    this.logger.log(`Tarjeta ${card.cardId} asignada al cliente ${client.id} y activada exitosamente`);
    return savedCard;
  }

  /**
   * Blocks a card (DELETE /card/{cardId}).
   */
  async blockCard(cardId: string): Promise<{ message: string; cardId: string; isBlocked: boolean }> {
    const card = await this.cardRepository.findOne({ where: { cardId } });

    if (!card) {
      throw new NotFoundException(`Tarjeta con ID ${cardId} no encontrada`);
    }

    card.isBlocked = true;
    await this.cardRepository.save(card);
    this.logger.log(`Tarjeta ${cardId} bloqueada exitosamente`);

    return {
      message: 'Tarjeta bloqueada exitosamente',
      cardId: card.cardId,
      isBlocked: true,
    };
  }

  /**
   * Recharges the balance of an existing, non-blocked card using an ACID transaction.
   */
  async rechargeBalance(rechargeBalanceDto: RechargeBalanceDto): Promise<{ cardId: string; balance: number; currency: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = await queryRunner.manager.findOne(Card, {
        where: { cardId: rechargeBalanceDto.cardId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!card) {
        throw new NotFoundException(`Tarjeta con ID ${rechargeBalanceDto.cardId} no encontrada`);
      }

      if (card.isBlocked) {
        throw new BadRequestException('No es posible recargar saldo a una tarjeta bloqueada');
      }

      const currentBalance = Number(card.balance);
      const rechargeAmount = Number(rechargeBalanceDto.balance);
      card.balance = Number((currentBalance + rechargeAmount).toFixed(2));

      await queryRunner.manager.save(Card, card);
      await queryRunner.commitTransaction();

      this.logger.log(`Recarga exitosa para tarjeta ${card.cardId}. Nuevo saldo: ${card.balance}`);
      return {
        cardId: card.cardId,
        balance: card.balance,
        currency: card.currency,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves the current balance and basic status of a card.
   */
  async getBalance(cardId: string): Promise<{ cardId: string; balance: number; currency: string; isEnrolled: boolean; isBlocked: boolean }> {
    const card = await this.cardRepository.findOne({ where: { cardId } });

    if (!card) {
      throw new NotFoundException(`Tarjeta con ID ${cardId} no encontrada`);
    }

    return {
      cardId: card.cardId,
      balance: Number(card.balance),
      currency: card.currency,
      isEnrolled: card.isEnrolled,
      isBlocked: card.isBlocked,
    };
  }

  /**
   * Finds card entity by cardId.
   */
  async findById(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { cardId },
      relations: ['client'],
    });

    if (!card) {
      throw new NotFoundException(`Tarjeta con ID ${cardId} no encontrada`);
    }

    return card;
  }
}
