export interface CopdTrendPoint {
  date: string;
  value: number;
}

export interface CopdVitalsSummary {
  spo2_avg_pct: number;
  spo2_target_pct: number;
  spo2_status: string;
  sleep_efficiency_pct: number;
  sleep_disorder_index: number;
  sleep_disorder_label: string;
  avg_sleep_hours: number;
  respiratory_rate_avg: number;
  nocturnal_desat_events: number;
  cough_episodes_week: number;
  pef_l_min: number;
  pef_predicted_pct: number;
  exacerbation_risk: "low" | "moderate" | "high";
  gold_stage: string;
}

export interface CopdSleepDisorder {
  diagnosis: string;
  severity: string;
  avg_sleep_hours: number;
  wake_after_sleep_onset_min: number;
  rem_sleep_pct: number;
  deep_sleep_pct: number;
  snoring_index: number;
  notes: string;
}

export interface CopdVitals {
  subject_id: string;
  conditions: string[];
  ehealth_platform: string;
  last_sync: string;
  sync_status: string;
  respiratory_specialist: string;
  summary: CopdVitalsSummary;
  sleep_disorder: CopdSleepDisorder;
  trends: {
    spo2: CopdTrendPoint[];
    sleep_hours: CopdTrendPoint[];
    respiratory_rate: CopdTrendPoint[];
    nighttime_spo2: CopdTrendPoint[];
  };
  clinical_reasoning: string;
}
