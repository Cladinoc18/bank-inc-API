import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';

describe('ClientService', () => {
  let service: ClientService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'uuid-123' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'uuid-123' })),
      count: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un nuevo cliente si no existe conflicto', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const dto = {
        firstName: 'Carlos',
        lastName: 'Gómez',
        documentNumber: '9876543210',
        email: 'carlos@bankinc.com',
      };

      const result = await service.create(dto);

      expect(result).toHaveProperty('id');
      expect(result.firstName).toBe('Carlos');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el documento o correo ya existen', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      const dto = {
        firstName: 'Carlos',
        lastName: 'Gómez',
        documentNumber: '9876543210',
        email: 'carlos@bankinc.com',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar la lista de clientes', async () => {
      mockRepository.find.mockResolvedValue([{ id: 'uuid-1', firstName: 'Juan' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar un cliente si existe', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'uuid-1', firstName: 'Juan' });
      const result = await service.findOne('uuid-1');
      expect(result.firstName).toBe('Juan');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('seedInitialClients', () => {
    it('debe crear cliente inicial si la tabla está vacía', async () => {
      mockRepository.count.mockResolvedValue(0);
      await service.seedInitialClients();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('no debe crear cliente inicial si ya existen clientes', async () => {
      mockRepository.count.mockResolvedValue(5);
      await service.seedInitialClients();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
