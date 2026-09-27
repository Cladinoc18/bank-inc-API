import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

describe('ClientController', () => {
  let controller: ClientController;
  let mockClientService: any;

  beforeEach(async () => {
    mockClientService = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'uuid-1', ...dto })),
      findAll: jest.fn().mockResolvedValue([{ id: 'uuid-1', firstName: 'Juan' }]),
      findOne: jest.fn().mockResolvedValue({ id: 'uuid-1', firstName: 'Juan' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create debe invocar clientService.create', async () => {
    const dto = {
      firstName: 'Ana',
      lastName: 'López',
      documentNumber: '11223344',
      email: 'ana@bankinc.com',
    };
    const result = await controller.create(dto);
    expect(mockClientService.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('uuid-1');
  });

  it('findAll debe invocar clientService.findAll', async () => {
    const result = await controller.findAll();
    expect(mockClientService.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('findOne debe invocar clientService.findOne', async () => {
    const result = await controller.findOne('uuid-1');
    expect(mockClientService.findOne).toHaveBeenCalledWith('uuid-1');
    expect(result.firstName).toBe('Juan');
  });
});
