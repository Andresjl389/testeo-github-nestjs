import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const price = { toString: () => '49.90' };
  const category = { id: 'category-1', name: 'Teclados' };
  const product = {
    id: 'product-1',
    name: 'Teclado mecánico',
    description: null,
    sku: 'TEC-001',
    price,
    stock: 25,
    minStock: 5,
    categoryId: category.id,
    category,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const prismaMock = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      fields: { minStock: 'FIELD_REF_minStock' },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('crea un producto y serializa el precio como texto', async () => {
    prismaMock.product.create.mockResolvedValue(product);

    const result = await service.create({
      name: '  Teclado mecánico  ',
      sku: '  TEC-001 ',
      price: 49.9,
      categoryId: category.id,
    });

    expect(result.price).toBe('49.90');
    expect(result.category).toEqual(category);
    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Teclado mecánico',
          sku: 'TEC-001',
          stock: 0,
          minStock: 0,
          categoryId: category.id,
        }),
      }),
    );
  });

  it('devuelve 409 si el SKU ya existe (P2002)', async () => {
    prismaMock.product.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({
        name: 'Teclado',
        sku: 'TEC-001',
        price: 10,
        categoryId: category.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('devuelve 404 si la categoría no existe (P2003 al crear)', async () => {
    prismaMock.product.create.mockRejectedValue({ code: 'P2003' });

    await expect(
      service.create({
        name: 'Teclado',
        sku: 'TEC-001',
        price: 10,
        categoryId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('aplica búsqueda, paginación y devuelve el formato acordado', async () => {
    prismaMock.product.findMany.mockResolvedValue([product]);
    prismaMock.product.count.mockResolvedValue(21);

    const result = await service.findAll({
      page: 2,
      limit: 10,
      search: 'teclado',
      categoryId: category.id,
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(prismaMock.product.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'teclado', mode: 'insensitive' } },
          { sku: { contains: 'teclado', mode: 'insensitive' } },
        ],
        categoryId: category.id,
      },
    });
    expect(result).toEqual({
      data: [expect.objectContaining({ price: '49.90' })],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('filtra lowStock comparando stock contra min_stock', async () => {
    prismaMock.product.findMany.mockResolvedValue([product]);
    prismaMock.product.count.mockResolvedValue(1);

    await service.findAll({ page: 1, limit: 10, lowStock: true });

    expect(prismaMock.product.count).toHaveBeenCalledWith({
      where: { stock: { lte: 'FIELD_REF_minStock' } },
    });
  });

  it('devuelve 404 si el producto no existe', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('devuelve 409 al eliminar un producto con movimientos (P2003)', async () => {
    prismaMock.product.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.remove(product.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('aplicaMovement incrementa el stock en una entrada (IN)', async () => {
    const tx = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: product.id }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn(),
      },
    };

    await service.applyMovement(
      product.id,
      { type: MovementType.IN, quantity: 5 },
      tx as never,
    );

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { stock: { increment: 5 } },
    });
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });

  it('aplicaMovement rechaza una salida sin stock suficiente', async () => {
    const tx = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: product.id }),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await expect(
      service.applyMovement(
        product.id,
        { type: MovementType.OUT, quantity: 999 },
        tx as never,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: product.id, stock: { gte: 999 } },
      data: { stock: { decrement: 999 } },
    });
  });

  it('exists responde según la cantidad encontrada', async () => {
    prismaMock.product.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(service.exists(product.id)).resolves.toBe(true);
    await expect(service.exists('missing')).resolves.toBe(false);
  });
});
