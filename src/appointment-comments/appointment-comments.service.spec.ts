import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentCommentsService } from './appointment-comments.service';
import { PrismaService } from '../prisma/prisma.service';

interface CommentRow {
  id: string;
  appointmentId: string;
  author: string;
  body: string;
  createdAt: Date;
}

const clinicId = '0b7c2f5e-8b4a-4c2f-9a3e-6d1f0a2b4c6d';
const appointmentId = '3d0e5f6a-2b3c-4d5e-9f0a-1b2c3d4e5f60';
const commentId = '4e1f607b-3c4d-4e5f-8a0b-2c3d4e5f6071';

const comment: CommentRow = {
  id: commentId,
  appointmentId,
  author: 'Recepcion',
  body: 'El paciente confirmó la asistencia.',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AppointmentCommentsService', () => {
  let service: AppointmentCommentsService;

  const prisma = {
    appointment: {
      findFirst: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
    },
    appointmentComment: {
      create: jest.fn<Promise<CommentRow>, [unknown]>(),
      findMany: jest.fn<Promise<CommentRow[]>, [unknown]>(),
      findFirst: jest.fn<Promise<CommentRow | null>, [unknown]>(),
      update: jest.fn<Promise<CommentRow>, [unknown]>(),
      delete: jest.fn<Promise<void>, [unknown]>(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.appointment.findFirst.mockResolvedValue({ id: appointmentId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentCommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AppointmentCommentsService>(
      AppointmentCommentsService,
    );
  });

  it('agrega un comentario recortando espacios', async () => {
    prisma.appointmentComment.create.mockResolvedValue(comment);

    await expect(
      service.create(clinicId, appointmentId, {
        author: '  Recepcion  ',
        body: '  El paciente confirmó la asistencia.  ',
      }),
    ).resolves.toEqual(comment);
    expect(prisma.appointmentComment.create).toHaveBeenCalledWith({
      data: {
        appointmentId,
        author: 'Recepcion',
        body: 'El paciente confirmó la asistencia.',
      },
    });
  });

  it('no permite comentar una cita de otra clínica', async () => {
    prisma.appointment.findFirst.mockResolvedValue(null);

    await expect(
      service.create(clinicId, appointmentId, {
        author: 'Recepcion',
        body: 'Hola',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.appointmentComment.create).not.toHaveBeenCalled();
  });

  it('lista el historial ordenado por fecha', async () => {
    prisma.appointmentComment.findMany.mockResolvedValue([comment]);

    await expect(service.findAll(clinicId, appointmentId)).resolves.toEqual([
      comment,
    ]);
    expect(prisma.appointmentComment.findMany).toHaveBeenCalledWith({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('devuelve 404 para un comentario ajeno a la cita', async () => {
    prisma.appointmentComment.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(clinicId, appointmentId, commentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('editar aplica sólo los campos enviados', async () => {
    const updated = { ...comment, body: 'Reprogramado al viernes' };
    prisma.appointmentComment.findFirst.mockResolvedValue(comment);
    prisma.appointmentComment.update.mockResolvedValue(updated);

    await expect(
      service.update(clinicId, appointmentId, commentId, {
        body: '  Reprogramado al viernes  ',
      }),
    ).resolves.toEqual(updated);
    expect(prisma.appointmentComment.update).toHaveBeenCalledWith({
      where: { id: commentId },
      data: { body: 'Reprogramado al viernes' },
    });
  });

  it('elimina el comentario', async () => {
    prisma.appointmentComment.findFirst.mockResolvedValue(comment);
    prisma.appointmentComment.delete.mockResolvedValue(undefined);

    await expect(
      service.remove(clinicId, appointmentId, commentId),
    ).resolves.toBeUndefined();
    expect(prisma.appointmentComment.delete).toHaveBeenCalledWith({
      where: { id: commentId },
    });
  });
});
