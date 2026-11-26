import { Module } from '@nestjs/common';
import { ClinicItemsController } from './clinic-items.controller';
import { ClinicItemsService } from './clinic-items.service';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';

@Module({
  controllers: [ClinicsController, ClinicItemsController],
  providers: [ClinicsService, ClinicItemsService],
  exports: [ClinicsService, ClinicItemsService],
})
export class ClinicsModule {}
