import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Pruebas de integración contra una base de datos PostgreSQL real.
 * Se ejecutan solo si TEST_DATABASE_URL apunta a una base de datos de pruebas,
 * por ejemplo:
 *
 *   TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/inventory_management_test?schema=public" \
 *     npx prisma migrate deploy && npm run test:e2e
 */
const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface MovementResponse {
  type: 'IN' | 'OUT';
  quantity: number;
}

interface PaginatedResponse {
  data: MovementResponse[];
  total: number;
}

describeWithDatabase('Inventory movements (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let productId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "inventory_movements", "products", "categories" RESTART IDENTITY CASCADE',
    );

    const category = await prisma.category.create({
      data: { name: 'Categoría e2e', description: 'Categoría de prueba' },
    });
    const product = await prisma.product.create({
      data: {
        name: 'Producto e2e',
        sku: 'E2E-001',
        price: 10,
        stock: 10,
        minStock: 5,
        categoryId: category.id,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.inventoryMovement.deleteMany();
    await prisma.product.update({
      where: { id: productId },
      data: { stock: 10 },
    });
  });

  it('registra una entrada y aumenta el stock', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'IN', quantity: 5, description: 'Compra' })
      .expect(201)
      .expect(({ body }: { body: MovementResponse }) => {
        expect(body.type).toBe('IN');
        expect(body.quantity).toBe(5);
      });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(product?.stock).toBe(15);
  });

  it('registra una salida y disminuye el stock', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'OUT', quantity: 4, description: 'Venta' })
      .expect(201);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(product?.stock).toBe(6);
  });

  it('rechaza una salida sin stock suficiente y no registra nada', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'OUT', quantity: 999 })
      .expect(409);

    const [product, count] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.inventoryMovement.count(),
    ]);
    expect(product?.stock).toBe(10);
    expect(count).toBe(0);
  });

  it('valida los datos de entrada con ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'IN', quantity: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId: 'no-es-uuid', type: 'IN', quantity: 1 })
      .expect(400);
  });

  it('devuelve 404 si el producto no existe y no registra el movimiento', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({
        productId: '00000000-0000-4000-8000-000000000000',
        type: 'IN',
        quantity: 1,
      })
      .expect(404);

    expect(await prisma.inventoryMovement.count()).toBe(0);
  });

  it('revierte el stock si falla la inserción dentro de la transacción', async () => {
    // Extension de Prisma que fuerza un error de base de datos solo en el INSERT.
    const failingPrisma = prisma.$extends({
      query: {
        inventoryMovement: {
          create: () =>
            Promise.reject(new Error('Fallo forzado de base de datos')),
        },
      },
    });

    const failingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(failingPrisma)
      .compile();
    const failingApp: INestApplication<App> =
      failingModule.createNestApplication();
    failingApp.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await failingApp.init();

    try {
      await request(failingApp.getHttpServer())
        .post('/inventory-movements')
        .send({ productId, type: 'IN', quantity: 5 })
        .expect(500);

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      expect(product?.stock).toBe(10);
      expect(await prisma.inventoryMovement.count()).toBe(0);
    } finally {
      await failingApp.close();
    }
  });

  it('filtra por tipo, producto y rango de fechas, y pagina', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'IN', quantity: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'OUT', quantity: 2 })
      .expect(201);

    await request(app.getHttpServer())
      .get('/inventory-movements')
      .query({ type: 'OUT', productId, page: 1, limit: 1 })
      .expect(200)
      .expect(({ body }: { body: PaginatedResponse }) => {
        expect(body.total).toBe(1);
        expect(body.data).toHaveLength(1);
        expect(body.data[0].type).toBe('OUT');
      });

    await request(app.getHttpServer())
      .get(`/inventory-movements/product/${productId}`)
      .expect(200)
      .expect(({ body }: { body: PaginatedResponse }) =>
        expect(body.total).toBe(2),
      );
  });

  it('mantiene la integridad referencial al intentar borrar producto o categoría', async () => {
    await request(app.getHttpServer())
      .post('/inventory-movements')
      .send({ productId, type: 'IN', quantity: 1 })
      .expect(201);

    await expect(
      prisma.product.delete({ where: { id: productId } }),
    ).rejects.toThrow();
    await expect(
      prisma.category.deleteMany({ where: { name: 'Categoría e2e' } }),
    ).rejects.toThrow();

    expect(await prisma.product.count()).toBe(1);
    expect(await prisma.inventoryMovement.count()).toBe(1);
  });
});
