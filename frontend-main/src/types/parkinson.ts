export type TremorSeverity = "normal" | "mild" | "moderate" | "high";

export interface PadsPatientSummary {
  id: string;
  display_name?: string;
  display_name_zh?: string;
  condition: string;
  disease_comment: string;
  age: number;
  gender: string;
  age_at_diagnosis: number | null;
  handedness: string;
  nms_positive_count: number;
  nms_total: number;
  doctor: string;
  caretaker: string;
  risk_level: "high" | "moderate" | "stable";
  comorbidities?: string[];
  has_copd?: boolean;
}

export interface NmsDomain {
  id: string;
  label: string;
  positive_count: number;
  total_count: number;
  score_pct: number;
}

export interface NmsItem {
  id: string;
  text: string;
  positive: boolean;
}

export interface TaskMetrics {
  tremor_frequency_hz: number;
  tremor_amplitude_g: number;
  max_amplitude_g: number;
  dominant_axis: string;
  severity: TremorSeverity;
}

export interface TaskSummary {
  task_id: string;
  label: string;
  category: string;
  left: TaskMetrics | null;
  right: TaskMetrics | null;
}

export interface AssessmentStep {
  id: string;
  label: string;
  category: string;
  duration_s: number;
}

export interface PadsPatientDetail {
  patient: {
    id: string;
    condition: string;
    disease_comment: string;
    age: number;
    gender: string;
    age_at_diagnosis: number | null;
    handedness: string;
    height?: number;
    weight?: number;
  };
  assignment: { doctor?: string; caretaker?: string };
  nms_items: NmsItem[];
  nms_domains: NmsDomain[];
  task_summaries: TaskSummary[];
  assessment_steps: AssessmentStep[];
}

export interface MovementChannel {
  acceleration: number[];
  psd_frequencies: number[];
  psd_values: number[];
  peak_frequency_hz: number;
  std: number;
  max_amplitude: number;
}

export interface MovementData {
  subject_id: string;
  task: string;
  wrist: string;
  time_ms: number[];
  channels: Record<"x" | "y" | "z", MovementChannel>;
  tremor_frequency_hz: number;
  tremor_amplitude_g: number;
  dominant_axis: string;
  severity: TremorSeverity;
}

export interface LlmExplanation {
  subject_id: string;
  audience: string;
  explanation: string;
  model: string;
  source: string;
}

export interface PerformanceAlert {
  event: string;
  detail: string;
  reason: string;
  clinical_relevance: string;
  timestamp: string;
  source: "wearable" | "human" | "voice_chat" | "e_health";
  red_flag?: boolean;
  assigned_doctor?: string;
  session_id?: string;
  urgency?: string;
}

export interface PerformanceAnalysis {
  subject_id: string;
  executive_summary: string;
  performance: {
    motor_score: number;
    nms_score: number;
    overall_status: "stable" | "moderate" | "declining";
    risk_level: "stable" | "moderate" | "high";
  };
  alerts: PerformanceAlert[];
  what_happened: PerformanceAlert[];
  why_analysis: Array<{
    observation: string;
    explanation: string;
    clinical_relevance: string;
  }>;
  key_metrics: {
    nms_positive: number;
    nms_total: number;
    elevated_task_count: number;
    years_since_diagnosis: number;
    dominant_tremor_hz: number | null;
  };
  top_nms_domains: NmsDomain[];
  positive_symptoms: Array<{ text: string }>;
}
