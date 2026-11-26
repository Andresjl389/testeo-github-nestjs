import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PatientsService } from './patients.service';

interface PatientRow {
  id: string;
  clinicId: string;
  name: string;
  document: string | null;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicId = '0b7c2f5e-8b4a-4c2f-9a3e-6d1f0a2b4c6d';
const patientId = '2c9d4e5f-1a2b-4c3d-8e9f-0a1b2c3d4e5f';

const patient: PatientRow = {
  id: patientId,
  clinicId,
  name: 'Ana Torres',
  document: 'CC 1234567890',
  phone: '+57 300 1234567',
  email: 'ana@example.com',
  birthDate: new Date('1990-05-20T00:00:00.000Z'),
  notes: 'Alergia a penicilina',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PatientsService', () => {
  let service: PatientsService;

  const prisma = {
    clinic: {
      findUnique: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    clinicPatient: {
      create: jest.fn<Promise<PatientRow>, [unknown]>(),
      findMany: jest.fn<Promise<PatientRow[]>, [unknown]>(),
      findFirst: jest.fn<Promise<PatientRow | null>, [unknown]>(),
      update: jest.fn<Promise<PatientRow>, [unknown]>(),
      delete: jest.fn<Promise<void>, [unknown]>(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.clinic.findUnique.mockResolvedValue({ id: clinicId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('crea un paciente normalizando texto, correo y fecha', async () => {
    prisma.clinicPatient.create.mockResolvedValue(patient);

    await expect(
      service.create(clinicId, {
        name: '  Ana Torres  ',
        document: '  CC 1234567890  ',
        phone: '  +57 300 1234567  ',
        email: '  Ana@Example.com  ',
        birthDate: '1990-05-20',
        notes: '  Alergia a penicilina  ',
      }),
    ).resolves.toEqual(patient);

    expect(prisma.clinicPatient.create).toHaveBeenCalledWith({
      data: {
        clinicId,
        name: 'Ana Torres',
        document: 'CC 1234567890',
        phone: '+57 300 1234567',
        email: 'ana@example.com',
        birthDate: new Date('1990-05-20T00:00:00.000Z'),
        notes: 'Alergia a penicilina',
        active: true,
      },
    });
  });

  it('traduce un documento duplicado a ConflictException', async () => {
    prisma.clinicPatient.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create(clinicId, { name: 'Ana', phone: '+57 300 1234567' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('no permite crear pacientes en una clínica inexistente', async () => {
    prisma.clinic.findUnique.mockResolvedValue(null);

    await expect(
      service.create(clinicId, { name: 'Ana', phone: '+57 300 1234567' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.clinicPatient.create).not.toHaveBeenCalled();
  });

  it('lista ordenado por nombre', async () => {
    prisma.clinicPatient.findMany.mockResolvedValue([patient]);

    await expect(service.findAll(clinicId)).resolves.toEqual([patient]);
    expect(prisma.clinicPatient.findMany).toHaveBeenCalledWith({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  });

  it('devuelve 404 si el paciente pertenece a otra clínica', async () => {
    prisma.clinicPatient.findFirst.mockResolvedValue(null);

    await expect(service.findOne(clinicId, patientId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('actualiza sólo los campos enviados', async () => {
    const updated = { ...patient, active: false };
    prisma.clinicPatient.findFirst.mockResolvedValue(patient);
    prisma.clinicPatient.update.mockResolvedValue(updated);

    await expect(
      service.update(clinicId, patientId, { active: false }),
    ).resolves.toEqual(updated);
    expect(prisma.clinicPatient.update).toHaveBeenCalledWith({
      where: { id: patientId },
      data: { active: false },
    });
  });

  it('elimina al paciente', async () => {
    prisma.clinicPatient.findFirst.mockResolvedValue(patient);
    prisma.clinicPatient.delete.mockResolvedValue(undefined);

    await expect(service.remove(clinicId, patientId)).resolves.toBeUndefined();
    expect(prisma.clinicPatient.delete).toHaveBeenCalledWith({
      where: { id: patientId },
    });
  });
});
