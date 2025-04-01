// src/patients/patients.controller.ts
import { Controller, Get, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patient.service';
import { ProcessExcelResult } from 'src/interfaces/patient.interface';

@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Get('health')
  checkHealth() {
    this.logger.log(`...!`);
    return { status: 'ok', message: '환자 서비스가 정상적으로 작동 중입니다.' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File): Promise<any> {
    try {
      this.logger.log(`[uploadExcel] 엑셀 파일 업로드 시작: ${file.originalname}`);
      const result: ProcessExcelResult = await this.patientsService.processExcel(file);
      return {
        result
      };

    } catch (error) {
      this.logger.error(`[uploadExcel] 엑셀 파일 업로드 처리 중 오류 발생: ${error}`);
      return {
        status: 'error',
        message: '엑셀 파일 업로드 처리 중 오류가 발생했습니다.',
      };
    }
  }
}
