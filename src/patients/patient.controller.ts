// src/patients/patients.controller.ts
import { Controller, Get, Logger, Post, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patient.service';
import { PatientListResponse, ProcessExcelResult } from 'src/interfaces/patient.interface';

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

  /**
   * 환자 목록 조회
   * 페이지 네이션 지원
   * 이름, 전화번호, 주소, 차트번호로 필터링 가능
   */
  @Get('list')
  async getPatientsList(
    @Query('page') page: number = 1, 
    @Query('limit') limit: number = 100, 
    @Query('name') name?: string, 
    @Query('phone') phone?: string, 
    @Query('address') address?: string, 
    @Query('chartNumber') chartNumber?: string
  ) {
    this.logger.log(`[getPatientsList] 환자 목록 조회 요청: 페이지=${page}, 한도=${limit}`);
    try {
      const result: PatientListResponse = await this.patientsService.getPatientsList(page, limit, name, phone, chartNumber);
      return {
        total: result.total,
        page: result.page,
        count: result.count,
        data: result.data,
        totalPages: result.totalPages,
      };
    } catch (error) {
      this.logger.error(`[getPatientsList] 환자 목록 조회 중 오류 발생: ${error}`);
      return {
        status: 'error',
        message: '환자 목록을 조회하는 중 오류가 발생했습니다.'
      };
    }
  }
}
