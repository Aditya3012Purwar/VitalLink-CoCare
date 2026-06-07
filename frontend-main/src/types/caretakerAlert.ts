export type AttackType = "parkinson" | "copd";
export type EmergencySeverity = "critical" | "warning";

export interface CaretakerEmergencyAlert {
  id: string;
  attack_type: AttackType;
  severity: EmergencySeverity;
  event: string;
  detail: string;
  action: string;
  timestamp: string;
  source: "wearable" | "e_health";
}

export interface CaretakerEmergencyResponse {
  subject_id: string;
  has_active_emergency: boolean;
  poll_interval_seconds: number;
  emergencies: CaretakerEmergencyAlert[];
}
