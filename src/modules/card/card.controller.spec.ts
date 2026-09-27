import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from './card.controller';
import { CardService } from './card.service';

describe('CardController', () => {
  let controller: CardController;
  let mockCardService: any;

  beforeEach(async () => {
    mockCardService = {
      generateCardNumber: jest.fn().mockResolvedValue({ cardNumber: '1020301234567801' }),
      enrollCard: jest.fn().mockResolvedValue({ cardId: '1020301234567801', isEnrolled: true }),
      blockCard: jest.fn().mockResolvedValue({ cardId: '1020301234567801', isBlocked: true }),
      rechargeBalance: jest.fn().mockResolvedValue({ cardId: '1020301234567801', balance: 100 }),
      getBalance: jest.fn().mockResolvedValue({ cardId: '1020301234567801', balance: 100 }),
      findById: jest.fn().mockResolvedValue({ cardId: '1020301234567801' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        {
          provide: CardService,
          useValue: mockCardService,
        },
      ],
    }).compile();

    controller = module.get<CardController>(CardController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('generateCardNumber debe invocar a cardService.generateCardNumber', async () => {
    const result = await controller.generateCardNumber('102030');
    expect(mockCardService.generateCardNumber).toHaveBeenCalledWith('102030');
    expect(result.cardNumber).toBe('1020301234567801');
  });

  it('enrollCard debe invocar a cardService.enrollCard', async () => {
    const dto = { cardId: '1020301234567801', clientId: 'uuid-1' };
    const result = await controller.enrollCard(dto);
    expect(mockCardService.enrollCard).toHaveBeenCalledWith(dto);
    expect((result as any).isEnrolled).toBe(true);
  });

  it('blockCard debe invocar a cardService.blockCard', async () => {
    const result = await controller.blockCard('1020301234567801');
    expect(mockCardService.blockCard).toHaveBeenCalledWith('1020301234567801');
    expect(result.isBlocked).toBe(true);
  });

  it('rechargeBalance debe invocar a cardService.rechargeBalance', async () => {
    const dto = { cardId: '1020301234567801', balance: 100 };
    const result = await controller.rechargeBalance(dto);
    expect(mockCardService.rechargeBalance).toHaveBeenCalledWith(dto);
    expect(result.balance).toBe(100);
  });

  it('getBalance debe invocar a cardService.getBalance', async () => {
    const result = await controller.getBalance('1020301234567801');
    expect(mockCardService.getBalance).toHaveBeenCalledWith('1020301234567801');
    expect(result.balance).toBe(100);
  });

  it('findById debe invocar a cardService.findById', async () => {
    const result = await controller.findById('1020301234567801');
    expect(mockCardService.findById).toHaveBeenCalledWith('1020301234567801');
    expect(result.cardId).toBe('1020301234567801');
  });
});
