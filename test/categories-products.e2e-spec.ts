/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/only-throw-error -- El doble de Prisma es dinámico a propósito: simula consultas y errores de la BD para las pruebas HTTP. */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Pruebas de integración (capa HTTP): pasan por los controladores, pipes,
 * DTOs y servicios reales. PrismaService se sustituye por un doble en memoria
 * que replica las restricciones de la BD (UK y FK Restrict), para que la suite
 * no dependa de un PostgreSQL en ejecución. Las reglas de BD en sí están
 * cubiertas por la migración y por las pruebas unitarias de los servicios.
 */
type Row = Record<string, any>;

function createPrismaFake() {
  const categories: Row[] = [];
  const products: Row[] = [];
  const movements: Row[] = [];

  const MIN_STOCK_REF = { fieldRef: 'minStock' };
  const timestamp = () => new Date();

  const withCategory = (row: Row, include?: unknown) => {
    if (!include) return row;
    const category = categories.find((item) => item.id === row.categoryId);
    return {
      ...row,
      category: category ? { id: category.id, name: category.name } : null,
    };
  };

  const matches = (row: Row, where: Row = {}): boolean =>
    Object.entries(where).every(([key, condition]) => {
      if (key === 'OR') {
        return (condition as Row[]).some((sub) => matches(row, sub));
      }
      const value = row[key];
      if (
        condition &&
        typeof condition === 'object' &&
        !(condition instanceof Date)
      ) {
        return Object.entries(condition as Row).every(([operator, operand]) => {
          switch (operator) {
            case 'contains':
              return String(value)
                .toLowerCase()
                .includes(String(operand).toLowerCase());
            case 'mode':
              return true;
            case 'gte':
              return value >= (operand as number);
            case 'lte':
              return (
                value <=
                (operand === MIN_STOCK_REF ? row.minStock : (operand as number))
              );
            case 'equals':
              return value === operand;
            default:
              return true;
          }
        });
      }
      return value === condition;
    });

  const paginateRows = (rows: Row[], args: Row = {}) => {
    const sorted = [...rows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return sorted.slice(
      args.skip ?? 0,
      (args.skip ?? 0) + (args.take ?? rows.length),
    );
  };

  const prisma: Row = {
    category: {
      create: jest.fn(async ({ data }: Row) => {
        if (categories.some((item) => item.name === data.name)) {
          throw { code: 'P2002' };
        }
        const row = {
          id: randomUUID(),
          description: null,
          createdAt: timestamp(),
          updatedAt: timestamp(),
          ...data,
        };
        categories.push(row);
        return row;
      }),
      findMany: jest.fn(async () => [...categories]),
      findUnique: jest.fn(async ({ where, include }: Row) => {
        const row = categories.find((item) => item.id === where.id);
        if (!row) return null;
        if (include?.products) {
          return {
            ...row,
            products: products.filter((item) => item.categoryId === row.id),
          };
        }
        return row;
      }),
      update: jest.fn(async ({ where, data }: Row) => {
        const index = categories.findIndex((item) => item.id === where.id);
        if (index < 0) throw { code: 'P2025' };
        if (
          data.name &&
          categories.some((item, i) => i !== index && item.name === data.name)
        ) {
          throw { code: 'P2002' };
        }
        categories[index] = {
          ...categories[index],
          ...data,
          updatedAt: timestamp(),
        };
        return categories[index];
      }),
      delete: jest.fn(async ({ where }: Row) => {
        const index = categories.findIndex((item) => item.id === where.id);
        if (index < 0) throw { code: 'P2025' };
        if (products.some((item) => item.categoryId === where.id)) {
          throw { code: 'P2003' };
        }
        return categories.splice(index, 1)[0];
      }),
    },
    product: {
      fields: { minStock: MIN_STOCK_REF },
      create: jest.fn(async ({ data, include }: Row) => {
        if (products.some((item) => item.sku === data.sku)) {
          throw { code: 'P2002' };
        }
        if (!categories.some((item) => item.id === data.categoryId)) {
          throw { code: 'P2003' };
        }
        const row = {
          id: randomUUID(),
          description: null,
          stock: 0,
          minStock: 0,
          createdAt: timestamp(),
          updatedAt: timestamp(),
          ...data,
        };
        products.push(row);
        return withCategory(row, include);
      }),
      findMany: jest.fn(async ({ where, include, skip, take }: Row = {}) =>
        paginateRows(
          products.filter((item) => matches(item, where)),
          { skip, take },
        ).map((row) => withCategory(row, include)),
      ),
      findUnique: jest.fn(async ({ where, include }: Row) => {
        const row = products.find((item) => item.id === where.id);
        return row ? withCategory(row, include) : null;
      }),
      count: jest.fn(
        async ({ where }: Row = {}) =>
          products.filter((item) => matches(item, where)).length,
      ),
      update: jest.fn(async ({ where, data, include }: Row) => {
        const index = products.findIndex((item) => item.id === where.id);
        if (index < 0) throw { code: 'P2025' };
        if (
          data.sku &&
          products.some((item, i) => i !== index && item.sku === data.sku)
        ) {
          throw { code: 'P2002' };
        }
        if (
          data.categoryId &&
          !categories.some((item) => item.id === data.categoryId)
        ) {
          throw { code: 'P2003' };
        }
        products[index] = {
          ...products[index],
          ...data,
          updatedAt: timestamp(),
        };
        return withCategory(products[index], include);
      }),
      updateMany: jest.fn(async ({ where, data }: Row) => {
        let count = 0;
        products.forEach((row) => {
          if (!matches(row, where)) return;
          if (data.stock?.increment) row.stock += data.stock.increment;
          if (data.stock?.decrement) row.stock -= data.stock.decrement;
          count += 1;
        });
        return { count };
      }),
      delete: jest.fn(async ({ where }: Row) => {
        const index = products.findIndex((item) => item.id === where.id);
        if (index < 0) throw { code: 'P2025' };
        if (movements.some((item) => item.productId === where.id)) {
          throw { code: 'P2003' };
        }
        return products.splice(index, 1)[0];
      }),
    },
    inventoryMovement: {
      create: jest.fn(async ({ data }: Row) => {
        const row = {
          id: randomUUID(),
          description: null,
          createdAt: timestamp(),
          ...data,
        };
        movements.push(row);
        return row;
      }),
      findMany: jest.fn(async () => [...movements]),
      findUnique: jest.fn(
        async ({ where }: Row) =>
          movements.find((item) => item.id === where.id) ?? null,
      ),
      count: jest.fn(async () => movements.length),
    },
    $transaction: jest.fn(async (callback: (tx: Row) => Promise<unknown>) =>
      callback(prisma),
    ),
  };

  return { prisma, categories, products, movements };
}

describe('Categorías y productos (integración HTTP)', () => {
  let app: INestApplication<App>;
  let fake: ReturnType<typeof createPrismaFake>;

  beforeEach(async () => {
    fake = createPrismaFake();
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(fake.prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const createCategory = async (name: string) =>
    request(app.getHttpServer()).post('/categories').send({ name }).expect(201);

  const createProduct = async (
    categoryId: string,
    sku: string,
    overrides: Row = {},
  ) =>
    request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Teclado mecánico',
        sku,
        price: 49.9,
        categoryId,
        ...overrides,
      })
      .expect(201);

  it('crea una categoría y rechaza el duplicado con 409', async () => {
    await createCategory('Teclados');

    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Teclados' })
      .expect(409)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(409);
        expect(body.message).toContain('Ya existe una categoría');
      });
  });

  it('no elimina una categoría que tiene productos (409)', async () => {
    const category = await createCategory('Teclados');
    await createProduct(category.body.id, 'TEC-001');

    await request(app.getHttpServer())
      .delete(`/categories/${category.body.id}`)
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('productos asociados');
      });

    expect(fake.categories).toHaveLength(1);
  });

  it('crea un producto y rechaza un SKU duplicado con 409', async () => {
    const category = await createCategory('Teclados');
    const created = await createProduct(category.body.id, 'TEC-001');

    expect(created.body.price).toBe('49.9');
    expect(created.body.category).toEqual({
      id: category.body.id,
      name: 'Teclados',
    });

    await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Otro teclado',
        sku: 'TEC-001',
        price: 20,
        categoryId: category.body.id,
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('SKU');
      });
  });

  it('no elimina un producto que tiene movimientos (409)', async () => {
    const category = await createCategory('Teclados');
    const product = await createProduct(category.body.id, 'TEC-002', {
      stock: 10,
    });

    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId: product.body.id, type: 'IN', quantity: 5 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/products/${product.body.id}`)
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toContain('movimientos asociados');
      });

    expect(fake.products).toHaveLength(1);
  });

  it('elimina un producto sin movimientos y devuelve 204', async () => {
    const category = await createCategory('Teclados');
    const product = await createProduct(category.body.id, 'TEC-003');

    await request(app.getHttpServer())
      .delete(`/products/${product.body.id}`)
      .expect(204);

    expect(fake.products).toHaveLength(0);
  });

  it('filtra por búsqueda y lowStock con paginación', async () => {
    const category = await createCategory('Teclados');
    await createProduct(category.body.id, 'TEC-010', { stock: 2, minStock: 5 });
    await createProduct(category.body.id, 'TEC-011', {
      stock: 20,
      minStock: 5,
    });

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ search: 'teclado', lowStock: 'true', page: 1, limit: 10 })
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.data[0].sku).toBe('TEC-010');
    expect(response.body).toEqual(
      expect.objectContaining({ page: 1, limit: 10, totalPages: 1 }),
    );
  });

  it('devuelve 400 si el id no es UUID o el DTO es inválido', async () => {
    await request(app.getHttpServer()).get('/products/no-es-uuid').expect(400);

    await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Sin SKU', price: -1 })
      .expect(400);
  });
});
