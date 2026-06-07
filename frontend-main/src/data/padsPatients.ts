import { comorbidParkinsonCopdExtensions } from "@/data/comorbidRoleExtensions";
import { getPatientDisplayName } from "@/data/patientNames";
import { defaultParkinsonExtensions } from "@/data/parkinsonRoleExtensions";
import { doctorIdForName } from "@/lib/carePlanAuth";
import type { Patient } from "@/types/patient";
import type { PadsPatientSummary } from "@/types/parkinson";

/** Map PADS PhysioNet Parkinson's subjects to frontend Patient records */
export function padsToPatient(p: PadsPatientSummary): Patient {
  const sex = p.gender === "female" ? "F" : "M";
  const yearsSinceDx = p.age_at_diagnosis ? p.age - p.age_at_diagnosis : 0;
  const riskTier = p.risk_level;
  const hasCopd = p.has_copd ?? p.id === "004";

  return {
    id: `pads-${p.id}`,
    padsId: p.id,
    name: p.display_name ?? getPatientDisplayName(p.id, "en"),
    nameZh: p.display_name_zh ?? getPatientDisplayName(p.id, "zh"),
    age: p.age,
    sex,
    smokingStatus: hasCopd ? "former" : "never",
    packYears: hasCopd ? 35 : undefined,
    riskTier: hasCopd && riskTier === "stable" ? "moderate" : riskTier,
    lastAdmission: "2024-01-05",
    conditions: [
      "Parkinson's disease",
      ...(hasCopd ? ["COPD (GOLD II)", "Sleep disorder (OSA overlap)"] : []),
      p.disease_comment !== "-" ? p.disease_comment : "",
      `NMS ${p.nms_positive_count}/30`,
    ].filter(Boolean),
    conditionsZh: [
      "帕金森病",
      ...(hasCopd ? ["慢阻肺（GOLD II）", "睡眠障礙（OSA 重疊）"] : []),
      p.disease_comment !== "-" ? p.disease_comment : "",
      `非運動症狀 ${p.nms_positive_count}/30`,
    ].filter(Boolean),
    followUpStatus: riskTier === "high" ? "overdue" : riskTier === "moderate" ? "due_soon" : "on_track",
    adherenceScore: Math.max(40, 100 - p.nms_positive_count * 2),
    familyDoctor: p.doctor,
    dhcCluster: `Caretaker: ${p.caretaker}`,
    ehealthSync: "synced",
    aiSummary: buildStaticSummary(p, hasCopd),
    aiSummaryZh: hasCopd
      ? `帕金森 + 慢阻肺共病：${p.nms_positive_count}/30 非運動症狀陽性，平均血氧 91%，睡眠效率 62%，診斷後 ${yearsSinceDx} 年。`
      : `帕金森智能手錶監測：${p.nms_positive_count}/30 非運動症狀陽性，診斷後 ${yearsSinceDx} 年。`,
    timeline: [
      {
        id: "sw1",
        date: "2024-01-05",
        type: "vitals_flag",
        title: "PADS smartwatch assessment completed",
        titleZh: "PADS 智能手錶評估完成",
        detail: "11 movement steps + 30-item PDNMS questionnaire recorded.",
        detailZh: "11 項動作評估及 30 項 PDNMS 問卷已記錄。",
        layer: "specialist",
      },
      ...(hasCopd
        ? [{
            id: "eh1",
            date: "2026-06-04",
            type: "vitals_flag" as const,
            title: "E-health: low SpO₂ trend flagged",
            titleZh: "電子健康：血氧偏低趨勢標記",
            detail: "14-day mean SpO₂ 91% with 7 nocturnal desaturation events.",
            detailZh: "14日平均血氧91%，7次夜間低氧事件。",
            layer: "specialist" as const,
          }]
        : []),
      {
        id: "sw2",
        date: "2023-06-15",
        type: "referral",
        title: "Movement disorders clinic — Parkinson's diagnosis",
        titleZh: "運動障礙門診 — 帕金森病診斷",
        detail: `Diagnosed at age ${p.age_at_diagnosis ?? "N/A"}. ${yearsSinceDx} years since diagnosis.`,
        detailZh: `診斷年齡 ${p.age_at_diagnosis ?? "不適用"}，診斷後 ${yearsSinceDx} 年。`,
        layer: "specialist",
      },
    ],
    carePlan: buildPadsCarePlan(p, riskTier, yearsSinceDx, hasCopd),
    checklist: (hasCopd ? comorbidParkinsonCopdExtensions.checklist : defaultParkinsonExtensions.checklist).map((item) => ({
      ...item,
      label: { ...item.label },
    })),
    alerts: [
      ...(p.nms_positive_count >= 12
        ? [{
            id: "a1",
            urgency: "this_week" as const,
            title: "Elevated Parkinson's non-motor symptom burden",
            titleZh: "帕金森非運動症狀負擔升高",
            detail: `${p.nms_positive_count}/30 PDNMS items positive — review sleep, mood, autonomic domains`,
            detailZh: `${p.nms_positive_count}/30 項 PDNMS 陽性 — 覆核睡眠、情緒、自律神經領域`,
            owner: p.doctor,
            ownerZh: p.doctor,
          }]
        : []),
      ...(hasCopd
        ? [{
            id: "a2",
            urgency: "today" as const,
            title: "COPD: oxygen below target (91% avg)",
            titleZh: "慢阻肺：血氧低於目標（平均91%）",
            detail: "E-health overnight oximetry — 7 nocturnal desaturation events; sleep efficiency 62%.",
            detailZh: "電子健康夜間血氧 — 7次夜間低氧；睡眠效率62%。",
            owner: "Dr. Eva Richter (Pulmonology)",
            ownerZh: "Dr. Eva Richter（肺科）",
          }]
        : []),
    ],
    ownership: [
      {
        id: "o1",
        domain: "Parkinson's movement monitoring (smartwatch)",
        domainZh: "帕金森動作監測（智能手錶）",
        owner: p.doctor,
        ownerZh: p.doctor,
        layer: "specialist",
        status: "active",
        note: "PADS 11-step tremor & rigidity protocol",
        noteZh: "PADS 11 項震顫及僵硬評估方案",
      },
      {
        id: "o2",
        domain: "Levodopa timing & daily care",
        domainZh: "左旋多巴時間及日常護理",
        owner: p.caretaker,
        ownerZh: p.caretaker,
        layer: "community",
        status: "active",
        note: "Home-based PADS assessment support",
        noteZh: "家居 PADS 評估支援",
      },
      ...(hasCopd
        ? [{
            id: "o3",
            domain: "COPD inhaler therapy & oxygen monitoring",
            domainZh: "慢阻肺吸入治療及氧氣監測",
            owner: "Dr. Eva Richter (Pulmonology)",
            ownerZh: "Dr. Eva Richter（肺科）",
            layer: "specialist" as const,
            status: "active" as const,
            note: "E-health SpO₂ + sleep study data synced",
            noteZh: "電子健康血氧及睡眠檢查數據已同步",
          }]
        : []),
    ],
    medications: [
      { id: "m1", name: "Levodopa/Carbidopa", dose: "100/25 mg", frequency: "TID", prescriber: p.doctor, adherence: 78, flag: "Monitor off-periods" },
      { id: "m2", name: "Pramipexole", dose: "0.5 mg", frequency: "BID", prescriber: p.doctor, adherence: 85 },
      { id: "m3", name: "Rasagiline", dose: "1 mg", frequency: "OD", prescriber: p.doctor, adherence: 90 },
      ...(hasCopd
        ? [
            { id: "m4", name: "Tiotropium/Olodaterol", dose: "2.5/2.5 mcg", frequency: "OD", prescriber: "Dr. Eva Richter", adherence: 72, flag: "Refill in 5 days" },
            { id: "m5", name: "Salbutamol", dose: "100 mcg", frequency: "PRN", prescriber: "Dr. Eva Richter", adherence: 80, flag: "Rescue — monitor overuse" },
          ]
        : []),
    ],
    vitals: [],
    referralFlow: [
      {
        stage: "primary_care",
        label: "Initial GP referral",
        labelZh: "家庭醫生初步轉介",
        status: "completed",
        detail: "Referred to movement disorders clinic",
        detailZh: "轉介至運動障礙門診",
      },
      {
        stage: "specialist",
        label: "Neurologist + PADS smartwatch monitoring",
        labelZh: "神經科 + PADS 智能手錶監測",
        status: "current",
        detail: p.doctor,
        detailZh: p.doctor,
      },
    ],
    recentChanges: [
      {
        field: "Rest tremor (smartwatch)",
        fieldZh: "靜止震顫（智能手錶）",
        before: "Moderate",
        after: riskTier === "high" ? "Elevated" : "Stable",
        date: "2024-01-05",
      },
      {
        field: "PDNMS score",
        fieldZh: "PDNMS 評分",
        before: "—",
        after: `${p.nms_positive_count}/30`,
        date: "2024-01-05",
      },
    ],
    kpis: {
      admissions12mo: hasCopd ? 1 : 0,
      openTasks: hasCopd ? 4 : riskTier === "high" ? 3 : 2,
      redFlags: hasCopd ? 3 : p.nms_positive_count >= 15 ? 2 : p.nms_positive_count >= 8 ? 1 : 0,
      daysSinceDischarge: 0,
    },
    parkinsonMeta: {
      yearsSinceDiagnosis: yearsSinceDx,
      ageAtDiagnosis: p.age_at_diagnosis,
      nmsPositive: p.nms_positive_count,
      nmsTotal: p.nms_total,
      handedness: p.handedness,
    },
  };
}

function buildPadsCarePlan(
  p: PadsPatientSummary,
  riskTier: Patient["riskTier"],
  yearsSinceDx: number,
  hasCopd = false
): Patient["carePlan"] {
  const authoredBy = doctorIdForName(p.doctor);
  const authoredByName = p.doctor;
  const auth = { authoredBy, authoredByName, createdAt: "2026-01-05" };

  return [
    {
      id: `${p.id}-cp1`,
      section: "follow_up",
      action: "Weekly home smartwatch assessment (Relaxed + Hold Weight tasks)",
      actionZh: "每週家居智能手錶評估（放鬆及持重物任務）",
      owner: p.doctor,
      ownerZh: p.doctor,
      ownerLayer: "specialist",
      dueDate: "2026-06-13",
      status: riskTier === "high" ? "overdue" : "due_soon",
      rationale: "PADS protocol enables tremor monitoring between neurology visits",
      rationaleZh: "PADS 方案可在神經科就診間隔監測震顫",
      ...auth,
    },
    {
      id: `${p.id}-cp2`,
      section: "follow_up",
      action: "Neurology clinic review — motor symptoms & medication adjustment",
      actionZh: "神經科門診覆診 — 運動症狀及用藥調整",
      owner: p.doctor,
      ownerZh: p.doctor,
      ownerLayer: "specialist",
      dueDate: "2026-07-02",
      status: "scheduled",
      rationale: `${yearsSinceDx} years since diagnosis — routine specialist follow-up every 3 months`,
      rationaleZh: `診斷後 ${yearsSinceDx} 年 — 每 3 個月例行神經科覆診`,
      ...auth,
    },
    {
      id: `${p.id}-cp3`,
      section: "follow_up",
      action: "Review smartwatch data with caretaker before next neurology visit",
      actionZh: "下次神經科覆診前與照顧者一同審閱智能手錶數據",
      owner: p.caretaker,
      ownerZh: p.caretaker,
      ownerLayer: "community",
      dueDate: "2026-06-28",
      status: "scheduled",
      rationale: "Prepares focused discussion on tremor trends and off-periods",
      rationaleZh: "為震顫趨勢及藥效間隔的針對性討論作準備",
      ...auth,
    },
    {
      id: `${p.id}-cp4`,
      section: "medication",
      action: "Review levodopa timing if off-period tremor worsens on smartwatch",
      actionZh: "如智能手錶顯示藥效間隔震顫惡化，覆核左旋多巴用藥時間",
      owner: p.doctor,
      ownerZh: p.doctor,
      ownerLayer: "specialist",
      dueDate: "2026-06-20",
      status: "scheduled",
      rationale: "Smartwatch captures on/off motor fluctuations in Parkinson's",
      rationaleZh: "智能手錶可捕捉帕金森開關期運動波動",
      ...auth,
    },
    {
      id: `${p.id}-cp5`,
      section: "medication",
      action: "Monitor for levodopa-induced dyskinesia; document peak-dose symptoms in care diary",
      actionZh: "監察左旋多巴所致異動症；在護理日誌記錄峰值劑量症狀",
      owner: p.caretaker,
      ownerZh: p.caretaker,
      ownerLayer: "community",
      dueDate: "2026-06-15",
      status: yearsSinceDx >= 5 ? "due_soon" : "scheduled",
      rationale: "Dyskinesia risk increases with disease duration and levodopa exposure",
      rationaleZh: "異動症風險隨病程及左旋多巴使用時間增加",
      ...auth,
    },
    {
      id: `${p.id}-cp6`,
      section: "medication",
      action: "Pharmacist medication review — check interactions & adherence with levodopa/agonist combo",
      actionZh: "藥劑師藥物覆核 — 檢查左旋多巴/激動劑組合的相互作用及依從性",
      owner: "Community pharmacy",
      ownerZh: "社區藥房",
      ownerLayer: "community",
      dueDate: "2026-06-18",
      status: "due_soon",
      rationale: "Polypharmacy common in Parkinson's — quarterly review recommended",
      rationaleZh: "帕金森病常見多重用藥 — 建議每季覆核",
      ...auth,
    },
    ...(hasCopd
      ? [
          {
            id: `${p.id}-cp7`,
            section: "medication" as const,
            action: "COPD inhaler technique review with caretaker — tiotropium/olodaterol",
            actionZh: "與照顧者覆核慢阻肺吸入技巧 — 噻托溴銨/奧達特羅",
            owner: "Dr. Eva Richter (Pulmonology)",
            ownerZh: "Dr. Eva Richter（肺科）",
            ownerLayer: "specialist" as const,
            dueDate: "2026-06-11",
            status: "due_soon" as const,
            rationale: "Mean SpO₂ 91% and rescue inhaler overuse — technique may be affected by PD tremor",
            rationaleZh: "平均血氧91%及急救吸入劑過量 — 帕金森震顫可能影響吸入技巧",
            authoredBy: "doc-richter",
            authoredByName: "Dr. Eva Richter (Pulmonology)",
            createdAt: "2026-02-10",
          },
          {
            id: `${p.id}-cp8`,
            section: "follow_up" as const,
            action: "Sleep study review — OSA overlap with COPD + Parkinson's",
            actionZh: "睡眠檢查覆核 — 慢阻肺與帕金森並存的 OSA",
            owner: "Dr. Eva Richter (Pulmonology)",
            ownerZh: "Dr. Eva Richter（肺科）",
            ownerLayer: "specialist" as const,
            dueDate: "2026-06-25",
            status: "scheduled" as const,
            rationale: "Sleep efficiency 62%, AHI 18.4 — CPAP candidacy assessment",
            rationaleZh: "睡眠效率62%，AHI 18.4 — CPAP 適用性評估",
            authoredBy: "doc-richter",
            authoredByName: "Dr. Eva Richter (Pulmonology)",
            createdAt: "2026-02-10",
          },
        ]
      : []),
  ];
}

function buildStaticSummary(p: PadsPatientSummary, hasCopd = false): string {
  const yrs = p.age_at_diagnosis ? p.age - p.age_at_diagnosis : 0;
  const base = `Parkinson's disease patient (age ${p.age}, ${yrs} years since diagnosis). `
    + `${p.nms_positive_count}/30 non-motor symptoms (PDNMS) reported. `
    + `Smartwatch monitoring via PADS protocol. Neurologist: ${p.doctor}. Caretaker: ${p.caretaker}.`;
  if (!hasCopd) return base;
  return base
    + " Comorbid COPD (GOLD II) with e-health SpO₂ averaging 91%, sleep efficiency 62%, "
    + "and moderate OSA (AHI 18.4). Pulmonology: Dr. Eva Richter.";
}
