import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicInventoryItemEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  clinicId: string;

  @ApiProperty({ example: 'Jeringas 10 ml' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ example: 25 })
  quantity: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  unit: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
