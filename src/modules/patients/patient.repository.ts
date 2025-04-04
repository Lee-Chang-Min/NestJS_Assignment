// src/patients/patient.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PatientRepository {
    private readonly logger = new Logger(PatientRepository.name);
    private readonly SAVE_BATCH_SIZE = 100;

    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
    ) {}

    /**
     * 환자 엔티티를 생성합니다.
     * @param patientData 환자 데이터
     * @returns 생성된 환자 엔티티
     */
    create(patientData: Partial<Patient>): Patient {
        return this.patientRepository.create(patientData);
    }

    /**
     * 조건에 맞는 환자 목록과 총 개수를 조회 (페이지네이션 포함)
     */
    async findAndCountPatients(
        page: number,
        limit: number,
        name?: string,
        phone?: string,
        chartNumber?: string,
    ): Promise<[Patient[], number]> {
        const queryBuilder = this.patientRepository.createQueryBuilder('patient');
        if (name) {
        queryBuilder.andWhere('patient.name LIKE :name', { name: `%${name}%` });
        }
        if (phone) {
        queryBuilder.andWhere('patient.phone = :phone', { phone });
        }
        if (chartNumber) {
        queryBuilder.andWhere('patient.chart LIKE :chart', { chart: `%${chartNumber}%` });
        }

        queryBuilder.orderBy('patient.id', 'ASC');
        return queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
    }

    /**
     * 이름과 전화번호로 환자 데이터를 조회
     * @param patientNames 환자 이름 배열
     * @param patientPhones 환자 전화번호 배열
     * @returns 조회된 환자 데이터 배열
     */
    async findByNameAndPhone(patientNames: string[], patientPhones: string[]): Promise<Patient[]> {
        return this.patientRepository.find({
            where: [
                { name: In(patientNames), phone: In(patientPhones) }
            ]
        });
    }

    /**
     * 여러 환자 데이터를 한 번에 삽입합니다.
     */
    async bulkInsert(patients: Partial<Patient>[]): Promise<void> {
        if (patients.length === 0) return;
        try {
        // TypeORM의 insert는 Partial<Entity>[] 타입을 받을 수 있습니다.
        // create 과정을 거치지 않고 바로 DTO나 객체를 전달할 수 있습니다.
        await this.patientRepository.insert(patients);
        this.logger.log(`[bulkInsert] 환자 삽입 완료: ${patients.length}개`);
        } catch (error) {
        this.logger.error(`[bulkInsert] 오류 발생: ${error}`);
        throw error;
        }
    }

    /**
     * 환자 데이터를 청크 단위로 업데이트
     * @param patients 업데이트할 환자 데이터 배열
     * @returns 업데이트된 환자 수
     */
    async updatePatientsInChunks(patients: Patient[]): Promise<number> {
        const chunkSize = this.SAVE_BATCH_SIZE;
        let updatedCount = 0;
        
        try {
            for (let i = 0; i < patients.length; i += chunkSize) {
                const chunk = patients.slice(i, i + chunkSize);
                await this.patientRepository.save(chunk);
                updatedCount += chunk.length;
            }
        } catch (error) {
            this.logger.error(`[updatePatientsInChunks] 오류 발생: ${error}`);
            throw error;
        }
        
        return updatedCount;
    }
  
    
}

    
