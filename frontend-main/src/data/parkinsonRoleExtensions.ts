import type { RoleExtensions } from "@/types/roles";

const L = (en: string, zh: string) => ({ en, zh });

/** Parkinson's-specific role extensions — used for all PADS patients */
export const defaultParkinsonExtensions: RoleExtensions = {
  lastReview: "2024-01-05",
  nextAppointment: "2026-06-20",
  careTeam: [
    { id: "ct1", role: L("Movement disorders neurologist", "運動障礙神經科醫生"), name: "Dr. Sarah Müller", organization: "University Hospital Movement Disorders Clinic" },
    { id: "ct2", role: L("Parkinson's nurse specialist", "帕金森專科護士"), name: "Ms. Fischer", organization: "PADS Care Team" },
    { id: "ct3", role: L("Physiotherapist", "物理治療師"), name: "Mr. Braun", organization: "Neurorehabilitation Unit" },
    { id: "ct4", role: L("Family caretaker", "家庭照顧者"), name: "Assigned caretaker", organization: "Home care" },
  ],
  appointments: [
    { id: "ap1", date: "2026-06-20", title: L("Neurology follow-up + smartwatch review", "神經科覆診及智能手錶覆核"), location: L("Movement Disorders Clinic", "運動障礙門診"), with: "Dr. Sarah Müller" },
    { id: "ap2", date: "2026-07-05", title: L("Physiotherapy — gait & balance", "物理治療 — 步態及平衡"), location: L("Neurorehab Unit", "神經復康部"), with: "Mr. Braun" },
    { id: "ap3", date: "2026-07-12", title: L("Home PADS assessment (smartwatch)", "家居 PADS 評估（智能手錶）"), location: L("Home", "家居"), with: "Caretaker-assisted" },
  ],
  checklist: [
    { id: "cl1", label: L("Take levodopa on schedule (watch for off-periods)", "按時服用左旋多巴（留意藥效間隔）"), done: false, priority: "high" },
    { id: "cl2", label: L("Complete weekly smartwatch Relaxed task", "完成每週智能手錶放鬆任務"), done: false, priority: "high" },
    { id: "cl3", label: L("Log tremor changes in symptom diary", "於徵象日記記錄震顫變化"), done: false, priority: "normal" },
    { id: "cl4", label: L("Practice Hold Weight assessment step", "練習持重物評估步驟"), done: false, priority: "normal" },
    { id: "cl5", label: L("Report falls or freezing of gait immediately", "如有跌倒或步態凍結立即報告"), done: true, priority: "high" },
  ],
  conditionExplainers: [
    { id: "ce1", name: L("Parkinson's disease", "帕金森病"), simpleExplanation: L("A progressive movement disorder affecting tremor, stiffness, and slowness. Smartwatch monitoring helps track symptoms between visits.", "漸進性運動障礙，影響震顫、僵硬及動作緩慢。智能手錶有助在就診間隔監測徵象。") },
    { id: "ce2", name: L("Rest tremor", "靜止性震顫"), simpleExplanation: L("Rhythmic shaking (~4–6 Hz) when at rest, often in one hand. The Relaxed smartwatch task measures this.", "休息時的節律性震顫（約4–6 Hz），常見於單手。智能手錶放鬆任務可量度此徵象。") },
    { id: "ce3", name: L("Non-motor symptoms", "非運動症狀"), simpleExplanation: L("Sleep problems, mood changes, constipation, and cognitive issues are common. The PDNMS questionnaire tracks 30 items.", "睡眠、情緒、便秘及認知問題均常見。PDNMS 問卷追蹤30項徵象。") },
    { id: "ce4", name: L("On/off periods", "開關期"), simpleExplanation: L("Medication effects can wear off before the next dose. Smartwatch data may show worsening tremor during off-periods.", "藥效可能在下次服藥前減退。智能手錶數據可顯示藥效間隔期震顫惡化。") },
  ],
  patientRedFlags: [
    { id: "pr1", symptom: L("Sudden worsening of tremor or rigidity", "震顫或僵硬突然惡化"), action: L("Check medication timing; contact neurologist within 24h", "檢查用藥時間；24小時內聯絡神經科") },
    { id: "pr2", symptom: L("Frequent falls or freezing of gait", "經常跌倒或步態凍結"), action: L("Urgent physiotherapy referral; fall risk assessment", "緊急物理治療轉介；跌倒風險評估") },
    { id: "pr3", symptom: L("Hallucinations or severe confusion", "幻覺或嚴重神志不清"), action: L("Contact neurologist immediately — may need medication adjustment", "立即聯絡神經科 — 可能需要調整藥物") },
    { id: "pr4", symptom: L("Difficulty swallowing or choking", "吞嚥困難或窒息"), action: L("Speech therapy referral; aspiration risk review", "言語治療轉介；吸入性風險評估") },
    { id: "pr5", symptom: L("Missed levodopa doses for 2+ days", "連續2天以上漏服左旋多巴"), action: L("Do not double dose — call nurse specialist", "請勿加倍服藥 — 致電專科護士") },
  ],
  patientMedCards: [
    { id: "pm1", name: "Levodopa/Carbidopa", purpose: L("Reduces tremor, stiffness, slowness", "減輕震顫、僵硬及動作緩慢"), whenToTake: L("Every 4–6 hours during waking hours", "清醒時每4–6小時"), refillStatus: L("OK — 2 weeks left", "充足 — 尚餘2週"), status: "ok" },
    { id: "pm2", name: "Pramipexole", purpose: L("Dopamine agonist for motor symptoms", "多巴胺受體激動劑"), whenToTake: L("Twice daily with meals", "每日兩次，隨餐"), refillStatus: L("OK", "充足"), status: "ok" },
    { id: "pm3", name: "Rasagiline", purpose: L("MAO-B inhibitor — slows symptom progression", "MAO-B 抑制劑"), whenToTake: L("Once daily in the morning", "每日早上一次"), refillStatus: L("OK", "充足"), status: "ok" },
  ],
  smokingPanel: L("Wear your smartwatch on both wrists during PADS assessments. Complete the Relaxed task in the morning before your first levodopa dose to help detect off-period tremor. Your caretaker can assist with the 11-step protocol at home.", "進行 PADS 評估時雙腕佩戴智能手錶。於首次左旋多巴劑量前早上完成放鬆任務，有助偵測藥效間隔震顫。照顧者可在家協助完成11項方案。"),
  problemCards: [
    { id: "pc1", domain: L("Motor symptoms (tremor)", "運動症狀（震顫）"), status: "monitoring", summary: L("Smartwatch shows rest tremor ~4 Hz on Relaxed task; bilateral comparison needed", "智能手錶放鬆任務顯示靜止震顫約4 Hz；需比較雙側"), nextAction: L("Review levodopa timing; compare left vs right wrist data", "覆核左旋多巴時間；比較左右手腕數據") },
    { id: "pc2", domain: L("Non-motor symptoms", "非運動症狀"), status: "monitoring", summary: L("PDNMS domains elevated — sleep/fatigue and mood require attention", "PDNMS 領域升高 — 需關注睡眠/疲勞及情緒"), nextAction: L("Targeted review of sleep hygiene and mood screening", "針對性睡眠衛生及情緒篩查") },
    { id: "pc3", domain: L("Medication adherence", "用藥依從"), status: "monitoring", summary: L("Off-period tremor may indicate suboptimal levodopa timing", "藥效間隔震顫可能表示左旋多巴時間未優化"), nextAction: L("Adjust dosing schedule; consider extended-release formulation", "調整服藥時間；考慮緩釋劑型") },
    { id: "pc4", domain: L("Functional mobility", "功能性活動"), status: "stable", summary: L("Drink from Glass and Touch Nose tasks within expected range", "持杯及觸鼻任務在預期範圍內"), nextAction: L("Continue home physiotherapy exercises", "繼續家居物理治療練習") },
    { id: "pc5", domain: L("Smartwatch monitoring", "智能手錶監測"), status: "stable", summary: L("PADS 11-step protocol completed; data synced to neurologist dashboard", "PADS 11項方案已完成；數據已同步至神經科儀表板"), nextAction: L("Weekly home assessment with caretaker support", "每週家居評估（照顧者協助）") },
  ],
  referralActions: [
    { id: "ra1", action: L("Continue neurologist-led Parkinson's care", "繼續神經科主導的帕金森護理"), pathway: "specialist", status: "recommended" },
    { id: "ra2", action: L("Physiotherapy — gait and balance training", "物理治療 — 步態及平衡訓練"), pathway: "dhc", status: "recommended" },
    { id: "ra3", action: L("Speech therapy if swallowing PDNMS positive", "如吞嚥 PDNMS 陽性則轉介言語治療"), pathway: "specialist", status: "pending" },
    { id: "ra4", action: L("Occupational therapy for fine motor tasks", "職業治療 — 精細動作任務"), pathway: "dhc", status: "pending" },
    { id: "ra5", action: L("Urgent review if hallucinations or rapid decline", "如有幻覺或急劇惡化則緊急評估"), pathway: "urgent", status: "pending" },
  ],
  nurseQueue: [
    { id: "nq1", task: L("Smartwatch assessment compliance check", "智能手錶評估依從性檢查"), priority: "urgent", dueDate: "2026-06-10" },
    { id: "nq2", task: L("PDNMS questionnaire follow-up call", "PDNMS 問卷跟進電話"), priority: "routine", dueDate: "2026-06-15" },
    { id: "nq3", task: L("Caretaker training — PADS protocol steps", "照顧者培訓 — PADS 方案步驟"), priority: "routine", dueDate: "2026-06-20" },
    { id: "nq4", task: L("Fall risk home safety assessment", "跌倒風險家居安全評估"), priority: "routine" },
    { id: "nq5", task: L("Medication timing review with pharmacist", "與藥劑師覆核用藥時間"), priority: "routine" },
  ],
  selfManagement: [
    { id: "sm1", label: L("Levodopa adherence", "左旋多巴依從"), value: "78%", status: "warning", detail: L("Occasional missed afternoon doses", "偶爾漏服下午劑量") },
    { id: "sm2", label: L("Smartwatch assessments", "智能手錶評估"), value: "4/7 days", status: "warning", detail: L("Weekly Relaxed + Hold Weight tasks logged", "每週放鬆及持重物任務記錄") },
    { id: "sm3", label: L("Tremor diary", "震顫日記"), value: "5/7 days", status: "good", detail: L("Morning tremor severity tracked", "早上震顫嚴重度已記錄") },
    { id: "sm4", label: L("Exercise (physio plan)", "運動（物理治療計劃）"), value: "3/7 days", status: "warning", detail: L("Gait training exercises incomplete", "步態訓練未完成") },
    { id: "sm5", label: L("Sleep quality", "睡眠質素"), value: "Poor", status: "poor", detail: L("PDNMS sleep domain positive — review needed", "PDNMS 睡眠領域陽性 — 需覆核") },
  ],
  careBarriers: [
    { id: "cb1", barrier: L("Difficulty performing smartwatch tasks alone", "難以獨立完成智能手錶任務"), impact: L("Caretaker assistance required for assessment", "評估需照顧者協助") },
    { id: "cb2", barrier: L("Tremor affects fine motor phone interaction", "震顫影響精細手部操作"), impact: L("Missed app-based questionnaire entries", "錯過應用程式問卷填寫") },
    { id: "cb3", barrier: L("Transport to neurology clinic", "往神經科門診交通"), impact: L("Delayed follow-up appointments", "覆診延期") },
  ],
  coachingPlan: [
    { id: "ch1", goal: L("Complete weekly PADS smartwatch protocol", "完成每週 PADS 智能手錶方案"), status: "active" },
    { id: "ch2", goal: L("Improve sleep hygiene per PDNMS findings", "根據 PDNMS 結果改善睡眠衛生"), status: "planned" },
    { id: "ch3", goal: L("Daily gait exercises (15 min)", "每日步態練習（15分鐘）"), status: "active" },
  ],
  nurseRedFlags: [
    L("Worsening rest tremor on smartwatch — possible off-period"),
    L("PDNMS hallucination item positive — notify neurologist"),
    L("Missed levodopa doses reported by caretaker"),
  ],
  nurseOutreach: {
    lastContact: "2026-06-01",
    summary: L("Caretaker reports increased morning tremor before first levodopa dose. Smartwatch Relaxed task confirms ~5 Hz right-dominant tremor.", "照顧者報告首次左旋多巴劑量前早上震顫增加。智能手錶放鬆任務確認右側主導約5 Hz震顫。"),
    nextStep: L("Schedule neurologist medication timing review; reinforce smartwatch assessment routine.", "安排神經科覆核用藥時間；加強智能手錶評估常規。"),
  },
  medReconciliation: [
    { id: "mr1", name: "Levodopa/Carbidopa", indication: L("Parkinson's motor symptoms", "帕金森運動症狀"), source: "specialist", sourceLabel: L("Neurologist", "神經科醫生") },
    { id: "mr2", name: "Pramipexole", indication: L("Dopamine agonist", "多巴胺受體激動劑"), source: "specialist", sourceLabel: L("Neurologist", "神經科醫生") },
    { id: "mr3", name: "Rasagiline", indication: L("MAO-B inhibitor", "MAO-B 抑制劑"), source: "specialist", sourceLabel: L("Neurologist", "神經科醫生") },
  ],
  pharmacistFlags: [
    { id: "pf1", type: "timing", title: L("Levodopa timing critical", "左旋多巴時間關鍵"), detail: L("Off-period tremor linked to dosing gaps — review 4–6h schedule", "藥效間隔震顫與服藥間隔有關 — 覆核4–6小時方案"), severity: "high" },
    { id: "pf2", type: "interaction", title: L("MAO-B + dopamine agonist — monitor", "MAO-B 與多巴胺激動劑 — 監測"), detail: L("Standard PD combination; watch for orthostatic hypotension", "標準帕金森組合；留意直立性低血壓"), severity: "medium" },
  ],
  counselingTasks: [
    { id: "co1", task: L("Levodopa on/off education for caretaker", "照顧者左旋多巴開關期教育"), status: "due" },
    { id: "co2", task: L("Medication timing alignment with meals", "用藥時間與進食配合"), status: "scheduled" },
  ],
  pharmacistInterventions: [
    { id: "pi1", date: "2026-05-15", action: L("Adjusted levodopa to 5 doses/day", "調整左旋多巴至每日5劑"), outcome: L("Caretaker reports improved afternoon control", "照顧者報告下午控制改善") },
  ],
  pharmacistActions: [
    { id: "pa1", action: L("Review smartwatch off-period patterns vs dosing log", "比較智能手錶藥效間隔模式與服藥記錄"), priority: "high" },
    { id: "pa2", action: L("Extended-release levodopa counselling", "緩釋左旋多巴輔導"), priority: "medium" },
  ],
  adherenceNotes: L("Levodopa timing is the main adherence concern. Smartwatch data helps identify off-periods for dose optimisation.", "左旋多巴時間是主要依從性關注點。智能手錶數據有助識別藥效間隔期以優化劑量。"),
};
