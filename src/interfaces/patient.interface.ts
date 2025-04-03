import { Patient } from "src/patients/patient.entity";

export interface ProcessExcelResult {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
  }
  

export interface PatientListResponse {
  total: number;
  page: number;
  count: number;
  data: Patient[];
  totalPages: number;
  }
  
