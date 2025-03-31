// src/patients/patients.controller.ts
import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patient.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('health')
  checkHealth() {
    return { status: 'ok', message: '환자 서비스가 정상적으로 작동 중입니다.' };
  }

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadExcel(@UploadedFile() file: Express.Multer.File) {
  //   return this.patientsService.processExcel(file);
  // }
}
