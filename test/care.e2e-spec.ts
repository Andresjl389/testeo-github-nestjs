import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Pruebas HTTP de pacientes, citas e historial de comentarios por clínica.
 * Requieren TEST_DATABASE_URL (el config de Jest carga .env automáticamente).
 */
const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface ClinicResponse {
  id: string;
  name: string;
}

interface PatientResponse {
  id: string;
  clinicId: string;
  name: string;
  document: string | null;
  phone: string;
}

interface AppointmentResponse {
  id: string;
  clinicId: string;
  patientId: string;
  scheduledAt: string;
  durationMinutes: number;
  reason: string;
  status: string;
}

interface CommentResponse {
  id: string;
  appointmentId: string;
  author: string;
  body: string;
}

function futureIso(offsetMinutes = 60): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

describeWithDatabase('Care: patients, appointments, comments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let clinicA: ClinicResponse;
  let clinicB: ClinicResponse;
  let patientA: PatientResponse;
  let patientB: PatientResponse;

  const patientsUrl = (clinicId: string) => `/clinics/${clinicId}/patients`;
  const appointmentsUrl = (clinicId: string) =>
    `/clinics/${clinicId}/appointments`;
  const commentsUrl = (clinicId: string, appointmentId: string) =>
    `${appointmentsUrl(clinicId)}/${appointmentId}/comments`;

  async function createPatient(
    clinicId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<PatientResponse> {
    const response = await request(app.getHttpServer())
      .post(patientsUrl(clinicId))
      .send({
        name: `Paciente ${randomUUID()}`,
        document: `CC ${randomUUID().slice(0, 10)}`,
        phone: '+57 300 1234567',
        ...overrides,
      })
      .expect(201);
    return response.body as PatientResponse;
  }

  async function createAppointment(
    clinicId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<AppointmentResponse> {
    const response = await request(app.getHttpServer())
      .post(appointmentsUrl(clinicId))
      .send({
        patientId: clinicId === clinicA.id ? patientA.id : patientB.id,
        scheduledAt: futureIso(),
        reason: 'Control general',
        ...overrides,
      })
      .expect(201);
    return response.body as AppointmentResponse;
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
    await prisma.appointmentComment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicPatient.deleteMany();
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
    patientA = await prisma.clinicPatient.create({
      data: {
        clinicId: clinicA.id,
        name: 'Ana Torres',
        document: 'CC 111111',
        phone: '+57 300 1234567',
      },
    });
    patientB = await prisma.clinicPatient.create({
      data: {
        clinicId: clinicB.id,
        name: 'Luis Pérez',
        document: 'CC 222222',
        phone: '+57 300 7654321',
      },
    });
  });

  afterAll(async () => {
    await prisma.appointmentComment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicPatient.deleteMany();
    await prisma.clinic.deleteMany();
    await app.close();
  });

  it('registra un paciente y rechaza documento duplicado sólo en su clínica', async () => {
    const created = await createPatient(clinicA.id, {
      email: 'Ana@Example.com',
      birthDate: '1990-05-20',
      active: undefined,
    });

    expect(created).toMatchObject({
      clinicId: clinicA.id,
      active: true,
    });

    await request(app.getHttpServer())
      .post(patientsUrl(clinicA.id))
      .send({
        name: 'Otro paciente',
        document: 'CC 111111',
        phone: '+57 300 1234567',
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(patientsUrl(clinicB.id))
      .send({
        name: 'Paciente con el mismo documento',
        document: 'CC 111111',
        phone: '+57 300 1234567',
      })
      .expect(201);
  });

  it('valida teléfono, correo y UUID de la clínica', async () => {
    await request(app.getHttpServer())
      .post(patientsUrl(clinicA.id))
      .send({ name: 'Paciente', phone: 'abc', email: 'sin-arroba' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/clinics/no-uuid/patients')
      .expect(400);
  });

  it('aísla los pacientes por clínica', async () => {
    await request(app.getHttpServer())
      .get(patientsUrl(clinicA.id))
      .expect(200)
      .expect(({ body }) => {
        const patients = body as PatientResponse[];
        expect(patients).toHaveLength(1);
        expect(patients[0].id).toBe(patientA.id);
      });

    await request(app.getHttpServer())
      .get(`${patientsUrl(clinicA.id)}/${patientB.id}`)
      .expect(404);
  });

  it('programa una cita futura con estado PENDING y duración por defecto', async () => {
    const scheduledAt = futureIso(120);
    const created = await createAppointment(clinicA.id, {
      scheduledAt,
      reason: '  Control general  ',
    });

    expect(created).toMatchObject({
      clinicId: clinicA.id,
      patientId: patientA.id,
      scheduledAt,
      durationMinutes: 30,
      reason: 'Control general',
      status: 'PENDING',
    });
    expect(
      (await prisma.appointment.findUnique({ where: { id: created.id } }))
        ?.notes,
    ).toBeNull();
  });

  it('rechaza fechas pasadas y pacientes de otra clínica', async () => {
    await request(app.getHttpServer())
      .post(appointmentsUrl(clinicA.id))
      .send({
        patientId: patientA.id,
        scheduledAt: '2020-01-01T00:00:00.000Z',
        reason: 'Control',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(appointmentsUrl(clinicA.id))
      .send({
        patientId: patientB.id,
        scheduledAt: futureIso(),
        reason: 'Control',
      })
      .expect(404);
  });

  it('rechaza solapes en la misma clínica y permite el mismo horario en otra', async () => {
    const at = futureIso(90);
    await createAppointment(clinicA.id, { scheduledAt: at });

    await request(app.getHttpServer())
      .post(appointmentsUrl(clinicA.id))
      .send({
        patientId: patientA.id,
        scheduledAt: new Date(
          new Date(at).getTime() + 10 * 60_000,
        ).toISOString(),
        reason: 'Otra cita',
      })
      .expect(409);

    await createAppointment(clinicB.id, { scheduledAt: at });
  });

  it('filtra citas por estado y por día', async () => {
    const scheduledAt = futureIso(180);
    await createAppointment(clinicA.id, {
      scheduledAt,
      status: 'CONFIRMED',
    });
    const date = scheduledAt.slice(0, 10);

    await request(app.getHttpServer())
      .get(`${appointmentsUrl(clinicA.id)}?status=CONFIRMED&date=${date}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as AppointmentResponse[]).toHaveLength(1);
      });
    await request(app.getHttpServer())
      .get(`${appointmentsUrl(clinicA.id)}?status=PENDING`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as AppointmentResponse[]).toHaveLength(0);
      });
  });

  it('reprograma y cancela una cita', async () => {
    const created = await createAppointment(clinicA.id);

    const rescheduled = await request(app.getHttpServer())
      .patch(`${appointmentsUrl(clinicA.id)}/${created.id}`)
      .send({ scheduledAt: futureIso(240), durationMinutes: 45 })
      .expect(200);
    expect(rescheduled.body).toMatchObject({ durationMinutes: 45 });

    await request(app.getHttpServer())
      .patch(`${appointmentsUrl(clinicA.id)}/${created.id}`)
      .send({ status: 'CANCELLED' })
      .expect(200)
      .expect(({ body }) => {
        expect((body as AppointmentResponse).status).toBe('CANCELLED');
      });
  });

  it('acumula comentarios con autor y fecha, y permite editarlos y borrarlos', async () => {
    const appointment = await createAppointment(clinicA.id);

    const first = await request(app.getHttpServer())
      .post(commentsUrl(clinicA.id, appointment.id))
      .send({ author: ' Recepcion ', body: ' Confirmó asistencia ' })
      .expect(201);
    await request(app.getHttpServer())
      .post(commentsUrl(clinicA.id, appointment.id))
      .send({ author: 'Medico', body: 'Revisar historial' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(commentsUrl(clinicA.id, appointment.id))
      .expect(200);
    const comments = list.body as CommentResponse[];
    expect(comments).toHaveLength(2);
    expect(comments.map((item) => item.author)).toContain('Recepcion');
    expect((first.body as CommentResponse).body).toBe('Confirmó asistencia');

    await request(app.getHttpServer())
      .patch(
        `${commentsUrl(clinicA.id, appointment.id)}/${(first.body as CommentResponse).id}`,
      )
      .send({ body: 'Reprogramado al viernes' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(
        `${commentsUrl(clinicA.id, appointment.id)}/${(first.body as CommentResponse).id}`,
      )
      .expect(204);

    const remaining = await request(app.getHttpServer())
      .get(commentsUrl(clinicA.id, appointment.id))
      .expect(200);
    expect(remaining.body as CommentResponse[]).toHaveLength(1);
  });

  it('no permite comentar citas de otra clínica', async () => {
    const appointment = await createAppointment(clinicA.id);

    await request(app.getHttpServer())
      .post(commentsUrl(clinicB.id, appointment.id))
      .send({ author: 'Medico', body: 'Intento cruzado' })
      .expect(404);
  });

  it('borra citas y comentarios en cascada al eliminar paciente y clínica', async () => {
    const appointment = await createAppointment(clinicA.id);
    await request(app.getHttpServer())
      .post(commentsUrl(clinicA.id, appointment.id))
      .send({ author: 'Recepcion', body: 'Seguimiento' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`${patientsUrl(clinicA.id)}/${patientA.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`${appointmentsUrl(clinicA.id)}/${appointment.id}`)
      .expect(404);
    expect(
      await prisma.appointmentComment.count({
        where: { appointmentId: appointment.id },
      }),
    ).toBe(0);

    await request(app.getHttpServer())
      .delete(`/clinics/${clinicA.id}`)
      .expect(204);
    await request(app.getHttpServer()).get(patientsUrl(clinicA.id)).expect(404);
  });
});
