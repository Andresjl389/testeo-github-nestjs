import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AgendaService } from './agenda.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AgendaService', () => {
  let service: AgendaService;

  const findMany = jest.fn<Promise<unknown[]>, [unknown]>();

  beforeEach(async () => {
    jest.resetAllMocks();
    findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: PrismaService, useValue: { appointment: { findMany } } },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
  });

  it('consulta el día de hoy por defecto', async () => {
    await expect(service.findAll()).resolves.toEqual([]);

    const args = findMany.mock.calls[0][0] as {
      where: { scheduledAt: { gte: Date; lt: Date } };
    };
    const start = args.where.scheduledAt.gte;
    const end = args.where.scheduledAt.lt;
    expect(start.toISOString().slice(11)).toBe('00:00:00.000Z');
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('filtra por un día concreto en UTC', async () => {
    await service.findAll({ date: '2026-11-28' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        scheduledAt: {
          gte: new Date('2026-11-28T00:00:00.000Z'),
          lt: new Date('2026-11-29T00:00:00.000Z'),
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        clinic: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
      },
    });
  });

  it('filtra por un rango inclusivo', async () => {
    await service.findAll({ start: '2026-11-01', end: '2026-11-03' });

    const args = findMany.mock.calls[0][0] as {
      where: { scheduledAt: { gte: Date; lt: Date } };
    };
    expect(args.where.scheduledAt.gte.toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
    expect(args.where.scheduledAt.lt.toISOString()).toBe(
      '2026-11-04T00:00:00.000Z',
    );
  });

  it('rechaza fechas imposibles', async () => {
    await expect(
      service.findAll({ date: '2026-02-30' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('exige start y end juntos', async () => {
    await expect(
      service.findAll({ start: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rechaza un rango invertido', async () => {
    await expect(
      service.findAll({ start: '2026-11-10', end: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findMany).not.toHaveBeenCalled();
  });
});
