import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { PatientsModule } from './patients/patient.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      retryAttempts: 1,
      retryDelay: 3000,
    }),
    PatientsModule,
  ],
})
export class AppModule {}
