import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;

  const tx = {
    inventoryMovement: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
    inventoryMovement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  const products = {
    applyMovement: jest.fn(),
  };

  const movement = {
    id: 'movement-1',
    productId: 'product-1',
    type: MovementType.IN,
    quantity: 5,
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: unknown) => {
      return (callback as (client: typeof tx) => Promise<unknown>)(tx);
    });
    products.applyMovement.mockResolvedValue(undefined);
    tx.inventoryMovement.create.mockResolvedValue(movement);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProductsService, useValue: products },
      ],
    }).compile();

    service = module.get<InventoryMovementsService>(InventoryMovementsService);
  });

  it('registra una entrada delegando el stock a ProductsService dentro de la transacción', async () => {
    const dto = {
      productId: 'product-1',
      type: MovementType.IN,
      quantity: 5,
    };
    const result = await service.create(dto);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(products.applyMovement).toHaveBeenCalledWith('product-1', dto, tx);
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-1',
        type: MovementType.IN,
        quantity: 5,
        description: undefined,
      },
    });
    expect(result).toEqual(movement);
  });

  it('registra una salida pasando el tipo OUT a ProductsService', async () => {
    const dto = {
      productId: 'product-1',
      type: MovementType.OUT,
      quantity: 4,
      description: 'Venta',
    };
    const result = await service.create(dto);

    expect(products.applyMovement).toHaveBeenCalledWith('product-1', dto, tx);
    expect(result).toEqual(movement);
  });

  it('rechaza una salida con stock insuficiente sin registrar el movimiento', async () => {
    products.applyMovement.mockRejectedValue(
      new ConflictException('Stock insuficiente'),
    );

    await expect(
      service.create({
        productId: 'product-1',
        type: MovementType.OUT,
        quantity: 999,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('rechaza un movimiento de un producto inexistente', async () => {
    products.applyMovement.mockRejectedValue(
      new NotFoundException('Producto no encontrado'),
    );

    await expect(
      service.create({
        productId: 'missing-id',
        type: MovementType.IN,
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('no deja un movimiento parcial si falla la actualización de stock', async () => {
    products.applyMovement.mockRejectedValue(new Error('DB down'));

    await expect(
      service.create({
        productId: 'product-1',
        type: MovementType.IN,
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    // El INSERT está dentro del mismo callback: si falla el update,
    // Prisma revierte la transacción y este INSERT nunca se ejecuta.
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('traduce errores inesperados de base de datos a 500', async () => {
    prisma.inventoryMovement.findMany.mockRejectedValue(
      new Error('connection lost'),
    );

    await expect(
      service.findAll({ page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('aplica filtros y paginación al listar movimientos', async () => {
    prisma.inventoryMovement.findMany.mockResolvedValue([movement]);
    prisma.inventoryMovement.count.mockResolvedValue(21);

    const result = await service.findAll({
      page: 2,
      limit: 10,
      type: MovementType.OUT,
      productId: 'product-1',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
    });

    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(prisma.inventoryMovement.count).toHaveBeenCalledWith({
      where: {
        type: MovementType.OUT,
        productId: 'product-1',
        createdAt: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lte: new Date('2026-01-31T23:59:59.999Z'),
        },
      },
    });
    expect(result).toEqual({
      data: [movement],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });
});
