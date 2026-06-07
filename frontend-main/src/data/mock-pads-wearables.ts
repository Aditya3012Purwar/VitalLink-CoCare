/** PADS Apple Watch smartwatch summaries — Parkinson-only wearable layer */

export interface PadsWearableSummary {
  padsId: string;
  platform: string;
  device: string;
  samplingHz: number;
  assessmentSteps: number;
  lastSync: string;
  syncStatus: "synced" | "partial" | "pending";
  dominantTremorHz: number;
  restTremorSeverity: "normal" | "mild" | "moderate" | "high";
  elevatedTasks: number;
  nmsPositive: number;
  nmsTotal: number;
  mlPdProbability: number;
}

export const PADS_WEARABLE_SUMMARIES: Record<string, PadsWearableSummary> = {
  "004": {
    padsId: "004",
    platform: "PADS PhysioNet",
    device: "Apple Watch Series 4",
    samplingHz: 100,
    assessmentSteps: 11,
    lastSync: "2024-01-05",
    syncStatus: "synced",
    dominantTremorHz: 4.2,
    restTremorSeverity: "moderate",
    elevatedTasks: 4,
    nmsPositive: 12,
    nmsTotal: 30,
    mlPdProbability: 0.89,
  },
  "006": {
    padsId: "006",
    platform: "PADS PhysioNet",
    device: "Apple Watch Series 4",
    samplingHz: 100,
    assessmentSteps: 11,
    lastSync: "2024-01-05",
    syncStatus: "synced",
    dominantTremorHz: 5.1,
    restTremorSeverity: "high",
    elevatedTasks: 6,
    nmsPositive: 18,
    nmsTotal: 30,
    mlPdProbability: 0.94,
  },
  "019": {
    padsId: "019",
    platform: "PADS PhysioNet",
    device: "Apple Watch Series 4",
    samplingHz: 100,
    assessmentSteps: 11,
    lastSync: "2024-01-05",
    syncStatus: "synced",
    dominantTremorHz: 3.8,
    restTremorSeverity: "mild",
    elevatedTasks: 2,
    nmsPositive: 8,
    nmsTotal: 30,
    mlPdProbability: 0.76,
  },
};

export function getWearableSummary(padsId: string): PadsWearableSummary | null {
  return PADS_WEARABLE_SUMMARIES[padsId] ?? null;
}
