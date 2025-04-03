import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from '../../src/patients/patient.service';
import { Patient } from '../../src/patients/patient.entity';

describe('PatientsService', () => {
  let service: PatientsService;
  
  const mockPatientRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processExcel', () => {
    it('should merge patients', () => {
  
      const mergePatients = (patientsMap: Map<number, Patient>) => service.mergePatients(patientsMap); 
                     
      // 테스트 데이터 준비
      const patientsMap = new Map<number, Patient>();
      
      // 1행 
      patientsMap.set(1, {
        chartNumber: "C_1001",
        name: "김환자1",
        phoneNumber: "010-0000-0000",
        rrn: "010101-1111111",
        address: "서울 성동구",
        memo: "3.6 방문",
      } as Patient);
  
      // 2행
      patientsMap.set(2, {
        chartNumber: "",
        name: "김환자1",
        phoneNumber: "010-0000-0000",
        rrn: "010101-1111111",
        address: "",
        memo: "3.7 방문",
      } as Patient);
  
      // 3행 
      patientsMap.set(3, {
        chartNumber: "C_1002",
        name: "김환자1",
        phoneNumber: "010-0000-0000",
        rrn: "010101-1111111",
        address: "서울 성동구",
        memo: "노쇼",
      } as Patient);
  
      // 4행 
      patientsMap.set(4, {
        chartNumber: "",
        name: "김환자1",
        phoneNumber: "010-0000-0000",
        rrn: "010101-2",
        address: "",
        memo: "3.7 방문",
      } as Patient);
  
      // 5행 
      patientsMap.set(5, {
        chartNumber: "C_1002",
        name: "김환자1",
        phoneNumber: "010-0000-0000",
        rrn: "010101-1",
        address: "서울 특별시 강동구",
        memo: "",
      } as Patient);

      // 6행 
      patientsMap.set(6, {
        chartNumber: "",
        name: "김환자2",
        phoneNumber: "010-0000-0000",
        rrn: "010101-1",
        address: "",
        memo: "",
      } as Patient);
      
      // 함수 실행
      const result = mergePatients(patientsMap);
      
      // 검증
      expect(result.length).toBe(3); // 중복 병합 후 2명의 환자만 남아야 함  
       // 첫 번째 환자 검증 (1행과 2행이 병합됨)
      expect(result[0]).toEqual({
        chartNumber: 'C_1001',
        name: '김환자1',
        phoneNumber: '010-0000-0000',
        rrn: '010101-1111111',
        address: '서울 성동구',
        memo: '3.7 방문'
      });
      
      // 두 번째 환자 검증 (3행과 5행이 병합됨)
      expect(result[1]).toEqual({
        chartNumber: 'C_1002',
        name: '김환자1',
        phoneNumber: '010-0000-0000',
        rrn: '010101-1',
        address: '서울 특별시 강동구',
        memo: '3.7 방문'
      });
      
      // 세 번째 환자 검증 (6행)
      expect(result[2]).toEqual({
        chartNumber: '',
        name: '김환자2',
        phoneNumber: '010-0000-0000',
        rrn: '010101-1',
        address: '',
        memo: ''
      });

    });
  });
  
});