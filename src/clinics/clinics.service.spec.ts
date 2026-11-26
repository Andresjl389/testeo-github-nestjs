import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicsService } from './clinics.service';

interface ClinicRow {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  specialty: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinic: ClinicRow = {
  id: '0b7c2f5e-8b4a-4c2f-9a3e-6d1f0a2b4c6d',
  name: 'Clínica Central',
  address: 'Calle 10 # 20-30',
  phone: '+57 300 1234567',
  email: 'contacto@clinicacentral.com',
  specialty: 'Medicina general',
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ClinicsService', () => {
  let service: ClinicsService;

  const prisma = {
    clinic: {
      create: jest.fn<Promise<ClinicRow>, [unknown]>(),
      findMany: jest.fn<Promise<ClinicRow[]>, [unknown]>(),
      findUnique: jest.fn<Promise<ClinicRow | null>, [unknown]>(),
      update: jest.fn<Promise<ClinicRow>, [unknown]>(),
      delete: jest.fn<Promise<void>, [unknown]>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ClinicsService>(ClinicsService);
  });

  it('crea una clínica normalizando espacios, correo y active', async () => {
    prisma.clinic.create.mockResolvedValue(clinic);

    await expect(
      service.create({
        name: '  Clínica Central  ',
        address: '  Calle 10 # 20-30  ',
        phone: '  +57 300 1234567  ',
        email: '  Contacto@ClinicaCentral.com  ',
        specialty: '  Medicina general  ',
        active: undefined,
      }),
    ).resolves.toEqual(clinic);

    expect(prisma.clinic.create).toHaveBeenCalledWith({
      data: {
        name: 'Clínica Central',
        address: 'Calle 10 # 20-30',
        phone: '+57 300 1234567',
        email: 'contacto@clinicacentral.com',
        specialty: 'Medicina general',
        active: true,
      },
    });
  });

  it('traduce un nombre duplicado a ConflictException', async () => {
    prisma.clinic.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({
        name: 'Clínica Central',
        address: 'Calle 10 # 20-30',
        phone: '+57 300 1234567',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lista ordenado por nombre', async () => {
    prisma.clinic.findMany.mockResolvedValue([clinic]);

    await expect(service.findAll()).resolves.toEqual([clinic]);
    expect(prisma.clinic.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('lanza NotFound cuando la clínica no existe', async () => {
    prisma.clinic.findUnique.mockResolvedValue(null);

    await expect(service.findOne(clinic.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('actualiza sólo los campos enviados', async () => {
    const updated: ClinicRow = { ...clinic, active: false };
    prisma.clinic.update.mockResolvedValue(updated);

    await expect(service.update(clinic.id, { active: false })).resolves.toEqual(
      updated,
    );
    expect(prisma.clinic.update).toHaveBeenCalledWith({
      where: { id: clinic.id },
      data: { active: false },
    });
  });

  it('elimina y traduce un id inexistente a NotFound', async () => {
    prisma.clinic.delete.mockResolvedValueOnce(undefined);
    await expect(service.remove(clinic.id)).resolves.toBeUndefined();

    prisma.clinic.delete.mockRejectedValueOnce({ code: 'P2025' });
    await expect(service.remove(clinic.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
