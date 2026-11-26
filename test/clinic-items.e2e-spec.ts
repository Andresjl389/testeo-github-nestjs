import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Pruebas HTTP del inventario independiente por clínica.
 * Requieren TEST_DATABASE_URL (el config de Jest carga .env automáticamente).
 */
const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface ClinicResponse {
  id: string;
  name: string;
}

interface ItemResponse {
  id: string;
  clinicId: string;
  name: string;
  sku: string | null;
  quantity: number;
  minStock: number;
  unit: string | null;
  description: string | null;
}

function itemPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name: `Insumo ${randomUUID()}`,
    sku: 'JER-10',
    quantity: 25,
    minStock: 5,
    unit: 'unidades',
    description: 'Uso en consulta externa',
    ...overrides,
  };
}

describeWithDatabase('Clinic items (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let clinicA: ClinicResponse;
  let clinicB: ClinicResponse;

  const itemsUrl = (clinicId: string) => `/clinics/${clinicId}/items`;

  async function createItem(
    clinicId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<ItemResponse> {
    const response = await request(app.getHttpServer())
      .post(itemsUrl(clinicId))
      .send(itemPayload(overrides))
      .expect(201);

    return response.body as ItemResponse;
  }

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
  });

  beforeEach(async () => {
    await prisma.clinicInventoryItem.deleteMany();
    await prisma.clinic.deleteMany();

    clinicA = await prisma.clinic.create({
      data: {
        name: `Clínica A ${randomUUID()}`,
        address: 'Calle 1',
        phone: '+57 300 1111111',
      },
    });
    clinicB = await prisma.clinic.create({
      data: {
        name: `Clínica B ${randomUUID()}`,
        address: 'Calle 2',
        phone: '+57 300 2222222',
      },
    });
  });

  afterAll(async () => {
    await prisma.clinicInventoryItem.deleteMany();
    await prisma.clinic.deleteMany();
    await app.close();
  });

  it('crea un insumo con valores por defecto', async () => {
    const response = await request(app.getHttpServer())
      .post(itemsUrl(clinicA.id))
      .send({ name: 'Jeringas 10 ml' })
      .expect(201);

    expect(response.body).toMatchObject({
      clinicId: clinicA.id,
      name: 'Jeringas 10 ml',
      sku: null,
      quantity: 0,
      minStock: 0,
      unit: null,
      description: null,
    });
  });

  it('rechaza un nombre repetido dentro de la misma clínica con 409', async () => {
    const first = await createItem(clinicA.id);

    await request(app.getHttpServer())
      .post(itemsUrl(clinicA.id))
      .send(itemPayload({ name: first.name }))
      .expect(409);
  });

  it('permite el mismo nombre en otra clínica', async () => {
    const first = await createItem(clinicA.id);
    const second = await createItem(clinicB.id, { name: first.name });

    expect(second.id).not.toBe(first.id);
    expect(second.clinicId).toBe(clinicB.id);
  });

  it('rechaza cantidades negativas con 400', async () => {
    await request(app.getHttpServer())
      .post(itemsUrl(clinicA.id))
      .send(itemPayload({ quantity: -1 }))
      .expect(400);
  });

  it('lista únicamente los insumos de la clínica solicitada', async () => {
    const fromA = await createItem(clinicA.id);
    await createItem(clinicB.id);

    const response = await request(app.getHttpServer())
      .get(itemsUrl(clinicA.id))
      .expect(200);

    const items = response.body as ItemResponse[];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(fromA.id);
  });

  it('consultar por id respeta la clínica y valida UUIDs', async () => {
    const item = await createItem(clinicA.id);
    const other = await createItem(clinicB.id);

    await request(app.getHttpServer())
      .get(`${itemsUrl(clinicA.id)}/${item.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as ItemResponse).name).toBe(item.name);
      });

    await request(app.getHttpServer())
      .get(`${itemsUrl(clinicA.id)}/${other.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`${itemsUrl(clinicA.id)}/no-uuid`)
      .expect(400);
  });

  it('edita parcialmente y detecta nombres duplicados', async () => {
    const first = await createItem(clinicA.id);
    const second = await createItem(clinicA.id);

    const response = await request(app.getHttpServer())
      .patch(`${itemsUrl(clinicA.id)}/${first.id}`)
      .send({ quantity: 40, minStock: 10 })
      .expect(200);

    expect(response.body).toMatchObject({ quantity: 40, minStock: 10 });

    await request(app.getHttpServer())
      .patch(`${itemsUrl(clinicA.id)}/${second.id}`)
      .send({ name: first.name })
      .expect(409);
  });

  it('elimina el insumo sin borrar la clínica', async () => {
    const item = await createItem(clinicA.id);

    await request(app.getHttpServer())
      .delete(`${itemsUrl(clinicA.id)}/${item.id}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`${itemsUrl(clinicA.id)}/${item.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/clinics/${clinicA.id}`)
      .expect(200);
  });

  it('responde 404 si la clínica no existe', async () => {
    const missingId = randomUUID();

    await request(app.getHttpServer())
      .post(itemsUrl(missingId))
      .send(itemPayload())
      .expect(404);
    await request(app.getHttpServer()).get(itemsUrl(missingId)).expect(404);
  });
});
