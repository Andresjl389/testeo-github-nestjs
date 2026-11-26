import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  clinicId: string;

  @ApiProperty({ example: 'Ana Torres' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  document: string | null;

  @ApiProperty({ example: '+57 300 1234567' })
  phone: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  birthDate: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
