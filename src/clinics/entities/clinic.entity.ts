import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Clínica Central' })
  name: string;

  @ApiProperty({ example: 'Calle 10 # 20-30' })
  address: string;

  @ApiProperty({ example: '+57 300 1234567' })
  phone: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  specialty: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
