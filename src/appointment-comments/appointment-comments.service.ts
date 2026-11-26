import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentCommentDto } from './dto/create-appointment-comment.dto';
import { UpdateAppointmentCommentDto } from './dto/update-appointment-comment.dto';

@Injectable()
export class AppointmentCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    clinicId: string,
    appointmentId: string,
    dto: CreateAppointmentCommentDto,
  ) {
    await this.ensureAppointment(clinicId, appointmentId);

    return this.prisma.appointmentComment.create({
      data: {
        appointmentId,
        author: dto.author.trim(),
        body: dto.body.trim(),
      },
    });
  }

  async findAll(clinicId: string, appointmentId: string) {
    await this.ensureAppointment(clinicId, appointmentId);

    return this.prisma.appointmentComment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(clinicId: string, appointmentId: string, commentId: string) {
    await this.ensureAppointment(clinicId, appointmentId);

    const comment = await this.prisma.appointmentComment.findFirst({
      where: { id: commentId, appointmentId },
    });
    if (!comment) {
      throw new NotFoundException(
        `Comentario con id ${commentId} no encontrado`,
      );
    }
    return comment;
  }

  async update(
    clinicId: string,
    appointmentId: string,
    commentId: string,
    dto: UpdateAppointmentCommentDto,
  ) {
    await this.ensureAppointment(clinicId, appointmentId);
    await this.findOne(clinicId, appointmentId, commentId);

    return this.prisma.appointmentComment.update({
      where: { id: commentId },
      data: {
        ...(dto.author !== undefined ? { author: dto.author.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
      },
    });
  }

  async remove(
    clinicId: string,
    appointmentId: string,
    commentId: string,
  ): Promise<void> {
    await this.ensureAppointment(clinicId, appointmentId);
    await this.findOne(clinicId, appointmentId, commentId);

    await this.prisma.appointmentComment.delete({ where: { id: commentId } });
  }

  private async ensureAppointment(
    clinicId: string,
    appointmentId: string,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      select: { id: true },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Cita con id ${appointmentId} no encontrada en la clínica ${clinicId}`,
      );
    }
  }
}
