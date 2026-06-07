import type { PadsPatientSummary } from "@/types/parkinson";

export type AuthRole = "doctor" | "patient" | "chemist" | "caretaker";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  name: string;
  title: string;
  pads_id?: string;
}

export interface LoginResponse {
  user: AuthUser;
  patients: PadsPatientSummary[];
}
