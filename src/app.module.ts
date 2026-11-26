import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentCommentsModule } from './appointment-comments/appointment-comments.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { validateEnvironment } from './config/env.validation';
import { CategoriesModule } from './categories/categories.module';
import { ClinicsModule } from './clinics/clinics.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { PatientsModule } from './patients/patients.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env.local',
        '.env',
      ],
      // En producción las variables las inyecta la plataforma; nunca se leen archivos.
      ignoreEnvFile: process.env.NODE_ENV === 'production' || isTest,
      validate: isTest ? undefined : validateEnvironment,
    }),
    PrismaModule,
    CategoriesModule,
    ClinicsModule,
    PatientsModule,
    AppointmentsModule,
    AppointmentCommentsModule,
    InventoryMovementsModule,
    ProductsModule,
    InventoryModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
