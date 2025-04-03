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
          chartNumber: dto.chartNumber,
          name: dto.name,
          phoneNumber: phoneNumber,
          rrn: rrn,
          address: dto.address,
          memo: dto.memo,
        } as Patient);
      }
    });

      // [3] 중복 병합 로직 적용

      // 그룹핑
      // 우선 patientsMap 에 있는 각행을 rowNumber를 순회하여 (name, phoneNumber)를 기준으로 그룹화

      /**
       * patientsMap (Map<number, Patient>)를 그룹별로 병합 처리하는 함수
       * @param patientsMap - rowNumber를 key로 가진 Patient 데이터 Map
       * @param useAggressiveMerge - true이면 옵션 B, false이면 옵션 A를 사용
       * @returns 병합된 Patient 객체 배열
       */

    // TODO: 중복 병합 로직 적용 후 저장
    return {
      totalRows: worksheet.actualRowCount - 1,
      processedRows,
      skippedRows,
      patientsMap,
    };

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

    if (lower.chartNumber && lower.chartNumber !== "") {
      return !!upper.chartNumber && upper.chartNumber === lower.chartNumber;
    }

    // lower에 chartNumber가 없는 경우 항상 병합 가능
    return true;
  }

  public mergePatients(patientsMap: Map<number, Patient>): Patient[] {
    /**
     * 병합 조건 (식별자가 같은 경우에 만 병합) => 식별자 같은 기준 (name, phoneNumber, chartNumber) or (name, phoneNumber)
     * 1. 무조건 아래에서 위로 병합
     * 2. 부분 집합 이어야 함
     *   - 2-1. 위쪽 rowNumber가 chartNumber가 없는 상태에서 하위 행에 chartNumber가 있는 경우에는 병합하지 X 
     */
    const mergedPatients: Patient[] = [];

    // [1] 그룹핑: key = name + '|' + phoneNumber
    const groups = new Map<string, { rowNumber: number; data: Patient }[]>();

    patientsMap.forEach((patient, rowNumber) => {
      const key = `${patient.name}|${patient.phoneNumber}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ rowNumber, data: patient });
    });

    // console.log(groups);
    // Map(2) {
    //   '김환자1|010-0000-0000' => { [ [Object], [Object], [Object], [Object], [Object] ] },
    //   '김환자2|010-0000-0000' => { [ [Object] ] }
    // }

    // [2] 각 그룹 내에서 rowNumber 오름차순 정렬 (병합은 아래에서 위로 진행)
    groups.forEach((group) => {
      group.sort((a: { rowNumber: number; data: Patient }, b: { rowNumber: number; data: Patient }) => a.rowNumber - b.rowNumber);

      // 최종 병합 결과
      const finalGroup: { rowNumber: number; data: Patient }[] = [];

      // 첫 번째 행을 초기 후보로 설정
      let candidate = group[0];
      console.log("candidate", candidate);
      // 두 번째 행부터 순회하며 병합 진행
      for (let i = 1; i < group.length; i++) {
        const current = group[i];
        // 상단 후보(candidate)의 식별자가 current의 식별자를 포함하면 병합 진행
        if (this.isSubset(candidate.data, current.data)) {
          this.mergePatientAggressive(candidate.data, current.data);
        } else {
          // 병합 대상이 아니면, 현재 후보를 최종 결과에 추가하고, 새 후보로 전환
          finalGroup.push(candidate);
          candidate = current;
        }
      }

      // 마지막 후보를 최종 결과에 추가
      finalGroup.push(candidate);
        
      // 그룹의 최종 병합 결과를 최종 병합 배열에 추가
      mergedPatients.push(...finalGroup.map(item => item.data));

    });
          
    console.log(mergedPatients);
    return mergedPatients;
  }

  public mergePatientAggressive(target: Patient, source: Patient): void {
    // name, phoneNumber는 동일하다고 가정하므로 건드리지 않음
    if (source.address?.trim()) target.address = source.address;
    if (source.rrn?.trim()) target.rrn = source.rrn; 
    if (source.memo?.trim()) target.memo = source.memo;
  }

}
