import { Patient } from "src/modules/patients/patient.entity";

export interface ProcessExcelResult {
    patientsMap: Map<number, Patient>;
    processedRows: number;
    skippedRows: number;
    totalRows: number;
  }
  

export interface PatientListResponse {
  total: number;
  page: number;
  count: number;
  data: Patient[];
  totalPages: number;
  }
  
