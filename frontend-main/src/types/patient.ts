import type { PatientChecklistItem } from "@/types/roles";

export type Locale = "en" | "zh";

export type RiskTier = "high" | "moderate" | "stable";
export type CareLayer =
  | "family_doctor"
  | "specialist"
  | "hospital"
  | "dhc"
  | "community"
  | "patient";
export type AlertUrgency = "today" | "this_week" | "preventive";
export type TaskStatus = "overdue" | "due_soon" | "scheduled" | "completed";
export type ReferralStage =
  | "primary_care"
  | "specialist"
  | "hospital"
  | "dhc_community";

export interface Provider {
  id: string;
  role: string;
  roleZh: string;
  name: string;
  organization: string;
  layer: CareLayer;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type:
    | "admission"
    | "ed_visit"
    | "exacerbation"
    | "vitals_flag"
    | "missed_followup"
    | "med_change"
    | "referral";
  title: string;
  titleZh: string;
  detail: string;
  detailZh: string;
  layer?: CareLayer;
}

export interface CarePlanItem {
  id: string;
  section:
    | "medication"
    | "red_flags"
    | "follow_up"
    | "screening"
    | "lifestyle"
    | "ownership";
  action: string;
  actionZh: string;
  owner: string;
  ownerZh: string;
  ownerLayer: CareLayer;
  dueDate?: string;
  status: TaskStatus;
  rationale: string;
  rationaleZh: string;
  /** Doctor user id who authored this item — only they may edit or delete */
  authoredBy: string;
  authoredByName: string;
  createdAt?: string;
}

export interface Alert {
  id: string;
  urgency: AlertUrgency;
  title: string;
  titleZh: string;
  detail: string;
  detailZh: string;
  owner: string;
  ownerZh: string;
}

export interface OwnershipItem {
  id: string;
  domain: string;
  domainZh: string;
  owner: string;
  ownerZh: string;
  layer: CareLayer;
  status: "active" | "gap" | "handoff";
  note: string;
  noteZh: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
  adherence: number;
  lastRefill?: string;
  flag?: string;
}

export interface VitalTrend {
  label: string;
  labelZh: string;
  unit: string;
  values: { date: string; value: number }[];
  target?: number;
  status: "controlled" | "elevated" | "critical";
}

export interface ReferralNode {
  stage: ReferralStage;
  label: string;
  labelZh: string;
  status: "current" | "completed" | "pending" | "escalation";
  detail: string;
  detailZh: string;
}

export interface ChangeItem {
  field: string;
  fieldZh: string;
  before: string;
  after: string;
  date: string;
}

export interface Patient {
  id: string;
  /** PhysioNet PADS subject id when linked to smartwatch data */
  padsId?: string;
  name: string;
  nameZh: string;
  age: number;
  sex: "M" | "F";
  smokingStatus: "active" | "former" | "never";
  packYears?: number;
  riskTier: RiskTier;
  lastAdmission: string;
  conditions: string[];
  conditionsZh: string[];
  followUpStatus: "overdue" | "due_soon" | "on_track";
  adherenceScore: number;
  familyDoctor: string;
  dhcCluster: string;
  ehealthSync: "synced" | "partial" | "pending";
  aiSummary: string;
  aiSummaryZh: string;
  timeline: TimelineEvent[];
  carePlan: CarePlanItem[];
  checklist: PatientChecklistItem[];
  alerts: Alert[];
  ownership: OwnershipItem[];
  medications: Medication[];
  vitals: VitalTrend[];
  referralFlow: ReferralNode[];
  recentChanges: ChangeItem[];
  kpis: {
    admissions12mo: number;
    openTasks: number;
    redFlags: number;
    daysSinceDischarge: number;
  };
  /** Parkinson's-specific metadata from PADS dataset */
  parkinsonMeta?: {
    yearsSinceDiagnosis: number;
    ageAtDiagnosis: number | null;
    nmsPositive: number;
    nmsTotal: number;
    handedness: string;
  };
}

export interface PopulationMetrics {
  highRiskPatients: number;
  fragmentedPlans: number;
  overdueFollowUps: number;
  avgConditions: number;
}
