import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patient.service';
import { PatientsController } from './patient.controller';
import { ExcelProcessor } from '../../utils/excel.processor';
@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [PatientsService, ExcelProcessor],
})
export class PatientsModule {}
