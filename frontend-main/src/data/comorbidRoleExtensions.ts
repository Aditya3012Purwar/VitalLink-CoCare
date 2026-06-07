import { defaultParkinsonExtensions } from "@/data/parkinsonRoleExtensions";
import type { RoleExtensions } from "@/types/roles";

const L = (en: string, zh: string) => ({ en, zh });

/** Patient 004 — Parkinson's + COPD comorbidity */
export const comorbidParkinsonCopdExtensions: RoleExtensions = {
  ...defaultParkinsonExtensions,
  conditionExplainers: [
    ...defaultParkinsonExtensions.conditionExplainers,
    {
      id: "ce5",
      name: L("COPD (chronic lung disease)", "慢阻肺（慢性肺病）"),
      simpleExplanation: L(
        "Your lungs need extra support with inhalers. Home oxygen and sleep monitoring help track breathlessness and night-time oxygen dips.",
        "您的肺部需要吸入劑輔助。家居血氧及睡眠監測有助追蹤氣促及夜間血氧下降。"
      ),
    },
    {
      id: "ce6",
      name: L("Sleep disorder (OSA overlap)", "睡眠障礙（阻塞性睡眠呼吸暫停）"),
      simpleExplanation: L(
        "Breathing pauses and low oxygen at night disturb sleep. This is common when COPD and Parkinson's occur together.",
        "夜間呼吸暫停及低氧會干擾睡眠。慢阻肺與帕金森並存時很常見。"
      ),
    },
  ],
  checklist: [
    ...defaultParkinsonExtensions.checklist,
    { id: "cl6", label: L("Morning COPD inhaler (tiotropium/olodaterol)", "早上慢阻肺吸入劑（噻托溴銨/奧達特羅）"), done: false, priority: "high" },
    { id: "cl7", label: L("Evening rescue inhaler if breathless", "晚上氣促時使用急救吸入劑"), done: false, priority: "high" },
    { id: "cl8", label: L("Wear pulse oximeter overnight (e-health sync)", "夜間佩戴血氧儀（電子健康同步）"), done: false, priority: "normal" },
    { id: "cl9", label: L("Log cough episodes in care diary", "於護理日誌記錄咳嗽次數"), done: false, priority: "normal" },
  ],
  patientRedFlags: [
    ...defaultParkinsonExtensions.patientRedFlags,
    {
      id: "pr6",
      symptom: L("SpO₂ below 88% or severe breathlessness", "血氧低於88%或嚴重氣促"),
      action: L("Use rescue inhaler; contact pulmonologist or emergency if no relief", "使用急救吸入劑；如無改善聯絡肺科或急症"),
    },
    {
      id: "pr7",
      symptom: L("Waking gasping for air at night", "夜間醒來喘不過氣"),
      action: L("Notify doctor — may need sleep study or nocturnal oxygen review", "通知醫生 — 可能需要睡眠檢查或夜間氧氣覆核"),
    },
  ],
  patientMedCards: [
    ...defaultParkinsonExtensions.patientMedCards,
    {
      id: "pm4",
      name: "Tiotropium/Olodaterol",
      purpose: L("Opens airways for COPD maintenance", "打開氣道，慢阻肺維持治療"),
      whenToTake: L("Once daily in the morning", "每日早上一次"),
      refillStatus: L("Low — 5 days left", "偏低 — 尚餘5天"),
      status: "low",
    },
    {
      id: "pm5",
      name: "Salbutamol",
      purpose: L("Quick relief for breathlessness", "氣促急救"),
      whenToTake: L("As needed — max 4× daily", "按需 — 每日最多4次"),
      refillStatus: L("OK", "充足"),
      status: "ok",
    },
  ],
  problemCards: [
    ...defaultParkinsonExtensions.problemCards,
    {
      id: "pc6",
      domain: L("COPD control", "慢阻肺控制"),
      status: "uncontrolled",
      summary: L(
        "Mean SpO₂ 91% with 7 nocturnal desaturation events; rescue inhaler use above target",
        "平均血氧91%，7次夜間低氧；急救吸入劑使用超標"
      ),
      nextAction: L("Pulmonology review + inhaler technique with caretaker", "肺科覆診 + 照顧者吸入技巧訓練"),
    },
    {
      id: "pc7",
      domain: L("Sleep disorder", "睡眠障礙"),
      status: "monitoring",
      summary: L("OSA overlap — sleep efficiency 62%, AHI 18.4", "睡眠呼吸暫停重疊 — 睡眠效率62%，AHI 18.4"),
      nextAction: L("CPAP screening; align levodopa timing to reduce nocturia", "CPAP 篩查；調整左旋多巴時間減少夜尿"),
    },
  ],
  selfManagement: [
    ...defaultParkinsonExtensions.selfManagement,
    {
      id: "sm6",
      label: L("Oxygen (SpO₂)", "血氧 (SpO₂)"),
      value: "91%",
      status: "warning",
      detail: L("14-day average below 92% target", "14日平均低於92%目標"),
    },
    {
      id: "sm7",
      label: L("COPD inhaler adherence", "慢阻肺吸入劑依從"),
      value: "72%",
      status: "warning",
      detail: L("Missed morning doses on 2 days this week", "本週有2天漏服早上劑量"),
    },
    {
      id: "sm8",
      label: L("Overnight oximetry", "夜間血氧監測"),
      value: "5/7 nights",
      status: "good",
      detail: L("E-health platform auto-synced", "電子健康平台自動同步"),
    },
  ],
  nurseRedFlags: [
    ...defaultParkinsonExtensions.nurseRedFlags,
    L("SpO₂ trend declining — mean 91% over 14 days"),
    L("Sleep efficiency 62% — OSA + COPD overlap suspected"),
    L("Rescue inhaler used >4× this week"),
  ],
  medReconciliation: [
    ...defaultParkinsonExtensions.medReconciliation,
    {
      id: "mr4",
      name: "Tiotropium/Olodaterol",
      indication: L("COPD maintenance", "慢阻肺維持"),
      source: "specialist",
      sourceLabel: L("Pulmonologist", "肺科醫生"),
      refillDue: "2026-06-11",
      refillGapDays: 5,
    },
    {
      id: "mr5",
      name: "Salbutamol",
      indication: L("COPD rescue", "慢阻肺急救"),
      source: "family_doctor",
      sourceLabel: L("Family doctor", "家庭醫生"),
    },
  ],
  smokingPanel: L(
    "Former smoker (35 pack-years). Use your morning COPD inhaler before Parkinson's medication if breathless on waking. Overnight pulse oximeter syncs to your doctor's dashboard — keep it on your finger or wrist during sleep.",
    "曾吸煙（35包年）。如醒來氣促，請在帕金森藥物前先使用早上慢阻肺吸入劑。夜間血氧儀會同步至醫生儀表板 — 睡眠時請佩戴於手指或手腕。"
  ),
};
