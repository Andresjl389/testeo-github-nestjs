import { ApiProperty } from '@nestjs/swagger';

export class AppointmentCommentEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  appointmentId: string;

  @ApiProperty({ example: 'Recepcion' })
  author: string;

  @ApiProperty({ example: 'El paciente confirmó la asistencia.' })
  body: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
