import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface AgendaEntry {
  id: string;
  scheduledAt: string;
  reason: string;
  status: string;
  clinic: { id: string; name: string };
  patient: { id: string; name: string };
}

describeWithDatabase('Agenda (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let clinicId: string;
  let patientId: string;
  let appointmentId: string;
  const day = '2028-04-12';

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
    await prisma.appointmentComment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicPatient.deleteMany();
    await prisma.clinic.deleteMany();

    const clinic = await prisma.clinic.create({
      data: {
        name: `Clinica agenda ${randomUUID()}`,
        address: 'Calle 10',
        phone: '+57 300 1000000',
      },
    });
    const patient = await prisma.clinicPatient.create({
      data: {
        clinicId: clinic.id,
        name: 'Ana Torres',
        document: 'CC 333',
        phone: '+57 300 2000000',
      },
    });
    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        scheduledAt: new Date(`${day}T09:30:00.000Z`),
        durationMinutes: 45,
        reason: 'Control general',
      },
    });
    clinicId = clinic.id;
    patientId = patient.id;
    appointmentId = appointment.id;
  });

  afterAll(async () => {
    await prisma.appointmentComment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicPatient.deleteMany();
    await prisma.clinic.deleteMany();
    await app.close();
  });

  it('devuelve las citas del día con clínica y paciente', async () => {
    const response = await request(app.getHttpServer())
      .get(`/agenda?date=${day}`)
      .expect(200);

    const entries = response.body as AgendaEntry[];
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: appointmentId,
      reason: 'Control general',
      status: 'PENDING',
      clinic: { id: clinicId },
      patient: { id: patientId, name: 'Ana Torres' },
    });
  });

  it('devuelve una lista vacía para días sin citas', async () => {
    await request(app.getHttpServer())
      .get('/agenda?date=2028-04-13')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown[]).toEqual([]);
      });
  });

  it('filtra por rango de fechas', async () => {
    await request(app.getHttpServer())
      .get('/agenda?start=2028-04-10&end=2028-04-14')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown[]).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .get('/agenda?start=2028-04-13&end=2028-04-14')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown[]).toHaveLength(0);
      });
  });

  it('valida el formato de las fechas y el rango', async () => {
    await request(app.getHttpServer())
      .get('/agenda?date=12-04-2028')
      .expect(400);
    await request(app.getHttpServer())
      .get('/agenda?start=2028-04-10')
      .expect(400);
    await request(app.getHttpServer())
      .get('/agenda?start=2028-04-14&end=2028-04-10')
      .expect(400);
  });
});
