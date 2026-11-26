/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Pruebas HTTP del CRUD de clínicas contra PostgreSQL real.
 * Requieren TEST_DATABASE_URL (el config de Jest carga .env automáticamente).
 */
const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface ClinicResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  specialty: string | null;
  active: boolean;
}

function payload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name: `Clínica ${randomUUID()}`,
    address: 'Calle 10 # 20-30',
    phone: '+57 300 1234567',
    email: 'contacto@example.com',
    specialty: 'Medicina general',
    active: true,
    ...overrides,
  };
}

describeWithDatabase('Clinics (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
    await prisma.clinic.deleteMany();
  });

  afterAll(async () => {
    await prisma.clinic.deleteMany();
    await app.close();
  });

  async function createClinic(
    overrides: Record<string, unknown> = {},
  ): Promise<ClinicResponse> {
    const response = await request(app.getHttpServer())
      .post('/clinics')
      .send(payload(overrides))
      .expect(201);

    return response.body as ClinicResponse;
  }

  it('crea una clínica con active por defecto y normaliza el correo', async () => {
    const data = payload({
      email: 'Contacto@Example.com',
      active: undefined,
    });
    const response = await request(app.getHttpServer())
      .post('/clinics')
      .send(data)
      .expect(201);

    expect(response.body).toMatchObject({
      name: data.name,
      address: 'Calle 10 # 20-30',
      phone: '+57 300 1234567',
      email: 'contacto@example.com',
      active: true,
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('rechaza un nombre duplicado con 409', async () => {
    const first = await createClinic();

    await request(app.getHttpServer())
      .post('/clinics')
      .send(payload({ name: first.name }))
      .expect(409);
  });

  it('rechaza teléfono y correo inválidos con 400', async () => {
    await request(app.getHttpServer())
      .post('/clinics')
      .send(payload({ phone: 'abc', email: 'no-es-correo' }))
      .expect(400);
  });

  it('lista las clínicas ordenadas por nombre', async () => {
    await createClinic({ name: `Z Clínica ${randomUUID()}` });
    await createClinic({ name: `A Clínica ${randomUUID()}` });

    const response = await request(app.getHttpServer())
      .get('/clinics')
      .expect(200);

    const names = (response.body as ClinicResponse[]).map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('consultar por id devuelve 200, 400 si no es UUID y 404 si no existe', async () => {
    const created = await createClinic();

    await request(app.getHttpServer())
      .get(`/clinics/${created.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as ClinicResponse).name).toBe(created.name);
      });

    await request(app.getHttpServer()).get('/clinics/no-uuid').expect(400);
    await request(app.getHttpServer())
      .get(`/clinics/${randomUUID()}`)
      .expect(404);
  });

  it('editar aplica cambios parciales y detecta nombres duplicados', async () => {
    const created = await createClinic();

    const response = await request(app.getHttpServer())
      .patch(`/clinics/${created.id}`)
      .send({ active: false, specialty: 'Urgencias' })
      .expect(200);

    expect(response.body).toMatchObject({
      active: false,
      specialty: 'Urgencias',
    });

    const other = await createClinic();
    await request(app.getHttpServer())
      .patch(`/clinics/${other.id}`)
      .send({ name: created.name })
      .expect(409);
  });

  it('elimina con 204 y luego el id ya no existe', async () => {
    const created = await createClinic();

    await request(app.getHttpServer())
      .delete(`/clinics/${created.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/clinics/${created.id}`)
      .expect(404);
  });
});
