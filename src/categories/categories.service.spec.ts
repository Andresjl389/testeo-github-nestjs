import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const category = {
    id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    name: 'Teclados',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const prismaMock = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('crea una categoría recortando el nombre', async () => {
    prismaMock.category.create.mockResolvedValue(category);

    await expect(
      service.create({ name: '  Teclados  ', description: '  ' }),
    ).resolves.toEqual(category);
    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: 'Teclados', description: null },
    });
  });

  it('devuelve 409 si el nombre ya existe (P2002)', async () => {
    prismaMock.category.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create({ name: 'Teclados' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('devuelve 404 si la categoría no existe (P2025)', async () => {
    prismaMock.category.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.update(category.id, { name: 'Otros' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve 409 al eliminar una categoría con productos (P2003)', async () => {
    prismaMock.category.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.remove(category.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('devuelve los productos de la categoría con price como texto', async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      ...category,
      products: [
        {
          id: 'a2f6e3d1-1234-4c8a-9b7e-1a2b3c4d5e6f',
          name: 'Teclado mecánico',
          sku: 'TEC-001',
          price: { toString: () => '49.90' },
          stock: 25,
          minStock: 5,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
    });

    const products = await service.findProducts(category.id);

    expect(products).toHaveLength(1);
    expect(products[0].price).toBe('49.90');
    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
      where: { id: category.id },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });
  });
});
