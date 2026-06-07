export type UserRole = "patient" | "doctor" | "nurse" | "pharmacist" | "caretaker";

/** Shared care-network overview vs role-specific workflow */
export type WorkspaceTab = "network" | "healthChat" | UserRole;

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface CareTeamMember {
  id: string;
  role: LocalizedText;
  name: string;
  organization: string;
  contact?: string;
}

export interface Appointment {
  id: string;
  date: string;
  title: LocalizedText;
  location: LocalizedText;
  with: string;
}

export interface PatientChecklistItem {
  id: string;
  label: LocalizedText;
  done: boolean;
  priority: "high" | "normal";
}

export interface ConditionExplainer {
  id: string;
  name: LocalizedText;
  simpleExplanation: LocalizedText;
}

export interface PatientRedFlag {
  id: string;
  symptom: LocalizedText;
  action: LocalizedText;
}

export interface ProblemCard {
  id: string;
  domain: LocalizedText;
  status: "uncontrolled" | "monitoring" | "stable";
  summary: LocalizedText;
  nextAction: LocalizedText;
}

export interface ReferralAction {
  id: string;
  action: LocalizedText;
  pathway: "primary" | "specialist" | "dhc" | "pharmacy" | "urgent";
  status: "recommended" | "pending" | "completed";
}

export interface NurseQueueItem {
  id: string;
  task: LocalizedText;
  priority: "urgent" | "routine";
  dueDate?: string;
}

export interface SelfManagementMetric {
  id: string;
  label: LocalizedText;
  value: string;
  status: "good" | "warning" | "poor";
  detail: LocalizedText;
}

export interface CareBarrier {
  id: string;
  barrier: LocalizedText;
  impact: LocalizedText;
}

export interface CoachingItem {
  id: string;
  goal: LocalizedText;
  status: "active" | "planned";
}

export interface NurseOutreachNote {
  lastContact: string;
  summary: LocalizedText;
  nextStep: LocalizedText;
}

export interface MedReconciliationItem {
  id: string;
  name: string;
  indication: LocalizedText;
  source: "family_doctor" | "specialist" | "hospital" | "unclear";
  sourceLabel: LocalizedText;
  refillDue?: string;
  refillGapDays?: number;
  ownerUnclear?: boolean;
}

export interface PharmacistMedFlag {
  id: string;
  type: "duplication" | "misuse" | "refill" | "burden" | "timing" | "interaction";
  title: LocalizedText;
  detail: LocalizedText;
  severity: "high" | "medium" | "low";
}

export interface CounselingTask {
  id: string;
  task: LocalizedText;
  status: "due" | "scheduled" | "done";
}

export interface PharmacistIntervention {
  id: string;
  date: string;
  action: LocalizedText;
  outcome: LocalizedText;
}

export interface PharmacistAction {
  id: string;
  action: LocalizedText;
  priority: "high" | "medium";
}

export interface PatientMedCard {
  id: string;
  name: string;
  purpose: LocalizedText;
  whenToTake: LocalizedText;
  refillStatus: LocalizedText;
  status: "ok" | "low" | "overdue";
}

export interface RoleExtensions {
  lastReview: string;
  nextAppointment: string;
  careTeam: CareTeamMember[];
  appointments: Appointment[];
  checklist: PatientChecklistItem[];
  conditionExplainers: ConditionExplainer[];
  patientRedFlags: PatientRedFlag[];
  patientMedCards: PatientMedCard[];
  smokingPanel: LocalizedText;
  problemCards: ProblemCard[];
  referralActions: ReferralAction[];
  nurseQueue: NurseQueueItem[];
  selfManagement: SelfManagementMetric[];
  careBarriers: CareBarrier[];
  coachingPlan: CoachingItem[];
  nurseRedFlags: LocalizedText[];
  nurseOutreach: NurseOutreachNote;
  medReconciliation: MedReconciliationItem[];
  pharmacistFlags: PharmacistMedFlag[];
  counselingTasks: CounselingTask[];
  pharmacistInterventions: PharmacistIntervention[];
  pharmacistActions: PharmacistAction[];
  adherenceNotes: LocalizedText;
}
