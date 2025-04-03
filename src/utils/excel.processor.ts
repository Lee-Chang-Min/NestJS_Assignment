import { Injectable, Logger } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { ProcessExcelResult } from "src/interfaces/patient.interface";
import { UploadExcelDto } from "src/modules/patients/dtos/upload-excel.dto";
import { Patient } from "src/modules/patients/patient.entity";
import { normalizeRRN } from "./patient.util";

import * as ExcelJS from 'exceljs';
// https://github.com/exceljs/exceljs#readme

@Injectable()
export class ExcelProcessor {
    private readonly logger = new Logger(ExcelProcessor.name);

    public async processExcel(file: Express.Multer.File): Promise<ProcessExcelResult> {

        try {
            this.logger.log('[ExcelProcessor] Excel 파일 업로드 시작');

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.worksheets[0];

            const patientsMap = new Map<number, Patient>();
            
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

                patientsMap.set(rowNumber, {
                    chart: dto.chartNumber,
                    name: dto.name,
                    phone: phoneNumber,
                    rrn: rrn,
                    address: dto.address,
                    memo: dto.memo,
                } as Patient);
                }
            });

            return {
                patientsMap,
                processedRows,
                skippedRows,
                totalRows: worksheet.actualRowCount - 1,
            };


        } catch (error) {
            this.logger.error(`[processExcel] 오류 발생: ${error}`);
            throw new Error('Excel 파일 처리 중 오류가 발생했습니다.');
        }
    }


    /**
     * 두 Patient 데이터 간의 식별자 부분집합 여부를 판단하는 함수.
     * @param upper - 위쪽(행 번호가 작은) 데이터
     * @param lower - 아래쪽(행 번호가 큰) 데이터
     * @returns upper의 식별자가 lower의 식별자를 true, 아니면 false.
     */
    public isSubset(upper: Patient, lower: Patient): boolean {

    // lower에 chartNumber가 있다면, upper도 같은 chartNumber를 가져야 함, 아닐 경우 부분 집합 조건 X
    // 상위 데이터가 차트 번호가 없을 경우 서로 다른 데이터라 판단 => 2-1 조건

    if (lower.chart && lower.chart !== "") {
      return !!upper.chart && upper.chart === lower.chart;
    }

    // lower에 chartNumber가 없는 경우 항상 병합 가능
    return true;
  }
}