export interface MedicineCatalogItem {
  id: string;
  name: string;
  generic: string;
  category: string;
  default_dose: string;
  default_frequency: string;
  notes: string;
}

export interface PrescriptionLineItem {
  medicine_id: string;
  name: string;
  generic: string;
  category: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  token: string;
  subject_id: string;
  patient_name: string;
  patient_age: number;
  condition: string;
  doctor_name: string;
  items: PrescriptionLineItem[];
  notes: string;
  created_at: string;
  status: string;
}
