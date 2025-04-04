import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patient.service';
import { PatientsController } from './patient.controller';
import { ExcelProcessor } from '../../utils/excel.processor';
import { PatientRepository } from './patient.repository';
@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [
    PatientsService, 
    ExcelProcessor,
    PatientRepository,
  ],
})
export class PatientsModule {}
