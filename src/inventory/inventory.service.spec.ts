import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const prisma = {
    product: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryMovement: {
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('calcula el resumen con agregaciones y el top de movimientos', async () => {
    prisma.product.aggregate.mockResolvedValue({
      _count: { _all: 12 },
      _sum: { stock: 340 },
    });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ total: '1250.75' }]);
    prisma.product.count.mockResolvedValue(2);
    prisma.inventoryMovement.groupBy.mockResolvedValue([
      { productId: 'p1', _count: { _all: 8 } },
      { productId: 'p2', _count: { _all: 5 } },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'Teclado', sku: 'TEC-1' },
      { id: 'p2', name: 'Ratón', sku: 'RAT-1' },
    ]);

    const result = await service.getSummary();

    expect(result).toEqual({
      totalProducts: 12,
      totalUnits: 340,
      lowStockProducts: 3,
      outOfStockProducts: 2,
      totalValue: 1250.75,
      topProducts: [
        { productId: 'p1', name: 'Teclado', sku: 'TEC-1', movementCount: 8 },
        { productId: 'p2', name: 'Ratón', sku: 'RAT-1', movementCount: 5 },
      ],
    });
    expect(prisma.inventoryMovement.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('devuelve productos con stock bajo paginados', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Teclado',
          sku: 'TEC-1',
          stock: 2,
          minStock: 5,
          price: '49.99',
        },
      ])
      .mockResolvedValueOnce([{ count: 7 }]);

    const result = await service.getLowStock({ page: 2, limit: 10 });

    expect(result).toEqual({
      data: [
        {
          id: 'p1',
          name: 'Teclado',
          sku: 'TEC-1',
          stock: 2,
          minStock: 5,
          price: 49.99,
        },
      ],
      total: 7,
      page: 2,
      limit: 10,
      totalPages: 1,
    });
  });

  it('devuelve productos sin existencias y convierte el precio', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p3',
        name: 'Cable',
        sku: 'CAB-1',
        stock: 0,
        minStock: 2,
        price: '9.50',
      },
    ]);
    prisma.product.count.mockResolvedValue(1);

    const result = await service.getOutOfStock({ page: 1, limit: 10 });

    expect(result.data[0].price).toBe(9.5);
    expect(result.total).toBe(1);
  });

  it('traduce errores de base de datos a 500', async () => {
    prisma.product.aggregate.mockRejectedValue(new Error('DB unavailable'));

    await expect(service.getSummary()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
