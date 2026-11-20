import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;

  const tx = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
    product: {
      findUnique: jest.fn(),
    },
    inventoryMovement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
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
    tx.product.findUnique.mockResolvedValue({ id: 'product-1', stock: 10 });
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.product.update.mockResolvedValue({ id: 'product-1', stock: 15 });
    tx.inventoryMovement.create.mockResolvedValue(movement);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryMovementsService>(InventoryMovementsService);
  });

  it('registra una entrada e incrementa el stock dentro de la transacción', async () => {
    const result = await service.create({
      productId: 'product-1',
      type: MovementType.IN,
      quantity: 5,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stock: { increment: 5 } },
    });
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

  it('registra una salida y decrementa el stock de forma atómica', async () => {
    const result = await service.create({
      productId: 'product-1',
      type: MovementType.OUT,
      quantity: 4,
      description: 'Venta',
    });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product-1', stock: { gte: 4 } },
      data: { stock: { decrement: 4 } },
    });
    expect(result).toEqual(movement);
  });

  it('rechaza una salida con stock insuficiente sin registrar el movimiento', async () => {
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    tx.product.findUnique.mockResolvedValue({ id: 'product-1' });

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
    tx.product.findUnique.mockResolvedValue(null);

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
    tx.product.update.mockRejectedValue(new Error('DB down'));

    await expect(
      service.create({
        productId: 'product-1',
        type: MovementType.IN,
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    // El INSERT se ejecuta dentro del mismo callback: si el update falla,
    // Prisma revierte la transacción y este INSERT nunca se ejecuta.
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('no registra nada si falla la actualización de stock de una salida', async () => {
    tx.product.updateMany.mockRejectedValue(new Error('DB down'));

    await expect(
      service.create({
        productId: 'product-1',
        type: MovementType.OUT,
        quantity: 3,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('traduce un error de base de datos al insertar el movimiento a 500', async () => {
    tx.inventoryMovement.create.mockRejectedValue(new Error('DB down'));

    await expect(
      service.create({
        productId: 'product-1',
        type: MovementType.IN,
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.update).toHaveBeenCalled();
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
