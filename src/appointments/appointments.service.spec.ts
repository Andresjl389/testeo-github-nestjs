import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsService } from './appointments.service';

interface AppointmentRow {
  id: string;
  clinicId: string;
  patientId: string;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: { id: string; name: string };
}

const clinicId = '0b7c2f5e-8b4a-4c2f-9a3e-6d1f0a2b4c6d';
const patientId = '2c9d4e5f-1a2b-4c3d-8e9f-0a1b2c3d4e5f';
const appointmentId = '3d0e5f6a-2b3c-4d5e-9f0a-1b2c3d4e5f60';
const futureIso = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const appointment: AppointmentRow = {
  id: appointmentId,
  clinicId,
  patientId,
  scheduledAt: new Date(futureIso()),
  durationMinutes: 30,
  reason: 'Control general',
  status: AppointmentStatus.PENDING,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  patient: { id: patientId, name: 'Ana Torres' },
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const prisma = {
    clinic: {
      findUnique: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    clinicPatient: {
      findFirst: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    appointment: {
      create: jest.fn<Promise<AppointmentRow>, [unknown]>(),
      findMany: jest.fn<
        Promise<
          Array<{
            id: string;
            scheduledAt: Date;
            durationMinutes: number;
          }>
        >,
        [unknown]
      >(),
      findFirst: jest.fn<Promise<AppointmentRow | null>, [unknown]>(),
      update: jest.fn<Promise<AppointmentRow>, [unknown]>(),
      delete: jest.fn<Promise<void>, [unknown]>(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.clinic.findUnique.mockResolvedValue({ id: clinicId });
    prisma.clinicPatient.findFirst.mockResolvedValue({ id: patientId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('programa una cita futura con valores por defecto', async () => {
    const scheduledAt = futureIso();
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.create.mockResolvedValue(appointment);

    await expect(
      service.create(clinicId, {
        patientId,
        scheduledAt,
        reason: '  Control general  ',
      }),
    ).resolves.toEqual(appointment);

    expect(prisma.appointment.create).toHaveBeenCalledWith({
      data: {
        clinicId,
        patientId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: 30,
        reason: 'Control general',
        status: AppointmentStatus.PENDING,
        notes: null,
      },
      include: { patient: { select: { id: true, name: true } } },
    });
  });

  it('rechaza citas en el pasado', async () => {
    await expect(
      service.create(clinicId, {
        patientId,
        scheduledAt: '2020-01-01T00:00:00.000Z',
        reason: 'Control',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('rechaza un horario que se cruza con otra cita', async () => {
    prisma.appointment.findMany.mockResolvedValue([
      {
        id: 'otra-cita',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000 - 10 * 60_000),
        durationMinutes: 30,
      },
    ]);

    await expect(
      service.create(clinicId, {
        patientId,
        scheduledAt: futureIso(),
        reason: 'Control',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('permite cancelar aunque el horario esté ocupado', async () => {
    prisma.appointment.create.mockResolvedValue(appointment);

    await expect(
      service.create(clinicId, {
        patientId,
        scheduledAt: futureIso(),
        reason: 'Control',
        status: AppointmentStatus.CANCELLED,
      }),
    ).resolves.toEqual(appointment);
    expect(prisma.appointment.findMany).not.toHaveBeenCalled();
  });

  it('no permite citar a un paciente de otra clínica', async () => {
    prisma.clinicPatient.findFirst.mockResolvedValue(null);

    await expect(
      service.create(clinicId, {
        patientId,
        scheduledAt: futureIso(),
        reason: 'Control',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('filtra las citas por estado y día', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    await expect(
      service.findAll(clinicId, {
        status: AppointmentStatus.CONFIRMED,
        date: '2026-12-01',
      }),
    ).resolves.toEqual([]);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith({
      where: {
        clinicId,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: {
          gte: new Date('2026-12-01T00:00:00.000Z'),
          lt: new Date('2026-12-02T00:00:00.000Z'),
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { patient: { select: { id: true, name: true } } },
    });
  });

  it('reprograma excluyendo la propia cita del chequeo de solape', async () => {
    const scheduledAt = futureIso();
    const updated = { ...appointment, scheduledAt: new Date(scheduledAt) };
    prisma.appointment.findFirst.mockResolvedValue(appointment);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.update.mockResolvedValue(updated);

    await expect(
      service.update(clinicId, appointmentId, { scheduledAt }),
    ).resolves.toEqual(updated);

    const overlapWhere = prisma.appointment.findMany.mock.calls[0][0] as {
      where: { id?: { not?: string } };
    };
    expect(overlapWhere.where.id?.not).toBe(appointmentId);
  });

  it('elimina la cita', async () => {
    prisma.appointment.findFirst.mockResolvedValue(appointment);
    prisma.appointment.delete.mockResolvedValue(undefined);

    await expect(
      service.remove(clinicId, appointmentId),
    ).resolves.toBeUndefined();
    expect(prisma.appointment.delete).toHaveBeenCalledWith({
      where: { id: appointmentId },
    });
  });
});
