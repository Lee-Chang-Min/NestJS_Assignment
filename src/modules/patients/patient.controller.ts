// src/patients/patients.controller.ts
import { 
  Controller, 
  Get, 
  Logger, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  Query, 
  HttpStatus, 
  HttpCode,
  HttpException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patient.service';
import { PatientListResponse } from 'src/interfaces/patient.interface';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Get('health')
  @ApiOperation({ summary: '서버 상태 확인' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API SERVER STATUS CHECK',
  })
  checkHealth() {
    this.logger.log(`...!`);
    return { status: 'ok', message: 'API SERVER IS RUNNING' };
  }

  @Post('upload')
  @ApiOperation({ summary: '엑셀 파일 업로드' })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'EXCEL FILE UPLOAD',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadExcel(@UploadedFile() file: Express.Multer.File): Promise<{
    totalRows: number;
    processedRows: number;
    skippedRows: number;
  }> {
    try {

      // Excel 파일이 정확하게 업로드 된다는 가정!
      // 파일 확장자 체크가 필요할 시 로직만 추가하면 됌.
      this.logger.log(`[uploadExcel] 엑셀 파일 업로드 시작: ${file.originalname}`);

      return this.patientsService.processExcel(file);

    } catch (error) {
      this.logger.error(`[uploadExcel] 엑셀 파일 업로드 처리 중 오류 발생: ${error}`);
      throw new HttpException('엑셀 파일 업로드 처리 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 환자 목록 조회
   * 페이지 네이션 지원
   * 이름, 전화번호, 주소, 차트번호로 필터링 가능
   */
  @Get('list')
  @ApiOperation({ summary: '환자 목록 조회' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: '페이지 당 표시할 데이터 수',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    description: '이름',
  })
  @ApiQuery({
    name: 'phone',
    type: String,
    required: false,
    description: '전화번호',
  })
  @ApiQuery({
    name: 'chartNumber',
    type: String,
    required: false,
    description: '차트번호',
  })
  getPatientsList(
    @Query('page') page: number = 1, 
    @Query('limit') limit: number = 100, 
    @Query('name') name?: string, 
    @Query('phone') phone?: string, 
    @Query('chartNumber') chartNumber?: string
  ): Promise<PatientListResponse> {
    this.logger.log(`[getPatientsList] 환자 목록 조회 요청: 페이지=${page}, 한도=${limit}`);
    try {
      return this.patientsService.getPatientsList(page, limit, name, phone, chartNumber);
    } catch (error) {
      this.logger.error(`[getPatientsList] 환자 목록 조회 중 오류 발생: ${error}`);
      throw new HttpException('환자 목록 조회 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
