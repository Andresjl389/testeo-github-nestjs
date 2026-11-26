import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicItemsService } from './clinic-items.service';

interface ItemRow {
  id: string;
  clinicId: string;
  name: string;
  sku: string | null;
  quantity: number;
  minStock: number;
  unit: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const clinicId = '0b7c2f5e-8b4a-4c2f-9a3e-6d1f0a2b4c6d';
const itemId = '1a8d3c4e-2f6b-4a1d-8e7c-9b0f2d3a4c5e';

const item: ItemRow = {
  id: itemId,
  clinicId,
  name: 'Jeringas 10 ml',
  sku: 'JER-10',
  quantity: 25,
  minStock: 5,
  unit: 'unidades',
  description: 'Uso en consulta externa',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ClinicItemsService', () => {
  let service: ClinicItemsService;

  const prisma = {
    clinic: {
      findUnique: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    clinicInventoryItem: {
      create: jest.fn<Promise<ItemRow>, [unknown]>(),
      findMany: jest.fn<Promise<ItemRow[]>, [unknown]>(),
      findFirst: jest.fn<Promise<ItemRow | null>, [unknown]>(),
      update: jest.fn<Promise<ItemRow>, [unknown]>(),
      delete: jest.fn<Promise<void>, [unknown]>(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.clinic.findUnique.mockResolvedValue({ id: clinicId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicItemsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClinicItemsService>(ClinicItemsService);
  });

  it('crea un insumo asociado a la clínica con valores por defecto', async () => {
    prisma.clinicInventoryItem.create.mockResolvedValue(item);

    await expect(
      service.create(clinicId, {
        name: '  Jeringas 10 ml  ',
        sku: '  jer-10  ',
        quantity: 25,
        minStock: 5,
        unit: '  unidades  ',
        description: '  Uso en consulta externa  ',
      }),
    ).resolves.toEqual(item);

    expect(prisma.clinicInventoryItem.create).toHaveBeenCalledWith({
      data: {
        clinicId,
        name: 'Jeringas 10 ml',
        sku: 'jer-10',
        quantity: 25,
        minStock: 5,
        unit: 'unidades',
        description: 'Uso en consulta externa',
      },
    });
  });

  it('rechaza crear si la clínica no existe', async () => {
    prisma.clinic.findUnique.mockResolvedValue(null);

    await expect(
      service.create(clinicId, { name: 'Jeringas 10 ml' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.clinicInventoryItem.create).not.toHaveBeenCalled();
  });

  it('traduce un nombre duplicado dentro de la clínica a ConflictException', async () => {
    prisma.clinicInventoryItem.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create(clinicId, { name: 'Jeringas 10 ml' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lista sólo los insumos de la clínica solicitada', async () => {
    prisma.clinicInventoryItem.findMany.mockResolvedValue([item]);

    await expect(service.findAll(clinicId)).resolves.toEqual([item]);
    expect(prisma.clinicInventoryItem.findMany).toHaveBeenCalledWith({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  });

  it('no devuelve un insumo que pertenece a otra clínica', async () => {
    prisma.clinicInventoryItem.findFirst.mockResolvedValue(null);

    await expect(service.findOne(clinicId, itemId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('actualiza sólo los campos enviados', async () => {
    const updated: ItemRow = { ...item, quantity: 30 };
    prisma.clinicInventoryItem.findFirst.mockResolvedValue(item);
    prisma.clinicInventoryItem.update.mockResolvedValue(updated);

    await expect(
      service.update(clinicId, itemId, { quantity: 30 }),
    ).resolves.toEqual(updated);
    expect(prisma.clinicInventoryItem.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { quantity: 30 },
    });
  });

  it('elimina el insumo de la clínica', async () => {
    prisma.clinicInventoryItem.findFirst.mockResolvedValue(item);
    prisma.clinicInventoryItem.delete.mockResolvedValue(undefined);

    await expect(service.remove(clinicId, itemId)).resolves.toBeUndefined();
    expect(prisma.clinicInventoryItem.delete).toHaveBeenCalledWith({
      where: { id: itemId },
    });
  });
});
