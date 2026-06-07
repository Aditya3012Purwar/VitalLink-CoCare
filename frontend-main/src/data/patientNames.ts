/** Demo display names for anonymized PADS subject IDs */
export const PATIENT_DISPLAY_NAMES: Record<string, { en: string; zh: string }> = {
  "004": { en: "Mr. Hans Keller", zh: "漢斯·凱勒先生" },
  "006": { en: "Mrs. Petra Richter", zh: "佩特拉·里希特女士" },
  "019": { en: "Mr. Miguel Torres", zh: "米格爾·托雷斯先生" },
  "022": { en: "Mrs. Ingrid Schmidt", zh: "英格麗·施密特女士" },
  "038": { en: "Mr. Thomas Hoffmann", zh: "托馬斯·霍夫曼先生" },
};

export function getPatientDisplayName(
  padsId: string,
  locale: "en" | "zh",
  fallbackEn?: string,
  fallbackZh?: string,
): string {
  const entry = PATIENT_DISPLAY_NAMES[padsId];
  if (entry) return locale === "zh" ? entry.zh : entry.en;
  return locale === "zh" ? (fallbackZh ?? `患者 ${padsId}`) : (fallbackEn ?? `Patient ${padsId}`);
}

export function patientMatchesNameSearch(
  nameEn: string,
  nameZh: string,
  query: string,
): boolean {
  const q = query.trim();
  if (!q) return true;
  const qLower = q.toLowerCase();
  return nameEn.toLowerCase().includes(qLower) || nameZh.includes(q);
}
