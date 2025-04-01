// src/patients/patients.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as ExcelJS from 'exceljs';
// https://github.com/exceljs/exceljs#readme

import { UploadExcelDto } from './dtos/upload-excel.dto';
import { ProcessExcelResult } from 'src/interfaces/patient.interface';
import { normalizeRRN } from './utils/patient.util';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * Excel 파일 업로드를 통한 환자 등록 API
   * @param file 업로드된 Excel 파일
   * @returns 처리 결과
   */
  async processExcel(file: Express.Multer.File): Promise<ProcessExcelResult> {
    this.logger.log('[processExcel] Excel 파일 업로드 시작');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.worksheets[0];

    const patients: Patient[] = [];
    let skippedRows = 0;
    let processedRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Excel 헤더 스킵

      const rowData = {
        chartNumber: row.getCell(1).text.trim(),
        name: row.getCell(2).text.trim(),
        phoneRaw: row.getCell(3).text.trim(),
        rrnRaw: row.getCell(4).text.trim(),
        address: row.getCell(5).text.trim(),
        memo: row.getCell(6).text.trim(),
      };

      // [1] 잘못된 데이터 형식 Skip (데이터 검증)

      const dto = plainToInstance(UploadExcelDto, rowData);
      const errors = validateSync(dto);

      if (errors.length > 0) {
        skippedRows++;
      } else {
        processedRows++;

        // [2] 데이터 정제
        const phoneNumber = rowData.phoneRaw.replace(/-/g, '');
        const rrn = normalizeRRN(rowData.rrnRaw);

        patients.push({
          chartNumber: dto.chartNumber,
          name: dto.name,
          phoneNumber: phoneNumber,
          rrn: rrn,
          address: dto.address,
          memo: dto.memo,
        } as Patient);
      }

    });

    // TODO: 중복 병합 로직 적용 후 저장
    return {
      totalRows: worksheet.actualRowCount - 1,
      processedRows,
      skippedRows,
    };

  }
}
