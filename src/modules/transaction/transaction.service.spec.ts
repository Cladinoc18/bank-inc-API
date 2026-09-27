import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Card } from '../card/entities/card.entity';
import { CardUtils } from '../../common/utils/card.utils';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockTransactionRepository: any;
  let mockCardRepository: any;
  let mockDataSource: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockTransactionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockCardRepository = {
      findOne: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        create: jest.fn().mockImplementation((_, dto) => ({ ...dto, createdAt: new Date() })),
        save: jest.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('purchase', () => {
    const validCard = {
      cardId: '1020301234567801',
      balance: 500,
      currency: 'USD',
      isEnrolled: true,
      isBlocked: false,
      expirationDate: '12/2029',
      client: { id: 'client-1' },
    };

    it('debe ejecutar la compra exitosamente descontando saldo', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ ...validCard }) // find card
        .mockResolvedValueOnce(null); // uniqueness check for txId

      const result = await service.purchase({
        cardId: '1020301234567801',
        price: 100,
      });

      expect(result.price).toBe(100);
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.remainingBalance).toBe(400);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la tarjeta no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.purchase({ cardId: '0000000000000000', price: 100 }),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la tarjeta no está activada (enrolled)', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...validCard,
        isEnrolled: false,
      });

      await expect(
        service.purchase({ cardId: '1020301234567801', price: 100 }),
      ).rejects.toThrow('La tarjeta no ha sido activada en el proceso de emisión');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la tarjeta está bloqueada', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...validCard,
        isBlocked: true,
      });

      await expect(
        service.purchase({ cardId: '1020301234567801', price: 100 }),
      ).rejects.toThrow('La tarjeta se encuentra bloqueada para transacciones');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la tarjeta no tiene cliente asignado', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...validCard,
        client: null,
      });

      await expect(
        service.purchase({ cardId: '1020301234567801', price: 100 }),
      ).rejects.toThrow('La tarjeta no tiene un cliente asignado');
    });

    it('debe lanzar BadRequestException si la tarjeta está vencida', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...validCard,
        expirationDate: '01/2020',
      });

      await expect(
        service.purchase({ cardId: '1020301234567801', price: 100 }),
      ).rejects.toThrow('La tarjeta se encuentra vencida');
    });

    it('debe lanzar BadRequestException si el saldo es insuficiente', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        ...validCard,
        balance: 50,
      });

      await expect(
        service.purchase({ cardId: '1020301234567801', price: 100 }),
      ).rejects.toThrow('Saldo insuficiente para realizar la compra');
    });
  });

  describe('findById', () => {
    it('debe retornar la transacción si existe', async () => {
      mockTransactionRepository.findOne.mockResolvedValue({
        transactionId: '102030',
        price: 100,
      });

      const result = await service.findById('102030');
      expect(result.transactionId).toBe('102030');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);
      await expect(service.findById('000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('anulate', () => {
    it('debe anular la transacción y reembolsar el saldo dentro de las 24 horas', async () => {
      const recentTx = {
        transactionId: '102030',
        cardId: '1020301234567801',
        price: 150,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(), // ahora mismo
      };

      const card = {
        cardId: '1020301234567801',
        balance: 200,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(recentTx) // find tx
        .mockResolvedValueOnce(card); // find card

      const result = await service.anulate({
        cardId: '1020301234567801',
        transactionId: '102030',
      });

      expect(result.status).toBe(TransactionStatus.ANNULLED);
      expect(result.refundedAmount).toBe(150);
      expect(result.newBalance).toBe(350);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la transacción no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.anulate({ cardId: '1020301234567801', transactionId: '999999' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la tarjeta no coincide con la transacción', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        transactionId: '102030',
        cardId: 'otra_tarjeta_distinta',
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
      });

      await expect(
        service.anulate({ cardId: '1020301234567801', transactionId: '102030' }),
      ).rejects.toThrow('no corresponde a la tarjeta suministrada');
    });

    it('debe lanzar BadRequestException si la transacción ya estaba anulada', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        transactionId: '102030',
        cardId: '1020301234567801',
        status: TransactionStatus.ANNULLED,
        createdAt: new Date(),
      });

      await expect(
        service.anulate({ cardId: '1020301234567801', transactionId: '102030' }),
      ).rejects.toThrow('ya se encuentra anulada');
    });

    it('debe lanzar BadRequestException si la transacción supera las 24 horas', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 48 horas atrás

      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        transactionId: '102030',
        cardId: '1020301234567801',
        status: TransactionStatus.APPROVED,
        createdAt: oldDate,
      });

      await expect(
        service.anulate({ cardId: '1020301234567801', transactionId: '102030' }),
      ).rejects.toThrow('ha superado el límite permitido de 24 horas');
    });

    it('debe lanzar NotFoundException si la tarjeta asociada no existe durante la anulación', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({
          transactionId: '102030',
          cardId: '1020301234567801',
          price: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
        })
        .mockResolvedValueOnce(null); // card not found

      await expect(
        service.anulate({ cardId: '1020301234567801', transactionId: '102030' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
