// src/patients/patients.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { In, Repository } from 'typeorm';

import { PatientListResponse } from 'src/interfaces/patient.interface';
import { ExcelProcessor } from '../../utils/excel.processor';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly excelProcessor: ExcelProcessor,
  ) {}

  /**
   * Excel 파일 업로드를 통한 환자 등록 API
   * @param file 업로드된 Excel 파일
   * @returns 처리 결과
   */
  public async processExcel(file: Express.Multer.File): Promise<{
    totalRows: number;
    processedRows: number;
    skippedRows: number;
  }> {
    try {
      const { patientsMap, processedRows, skippedRows, totalRows } =
        await this.excelProcessor.processExcel(file);

      // [1] 중복 병합 로직 적용
      const mergedPatients = this.mergePatients(patientsMap);
      // console.log(mergedPatients.length);

      // [2] 환자 저장
      await this.savePatients(mergedPatients);

      // TODO: 중복 병합 로직 적용 후 저장
      return {
        totalRows,
        processedRows,
        skippedRows,
      };

    } catch (error) {
      this.logger.error(`[processExcel] 오류 발생: ${error}`);
      throw error;
    }

  }

  /**
   * 환자 목록 조회 API
   * @param page 페이지 번호
   * @param limit 한도
   * @param name 이름
   * @param phone 전화번호
   * @param chartNumber 차트번호
   */
  public async getPatientsList(page: number, limit: number, name?: string, phone?: string, chartNumber?: string): Promise<PatientListResponse> {

    try {
      this.logger.log(`[getPatientsList] 환자 목록 조회 시작`);
      
      const queryBuilder = this.patientRepository.createQueryBuilder('patient');
       
      if (name) {
        queryBuilder.andWhere('patient.name LIKE :name', { name: `%${name}%` });
      }
      if (phone) {
        // queryBuilder.andWhere('patient.phone LIKE :phone', { phone: `%${phone}%` });
        queryBuilder.andWhere('patient.phone = :phone', { phone });
      }
      if (chartNumber) {
        queryBuilder.andWhere('patient.chart LIKE :chart', { chart: `%${chartNumber}%` });
      }

      // 시작 시간 측정
      const startTime = Date.now();

      queryBuilder.orderBy('patient.id', 'ASC');
      const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

      // 종료 시간 측정
      const endTime = Date.now();
      this.logger.log(`[getPatientsList] 총 소요 시간: ${endTime - startTime}ms`);
       
       // 총 환자 수 조회
       const totalPages = Math.ceil(total / limit);

       return {
        total,
        page,
        count: limit,
        data,
        totalPages,
      };


    } catch (error) {
      this.logger.error(`[getPatientsList] 오류 발생: ${error}`);
      throw error;
    }
  }

  public mergePatients(patientsMap: Map<number, Patient>): Patient[] {
    /**
     * 병합 조건 (식별자가 같은 경우에 만 병합) => 식별자 같은 기준 (name, phoneNumber, chartNumber) or (name, phoneNumber)
     * 1. 무조건 아래에서 위로 병합
     * 2. 부분 집합 이어야 함
     *   - 2-1. 위쪽 rowNumber가 chartNumber가 없는 상태에서 하위 행에 chartNumber가 있는 경우에는 병합하지 X 
     */

    try {
      const mergedPatients: Patient[] = [];

        // [1] 그룹핑: key = name + '|' + phoneNumber
      const groups = new Map<string, { rowNumber: number; data: Patient }[]>();

      patientsMap.forEach((patient, rowNumber) => {
        const key = `${patient.name}|${patient.phone}`;
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

      return mergedPatients;

    } catch (error) {
      this.logger.error(`[mergePatients] 오류 발생: ${error}`);
      throw error;
    }
  }

  public mergePatientAggressive(target: Patient, source: Patient): void {
    // name, phoneNumber는 동일하다고 가정하므로 건드리지 않음
    if (source.address?.trim()) target.address = source.address;
    if (source.rrn?.trim()) target.rrn = source.rrn; 
    if (source.memo?.trim()) target.memo = source.memo;
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

    /**
     * 환자 저장
     * @param patients 환자 데이터 배열
     */
    private async savePatients(mergedPatients: Patient[]): Promise<void> {
      // await this.patientRepository.save(patients);
      console.log('>>>', mergedPatients.length);

      try {
        // 환자 데이터를 미리 조회하여 캐싱
        const patientNames = mergedPatients.map(p => p.name);
        const patientPhones = mergedPatients.map(p => p.phone);
        
        // 한 번의 쿼리로 관련 환자 데이터 모두 가져오기
        const existingPatients = await this.patientRepository.find({
          where: [
            { name: In(patientNames), phone: In(patientPhones) }
          ]
        });
        
        // 빠른 조회를 위한 맵 생성
        const patientMap = new Map<string, Patient>();
        existingPatients.forEach(patient => {
          const key = `${patient.name}|${patient.phone}|${patient.chart}`;
          patientMap.set(key, patient);
        });

        // 삽입과 업데이트를 위한 별도 배열
        const patientsToInsert: Patient[] = [];
        const patientsToUpdate: Patient[] = [];

        for (const patient of mergedPatients) {

          // 1. 병합된 Excel 데이터에서 차트 번호가 존재 하는 경우
          if (patient.chart && patient.chart !== '') {

            // 먼저 chart가 비어 있으면서 동일인임을 식별할 수 있는 기존 레코드를 찾는다.
            // 차트 번호가 비어있는 동일 환자 찾기
            const emptyChartKey = `${patient.name}|${patient.phone}|`;
            const dbPatientEmptyChart = patientMap.get(emptyChartKey);

            if (dbPatientEmptyChart) {
              // 1-1. 병합된 Excel 데이터 업데이트
              dbPatientEmptyChart.chart = patient.chart;
              if (patient.rrn && patient.rrn !== '') dbPatientEmptyChart.rrn = patient.rrn;
              if (patient.address && patient.address !== '') dbPatientEmptyChart.address = patient.address;
              if (patient.memo && patient.memo !== '') dbPatientEmptyChart.memo = patient.memo;
              patientsToUpdate.push(dbPatientEmptyChart);
            } else {
              // 1-2. 병합된 Excel 데이터와 동일한 차트 번호를 가진 레코드 찾기
              const chartKey = `${patient.name}|${patient.phone}|${patient.chart}`;
              const dbPatient = patientMap.get(chartKey);
    

              if (dbPatient) {
                // 이미 같은 차트 번호가 있을 경우, 해당 레코드 업데이트
                if (patient.rrn && patient.rrn !== '') dbPatient.rrn = patient.rrn;
                if (patient.address && patient.address !== '') dbPatient.address = patient.address;
                if (patient.memo && patient.memo !== '') dbPatient.memo = patient.memo;
                patientsToUpdate.push(dbPatient);
              } else {
                // chart 번호를 가진 새 환자 레코드 삽입
                const newPatient = this.patientRepository.create(patient);
                patientsToInsert.push(newPatient);
              }
            }

          } else {
            // 2. 병합된 Excel 데이터에서 차트 번호가 없는 경우
            // 2-1. 차트 번호가 존재하는 레코드 찾기
            const hasChartPatient = Array.from(patientMap.values()).find(
              p => p.name === patient.name && p.phone === patient.phone && p.chart !== ''
            );

            if (hasChartPatient) {
              // 2-1-1. chart 제외하고 업데이트
              if (patient.rrn && patient.rrn !== '') hasChartPatient.rrn = patient.rrn;
              if (patient.address && patient.address !== '') hasChartPatient.address = patient.address;
              if (patient.memo && patient.memo !== '') hasChartPatient.memo = patient.memo;
              patientsToUpdate.push(hasChartPatient);
            } else {
              // 2-2. 차트 번호 없는 레코드 찾기
              const emptyChartKey = `${patient.name}|${patient.phone}|`;
              const dbPatient = patientMap.get(emptyChartKey);

              if (dbPatient) {
                // 2-2-2. 업데이트
                if (patient.rrn && patient.rrn !== '') dbPatient.rrn = patient.rrn;
                if (patient.address && patient.address !== '') dbPatient.address = patient.address;
                if (patient.memo && patient.memo !== '') dbPatient.memo = patient.memo;
                patientsToUpdate.push(dbPatient);
              } else {
                // 2-2-3. 새로 삽입
                const newPatient = this.patientRepository.create(patient);
                patientsToInsert.push(newPatient);
              }
            }
          }
        }

        // 시작
        const startTime = Date.now();

        // 일괄 삽입 및 업데이트 수행
        if (patientsToInsert.length > 0) {
          await this.patientRepository.insert(patientsToInsert);
          this.logger.log(`[savePatients] 환자 삽입 완료: ${patientsToInsert.length}개`);
        }
        
        if (patientsToUpdate.length > 0) {
          const chunkSize = 100;
          for (let i = 0; i < patientsToUpdate.length; i += chunkSize) {
            const chunk = patientsToUpdate.slice(i, i + chunkSize);
            await this.patientRepository.save(chunk); // 청크 단위로 업데이트
          }
          this.logger.log(`[savePatients] 환자 업데이트 완료: ${patientsToUpdate.length}개`);
        }

        //끝
        const endTime = Date.now();
        this.logger.log(`[savePatients] 총 소요 시간: ${endTime - startTime}ms`);

      } catch (error) {
        this.logger.error(`[savePatients] 오류 발생: ${error}`);
        throw error;
      } 

  } 

}

