import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CardService } from './card.service';
import { Card } from './entities/card.entity';
import { Client } from '../client/entities/client.entity';

describe('CardService', () => {
  let service: CardService;
  let mockCardRepository: any;
  let mockClientRepository: any;
  let mockDataSource: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockCardRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockClientRepository = {
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
        save: jest.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generateCardNumber', () => {
    it('debe generar y persistir una tarjeta de 16 dígitos válida', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      const result = await service.generateCardNumber('102030');

      expect(result).toHaveProperty('cardNumber');
      expect(result.cardNumber).toHaveLength(16);
      expect(result.cardNumber.startsWith('102030')).toBe(true);
      expect(mockCardRepository.create).toHaveBeenCalled();
      expect(mockCardRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el productId no tiene 6 dígitos numéricos', async () => {
      await expect(service.generateCardNumber('123')).rejects.toThrow(BadRequestException);
      await expect(service.generateCardNumber('abcdef')).rejects.toThrow(BadRequestException);
    });

    it('debe reintentar si el número generado ya existe y persistir al encontrar uno único', async () => {
      mockCardRepository.findOne
        .mockResolvedValueOnce({ cardId: 'already_exists' })
        .mockResolvedValueOnce(null);

      const result = await service.generateCardNumber('102030');
      expect(result).toHaveProperty('cardNumber');
      expect(mockCardRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('enrollCard', () => {
    it('debe activar la tarjeta y vincularla al cliente', async () => {
      const existingCard = {
        cardId: '1020301234567801',
        isEnrolled: false,
        isBlocked: false,
        client: null,
      };

      const existingClient = {
        id: 'client-uuid-1',
        firstName: 'Juan',
        lastName: 'Pérez',
      };

      mockCardRepository.findOne.mockResolvedValue(existingCard);
      mockClientRepository.findOne.mockResolvedValue(existingClient);

      const result = await service.enrollCard({
        cardId: '1020301234567801',
        clientId: 'client-uuid-1',
      });

      expect(result.isEnrolled).toBe(true);
      expect(result.cardholderName).toBe('Juan Pérez');
      expect(result.client).toEqual(existingClient);
      expect(mockCardRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la tarjeta no existe', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.enrollCard({ cardId: '1020300000000000', clientId: 'client-uuid-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si la tarjeta está bloqueada', async () => {
      mockCardRepository.findOne.mockResolvedValue({
        cardId: '1020301234567801',
        isBlocked: true,
      });

      await expect(
        service.enrollCard({ cardId: '1020301234567801', clientId: 'client-uuid-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockCardRepository.findOne.mockResolvedValue({
        cardId: '1020301234567801',
        isBlocked: false,
      });
      mockClientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.enrollCard({ cardId: '1020301234567801', clientId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('blockCard', () => {
    it('debe bloquear una tarjeta existente', async () => {
      const card = { cardId: '1020301234567801', isBlocked: false };
      mockCardRepository.findOne.mockResolvedValue(card);

      const result = await service.blockCard('1020301234567801');

      expect(result.isBlocked).toBe(true);
      expect(result.cardId).toBe('1020301234567801');
      expect(mockCardRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isBlocked: true }));
    });

    it('debe lanzar NotFoundException si la tarjeta no existe', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);
      await expect(service.blockCard('0000000000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rechargeBalance', () => {
    it('debe recargar el saldo atómicamente si la tarjeta existe y no está bloqueada', async () => {
      const card = {
        cardId: '1020301234567801',
        balance: 50.0,
        currency: 'USD',
        isBlocked: false,
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(card);

      const result = await service.rechargeBalance({
        cardId: '1020301234567801',
        balance: 100.5,
      });

      expect(result.balance).toBe(150.5);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la tarjeta no existe', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.rechargeBalance({ cardId: '0000000000000000', balance: 50 }),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la tarjeta está bloqueada', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        cardId: '1020301234567801',
        isBlocked: true,
      });

      await expect(
        service.rechargeBalance({ cardId: '1020301234567801', balance: 50 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('debe retornar el saldo y estado de la tarjeta', async () => {
      mockCardRepository.findOne.mockResolvedValue({
        cardId: '1020301234567801',
        balance: 250.75,
        currency: 'USD',
        isEnrolled: true,
        isBlocked: false,
      });

      const result = await service.getBalance('1020301234567801');
      expect(result.balance).toBe(250.75);
      expect(result.cardId).toBe('1020301234567801');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);
      await expect(service.getBalance('0000000000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('debe retornar la tarjeta si existe', async () => {
      mockCardRepository.findOne.mockResolvedValue({ cardId: '1020301234567801' });
      const result = await service.findById('1020301234567801');
      expect(result.cardId).toBe('1020301234567801');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockCardRepository.findOne.mockResolvedValue(null);
      await expect(service.findById('0000000000000000')).rejects.toThrow(NotFoundException);
    });
  });
});
