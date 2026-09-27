import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionStatus } from './entities/transaction.entity';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockTransactionService: any;

  beforeEach(async () => {
    mockTransactionService = {
      purchase: jest.fn().mockResolvedValue({
        transactionId: '102030',
        cardId: '1020301234567801',
        price: 100,
        status: TransactionStatus.APPROVED,
        remainingBalance: 900,
      }),
      findById: jest.fn().mockResolvedValue({
        transactionId: '102030',
        price: 100,
        status: TransactionStatus.APPROVED,
      }),
      anulate: jest.fn().mockResolvedValue({
        message: 'Transacción anulada exitosamente',
        transactionId: '102030',
        refundedAmount: 100,
        status: TransactionStatus.ANNULLED,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('purchase debe invocar transactionService.purchase', async () => {
    const dto = { cardId: '1020301234567801', price: 100 };
    const result = await controller.purchase(dto);
    expect(mockTransactionService.purchase).toHaveBeenCalledWith(dto);
    expect(result.transactionId).toBe('102030');
  });

  it('findById debe invocar transactionService.findById', async () => {
    const result = await controller.findById('102030');
    expect(mockTransactionService.findById).toHaveBeenCalledWith('102030');
    expect(result.transactionId).toBe('102030');
  });

  it('anulate debe invocar transactionService.anulate', async () => {
    const dto = { cardId: '1020301234567801', transactionId: '102030' };
    const result = await controller.anulate(dto);
    expect(mockTransactionService.anulate).toHaveBeenCalledWith(dto);
    expect(result.status).toBe(TransactionStatus.ANNULLED);
  });
});
