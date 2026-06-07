import type { Locale } from "@/types/patient";
import type { LocalizedText } from "@/types/roles";

export const ui = {
  appName: { en: "VitalLink", zh: "VitalLink" },
  tagline: {
    en: "Smartwatch-powered monitoring connecting doctors, caretakers & Parkinson's patients.",
    zh: "智能手錶監測 — 連接醫生、照顧者與帕金森病患者。",
  },
  openDemo: { en: "Open care demo", zh: "開啟護理示範" },
  demoDisclaimer: {
    en: "Built on PhysioNet PADS + mock e-health — 3 demo patients, research use only.",
    zh: "基於 PhysioNet PADS 及模擬電子健康紀錄 — 3 位示範患者，僅供研究示範。",
  },
  landing: {
    eyeLine: { en: "Wearables · e-health · shared care plan", zh: "穿戴設備 · 電子健康 · 共享護理計劃" },
    headline: {
      en: "Connected care for every role in the journey",
      zh: "全程護理，每個角色緊密連繫",
    },
    description: {
      en: "Doctors fuse PADS tremor data, e-health vitals, and Health Chat into one dashboard. Patients and caretakers manage tasks, meds, and appointments — with instant ringtone alerts when Parkinson or COPD attack risk is detected. Prescriptions flow to chemists via QR.",
      zh: "醫生整合 PADS 震顫數據、電子健康指標及健康對話於同一儀表板。患者與照顧者管理任務、藥物及預約 — 偵測到帕金森或慢阻肺發作風險時即時鈴聲通知照顧者。處方經 QR 傳至藥劑師配藥。",
    },
    workflow: { en: "Care workflow", zh: "護理流程" },
    capabilities: { en: "Platform capabilities", zh: "平台功能" },
    features: {
      en: [
        "PADS smartwatch tremor & movement analysis",
        "Caretaker instant emergency ringtone alerts",
        "Health Talk voice companion (LLM)",
        "Patient workspace — tasks, meds & appointments",
        "Doctor prescriptions → patient QR → chemist",
      ],
      zh: [
        "PADS 智能手錶震顫及動作分析",
        "照顧者緊急鈴聲即時警報",
        "健康對話語音陪伴（LLM）",
        "患者工作台 — 任務、藥物及預約",
        "醫生開處方 → 患者 QR → 藥劑師配藥",
      ],
    },
    flowSteps: {
      en: ["Smartwatch", "Caretaker", "Doctor", "Patient", "Chemist"],
      zh: ["智能手錶", "照顧者", "醫生", "患者", "藥劑師"],
    },
  },
  notForDiagnosis: {
    en: "Not for clinical diagnosis",
    zh: "不作臨床診斷",
  },
  simulatedPlan: {
    en: "Parkinson care plan",
    zh: "帕金森護理計劃",
  },
  demoMode: { en: "Demo mode", zh: "示範模式" },
  roles: {
    patient: { en: "Patient", zh: "患者" },
    doctor: { en: "Doctor", zh: "醫生" },
    nurse: { en: "Nurse", zh: "護士" },
    pharmacist: { en: "Pharmacist", zh: "藥劑師" },
    caretaker: { en: "Caretaker", zh: "照顧者" },
  },
  roleDesc: {
    patient: { en: "Smartwatch tasks & symptom diary", zh: "智能手錶任務及徵象日記" },
    doctor: { en: "Tremor analysis & treatment decisions", zh: "震顫分析及治療決策" },
    nurse: { en: "Caretaker coaching & home monitoring", zh: "照顧者輔導及家居監測" },
    pharmacist: { en: "Levodopa timing & PD med safety", zh: "左旋多巴時間及帕金森用藥安全" },
    caretaker: { en: "Home monitoring & care tasks", zh: "家居監測及護理任務" },
  },
  careNetworkTab: { en: "Care network", zh: "護理網絡" },
  careNetworkDesc: {
    en: "Shared context — same patient, same plan, all roles",
    zh: "共享背景 — 同一患者、同一計劃、所有角色",
  },
  healthChatTab: { en: "Health Chat", zh: "健康對話" },
  healthChatDesc: {
    en: "Voice companion with emotional support & gentle check-in questions",
    zh: "語音陪伴 — 情感支持與溫和健康追問",
  },
  sections: {
    overview: { en: "Overview", zh: "概覽" },
    timeline: { en: "Care timeline", zh: "護理時間軸" },
    carePlan: { en: "Shared care plan", zh: "共享護理計劃" },
    alerts: { en: "Red flags", zh: "紅旗警報" },
    ownership: { en: "Care ownership", zh: "護理責任" },
    referral: { en: "Referral flow", zh: "轉介流程" },
    medications: { en: "Medications", zh: "藥物" },
    tasks: { en: "Upcoming tasks", zh: "待辦事項" },
  },
  aiLabel: { en: "AI care summary", zh: "AI 護理摘要" },
  aiDisclaimer: {
    en: "Coordination support only — not for diagnosis or treatment decisions.",
    zh: "僅供統籌支援 — 不作診斷或治療決定。",
  },
  ehealth: { en: "eHealth sync", zh: "電子健康紀錄同步" },
  printPlan: { en: "Share care plan", zh: "分享護理計劃" },
  whatChanged: { en: "What changed since last visit", zh: "上次就診後的變化" },
  backToHome: { en: "Back to home", zh: "返回首頁" },
  switchPatient: { en: "PADS patients", zh: "PADS 患者" },
  riskTier: { en: "Risk tier", zh: "風險分層" },
  packYears: { en: "pack-years", zh: "包年" },
  activeSmoker: { en: "Active smoker", zh: "仍在吸煙" },
  formerSmoker: { en: "Former smoker", zh: "前吸煙者" },
  urgency: {
    today: { en: "Today", zh: "今日" },
    this_week: { en: "This week", zh: "本週" },
    preventive: { en: "Preventive / routine", zh: "預防 / 常規" },
  },
} as const;

export function t(
  key: { en: string; zh: string },
  locale: Locale
): string {
  return locale === "zh" ? key.zh : key.en;
}

export function lt(text: LocalizedText, locale: Locale): string {
  return locale === "zh" ? text.zh : text.en;
}

export function pick<T extends { en: string; zh: string }>(
  item: T,
  locale: Locale,
  field?: keyof Omit<T, "en" | "zh">
): string {
  if (field && field in item) {
    const v = item[field as keyof T];
    return typeof v === "string" ? v : locale === "zh" ? item.zh : item.en;
  }
  return locale === "zh" ? item.zh : item.en;
}
