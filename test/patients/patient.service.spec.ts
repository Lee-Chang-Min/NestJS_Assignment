import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from '../../src/modules/patients/patient.service';
import { Patient } from '../../src/modules/patients/patient.entity';
// import { IsNull, Repository } from 'typeorm';

describe('PatientsService', () => {
  let service: PatientsService;
  // let patientRepository: Repository<Patient>;

  const mockPatientRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
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
    // patientRepository = module.get<Repository<Patient>>(
    //   getRepositoryToken(Patient),
    // );

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
        chart: "C_1001",
        name: "김환자1",
        phone: "010-0000-0000",
        rrn: "010101-1111111",
        address: "서울 성동구",
        memo: "3.6 방문",
      } as Patient);
  
      // 2행
      patientsMap.set(2, {
        chart: "",
        name: "김환자1",
        phone: "010-0000-0000",
        rrn: "010101-1111111",
        address: "",
        memo: "3.7 방문",
      } as Patient);
  
      // 3행 
      patientsMap.set(3, {
        chart: "C_1002",
        name: "김환자1",
        phone: "010-0000-0000",
        rrn: "010101-1111111",
        address: "서울 성동구",
        memo: "노쇼",
      } as Patient);
  
      // 4행 
      patientsMap.set(4, {
        chart: "",
        name: "김환자1",
        phone: "010-0000-0000",
        rrn: "010101-2",
        address: "",
        memo: "3.7 방문",
      } as Patient);
  
      // 5행 
      patientsMap.set(5, {
        chart: "C_1002",
        name: "김환자1",
        phone: "010-0000-0000",
        rrn: "010101-1",
        address: "서울 특별시 강동구",
        memo: "",
      } as Patient);

      // 6행 
      patientsMap.set(6, {
        chart: "",
        name: "김환자2",
        phone: "010-0000-0000",
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
  
  describe('savePatients', () => {

    const existingPatients: Patient[] = [
      {
        id: 15364,
        chart: '' ,
        name: '김환자1',
        phone: '01000000000',
        rrn: '010101-1',
        address: '',
        memo: '5.10 방문',
      },
      {
        id: 15365,
        chart: 'C_1003',
        name: '김환자2',
        phone: '01000000000',
        rrn: '010101-1',
        address: '',
        memo: '5.11 방문',
      },
    ];

    const mergedPatients = [
      {
        chart: 'C_1001',
        name: '김환자1',
        phone: '01000000000',
        rrn: '010101-1',
        address: '서울 성동구',
        memo: '3.7 방문',
      } as Patient,
      {
        chart: 'C_1002',
        name: '김환자1',
        phone: '01000000000',
        rrn: '010101-1',
        address: '서울 강동구',
        memo: '3.7 방문',
      } as Patient,
      {
        chart: '',
        name: '김환자2',
        phone: '01000000000',
        rrn: '010101-1',
        address: '',
        memo: '',
      } as Patient,
    ];

    const mockPatientRepository = {
      findByNameAndPhone: jest.fn().mockResolvedValue(existingPatients),
      create: jest.fn((patient: Patient) => ({ ...patient })),
      bulkInsert: jest.fn().mockResolvedValue(undefined),
      updatePatientsInChunks: jest.fn().mockResolvedValue(2),
    };

    const mockExcelProcessor = {
      processExcel: jest.fn(),
    };

    // 서비스 인스턴스 생성
    const service = new PatientsService(
      mockPatientRepository as any,
      mockExcelProcessor as any
    );

    // private 메소드 호출을 위한 설정
    const savePatients = async (patients: Patient[]) => 
      await (service as unknown as { savePatients(patients: Patient[]): Promise<void> })
        .savePatients(patients);

    // 테스트 실행
    savePatients(mergedPatients);



  });
  

});