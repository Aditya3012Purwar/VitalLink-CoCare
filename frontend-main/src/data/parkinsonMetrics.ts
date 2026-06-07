import type { PopulationMetrics } from "@/types/patient";

/** Parkinson population stats — inspired by PADS PhysioNet cohort */
export const parkinsonPopulationMetrics: PopulationMetrics = {
  highRiskPatients: 89,
  fragmentedPlans: 34,
  overdueFollowUps: 41,
  avgConditions: 1.8,
};

export const padsStudyStats = {
  participants: 469,
  pdSubjects: 264,
  healthyControls: 205,
  mlAccuracy: 91.2,
  assessmentSteps: 11,
  samplingHz: 100,
  nmsItems: 30,
} as const;
