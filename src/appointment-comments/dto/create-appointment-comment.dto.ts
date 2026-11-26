import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentCommentDto {
  @ApiProperty({ example: 'Recepcion', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  author: string;

  @ApiProperty({
    example: 'El paciente confirmó la asistencia por teléfono.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;
}
