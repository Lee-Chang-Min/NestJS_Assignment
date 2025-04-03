import { Patient } from "src/patients/patient.entity";

export interface ProcessExcelResult {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    patientsMap: Map<number, Patient>;
  }
  