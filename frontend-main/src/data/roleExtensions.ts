import type { RoleExtensions } from "@/types/roles";
import { comorbidParkinsonCopdExtensions } from "@/data/comorbidRoleExtensions";
import { defaultParkinsonExtensions } from "@/data/parkinsonRoleExtensions";

const L = (en: string, zh: string) => ({ en, zh });

export const roleExtensions: Record<string, RoleExtensions> = {
  p1: {
    lastReview: "2025-09-28",
    nextAppointment: "2025-12-13",
    careTeam: [
      { id: "ct1", role: L("Family doctor", "家庭醫生"), name: "Dr. Lee Mei-ling", organization: "Shatin FM Clinic", contact: "2634 1234" },
      { id: "ct2", role: L("DHC nurse", "地區康健中心護士"), name: "Ms. Cheung", organization: "Sha Tin DHC", contact: "2601 2345" },
      { id: "ct3", role: L("Community pharmacist", "社區藥劑師"), name: "Mr. Lam", organization: "Shatin Community Pharmacy" },
      { id: "ct4", role: L("Respiratory specialist", "呼吸科專科"), name: "Dr. Wong Ka-fai", organization: "Prince of Wales Hospital" },
    ],
    appointments: [
      { id: "ap1", date: "2025-12-13", title: L("Nurse follow-up clinic", "護士覆診"), location: L("Sha Tin DHC", "沙田地區康健中心"), with: "Ms. Cheung" },
      { id: "ap2", date: "2025-12-20", title: L("Family doctor review", "家庭醫生覆診"), location: L("Shatin FM Clinic", "沙田家庭醫學診所"), with: "Dr. Lee Mei-ling" },
      { id: "ap3", date: "2026-01-10", title: L("Retinal screening", "視網膜篩查"), location: L("DHC screening hub", "地區康健中心篩查"), with: "Optometry team" },
    ],
    checklist: [
      { id: "cl1", label: L("Take morning medicines", "服用早上藥物"), done: false, priority: "high" },
      { id: "cl2", label: L("Check inhaler supply (rescue may run low)", "檢查吸入劑存量（急救劑可能不足）"), done: false, priority: "high" },
      { id: "cl3", label: L("Attend nurse follow-up Friday", "星期五出席護士覆診"), done: false, priority: "normal" },
      { id: "cl4", label: L("Book retinal screening", "預約視網膜篩查"), done: false, priority: "normal" },
      { id: "cl5", label: L("Log home blood pressure today", "今日記錄家居血壓"), done: true, priority: "normal" },
    ],
    conditionExplainers: [
      { id: "ce1", name: L("COPD", "慢性阻塞性肺病"), simpleExplanation: L("Your lungs need extra support with inhalers. Watch for worsening breathlessness.", "您的肺部需要吸入劑輔助。留意呼吸困難是否惡化。") },
      { id: "ce2", name: L("High blood pressure", "高血壓"), simpleExplanation: L("Keeping BP steady protects your heart and kidneys. Home readings help your care team.", "穩定血壓保護心臟和腎臟。家居讀數有助護理團隊。") },
      { id: "ce3", name: L("Diabetes", "糖尿病"), simpleExplanation: L("Regular checks and diet help prevent complications. Retinal screening is due.", "定期檢查和飲食有助預防併發症。視網膜篩查到期。") },
      { id: "ce4", name: L("Heart disease risk", "心臟病風險"), simpleExplanation: L("Past heart disease means staying on medicines and reporting chest pain early.", "有心臟病紀錄需依時服藥，胸悶要及早告知。") },
    ],
    patientRedFlags: [
      { id: "pr1", symptom: L("Worsening breathlessness", "呼吸困難惡化"), action: L("Use rescue inhaler as advised; call DHC nurse or go to A&E if severe", "按指示用急救吸入劑；嚴重時致電地區康健中心或往急症室") },
      { id: "pr2", symptom: L("Swollen ankles", "腳踝腫脹"), action: L("Contact family doctor within 48 hours", "48小時內聯絡家庭醫生") },
      { id: "pr3", symptom: L("Chest pain or pressure", "胸痛或壓迫感"), action: L("Call 999 immediately", "立即致電999") },
      { id: "pr4", symptom: L("Dizziness or confusion", "頭暈或神智不清"), action: L("Check blood sugar/BP; contact care team", "檢查血糖/血壓；聯絡護理團隊") },
      { id: "pr5", symptom: L("Missed medicines for several days", "連續數天漏服"), action: L("Do not double up — call pharmacist or nurse", "請勿加倍服藥 — 致電藥劑師或護士") },
    ],
    patientMedCards: [
      { id: "pm1", name: "Tiotropium/olodaterol", purpose: L("Opens airways daily", "每日打開氣道"), whenToTake: L("2 puffs every morning", "每天早上2次"), refillStatus: L("OK — 2 weeks left", "充足 — 尚餘2週"), status: "ok" },
      { id: "pm2", name: "Salbutamol (rescue)", purpose: L("Quick relief for breathlessness", "快速紓緩呼吸困難"), whenToTake: L("When needed — max 4/day", "需要時用 — 每日最多4次"), refillStatus: L("Running low", "存量偏低"), status: "low" },
      { id: "pm3", name: "Amlodipine", purpose: L("Lowers blood pressure", "降血壓"), whenToTake: L("Once daily with breakfast", "每日一次，早餐後"), refillStatus: L("Refill overdue — visit pharmacy", "配藥逾期 — 請到藥房"), status: "overdue" },
      { id: "pm4", name: "Metformin", purpose: L("Helps control blood sugar", "控制血糖"), whenToTake: L("Twice daily with meals", "每日兩次，隨餐"), refillStatus: L("OK", "充足"), status: "ok" },
      { id: "pm5", name: "Aspirin", purpose: L("Protects heart", "保護心臟"), whenToTake: L("Once daily", "每日一次"), refillStatus: L("OK", "充足"), status: "ok" },
    ],
    smokingPanel: L("You are not alone — Sha Tin DHC offers free smoking cessation support. Reducing smoking helps your lungs and heart. Ask your nurse about nicotine replacement at your next visit.", "您並不孤單 — 沙田地區康健中心提供免費戒煙支援。減少吸煙對肺和心臟都有幫助。下次覆診可向護士了解尼古丁替代療法。"),
    problemCards: [
      { id: "pc1", domain: L("COPD control", "慢阻肺控制"), status: "uncontrolled", summary: L("Rescue inhaler overuse; technique unclear post-regimen change", "急救吸入劑過量；改方案後技巧不明"), nextAction: L("Inhaler reconciliation + technique review", "吸入劑核對 + 技巧覆核") },
      { id: "pc2", domain: L("BP control", "血壓控制"), status: "uncontrolled", summary: L("Home BP avg 158/92; amlodipine refill gap", "家居血壓平均158/92；氨氯地平配藥缺口"), nextAction: L("Titrate antihypertensive; assign DHC monitoring owner", "調整降壓藥；指派地區康健中心監測責任") },
      { id: "pc3", domain: L("Diabetes monitoring", "糖尿病監測"), status: "monitoring", summary: L("Fasting glucose rising; retinal screening overdue", "空腹血糖上升；視網膜篩查逾期"), nextAction: L("Book screening via DHC coordinator", "經地區康健中心統籌預約篩查") },
      { id: "pc4", domain: L("Cardiac risk", "心臟風險"), status: "monitoring", summary: L("IHD on aspirin; no recent cardiac symptoms", "缺血性心臟病服阿司匹林；近期無心臟徵象"), nextAction: L("Continue primary care lead; annual cardiology review", "繼續家庭醫生主責；年度心臟科覆核") },
      { id: "pc5", domain: L("Medication adherence", "用藥依從"), status: "uncontrolled", summary: L("58% overall; unclear ownership post-discharge", "整體58%；出院後責任歸屬不明"), nextAction: L("Pharmacist med review + shared plan update", "藥劑師用藥覆核 + 更新共享計劃") },
    ],
    referralActions: [
      { id: "ra1", action: L("Continue stable chronic care in primary care", "於基層繼續穩定慢病管理"), pathway: "primary", status: "recommended" },
      { id: "ra2", action: L("Two-way referral — respiratory clinic (spirometry)", "雙向轉介 — 呼吸科（肺功能）"), pathway: "specialist", status: "pending" },
      { id: "ra3", action: L("DHC nurse clinic + allied health (smoking, BP monitoring)", "地區康健中心護士診所 + 專職（戒煙、血壓監測）"), pathway: "dhc", status: "recommended" },
      { id: "ra4", action: L("Community pharmacist medication review", "社區藥劑師用藥覆核"), pathway: "pharmacy", status: "pending" },
      { id: "ra5", action: L("Urgent hospital review if red flags persist", "紅旗持續則緊急醫院評估"), pathway: "urgent", status: "pending" },
    ],
    nurseQueue: [
      { id: "nq1", task: L("Post-discharge call-back (day 14)", "出院第14天電話回訪"), priority: "urgent", dueDate: "2025-12-02" },
      { id: "nq2", task: L("Rescue inhaler overuse — same-day triage call", "急救吸入劑過量 — 即日分流電話"), priority: "urgent", dueDate: "2025-12-06" },
      { id: "nq3", task: L("Book retinal screening", "預約視網膜篩查"), priority: "routine", dueDate: "2025-12-15" },
      { id: "nq4", task: L("Smoking cessation session", "戒煙輔導環節"), priority: "routine", dueDate: "2025-12-20" },
      { id: "nq5", task: L("Inhaler technique reinforcement", "吸入劑技巧強化"), priority: "routine" },
    ],
    selfManagement: [
      { id: "sm1", label: L("Inhaler adherence", "吸入劑依從"), value: "62%", status: "poor", detail: L("Rescue overuse; LABA/LAMA technique uncertain", "急救過量；長效組合技巧不確定") },
      { id: "sm2", label: L("BP logging", "血壓記錄"), value: "5/7 days", status: "warning", detail: L("Uploads via DHC app — trending high", "經地區康健中心應用上傳 — 趨勢偏高") },
      { id: "sm3", label: L("Glucose logging", "血糖記錄"), value: "2/7 days", status: "poor", detail: L("Irregular fasting logs", "空腹記錄不規律") },
      { id: "sm4", label: L("Smoking status", "吸煙狀況"), value: "Active", status: "poor", detail: L("35 pack-years; cessation not yet engaged", "35包年；尚未參與戒煙") },
      { id: "sm5", label: L("Symptom diary", "徵象日記"), value: "40%", status: "warning", detail: L("Breathlessness entries incomplete", "呼吸困難記錄不完整") },
    ],
    careBarriers: [
      { id: "cb1", barrier: L("Transport to DHC on Fridays", "星期五往地區康健中心交通"), impact: L("Missed 1 nurse session", "錯過1次護士環節") },
      { id: "cb2", barrier: L("Confusion about inhaler change", "吸入劑更改後混淆"), impact: L("Low adherence post-discharge", "出院後依從性低") },
      { id: "cb3", barrier: L("Low health literacy (Cantonese-only)", "健康素養偏低（只操粵語）"), impact: L("Written instructions not followed", "書面指示未遵從") },
      { id: "cb4", barrier: L("Daughter as primary caregiver — works weekdays", "女兒為主要照顧者 — 平日上班"), impact: L("Appointment adherence gaps", "預約依從性缺口") },
    ],
    coachingPlan: [
      { id: "ch1", goal: L("Reduce rescue inhaler to ≤4 puffs/day", "將急救吸入劑減至每日≤4次"), status: "active" },
      { id: "ch2", goal: L("Daily 15-min walk if breathless stable", "呼吸穩定時每日步行15分鐘"), status: "active" },
      { id: "ch3", goal: L("Low-salt diet reinforcement", "低鹽飲食強化"), status: "active" },
      { id: "ch4", goal: L("Inhaler technique — spacer demo", "吸入劑技巧 — 儲霧器示範"), status: "planned" },
      { id: "ch5", goal: L("Foot care reminders (diabetes)", "足部護理提醒（糖尿病）"), status: "planned" },
    ],
    nurseRedFlags: [
      L("Rescue inhaler 6 puffs yesterday — outreach today", "昨日急救吸入劑6次 — 今日外展"),
      L("No family doctor review 14 days post-discharge", "出院14天未見家庭醫生"),
      L("Home BP trending up — escalate to family doctor if >160 systolic", "家居血壓上升 — 收縮壓>160則升級至家庭醫生"),
    ],
    nurseOutreach: {
      lastContact: "2025-11-25",
      summary: L("Patient reports breathlessness on stairs; unsure about new inhaler. Daughter helps with meds but confused about amlodipine refill.", "患者報上樓梯气促；新吸入劑用法不明。女兒協助配藥但氨氯地平配藥混淆。"),
      nextStep: L("Schedule inhaler demo + book family doctor within 7 days", "安排吸入劑示範 + 7天內預約家庭醫生"),
    },
    medReconciliation: [
      { id: "mr1", name: "Tiotropium/olodaterol", indication: L("COPD maintenance", "慢阻肺維持"), source: "specialist", sourceLabel: L("Respiratory specialist", "呼吸科專科"), refillDue: "2025-12-18" },
      { id: "mr2", name: "Salbutamol", indication: L("COPD rescue", "慢阻肺急救"), source: "family_doctor", sourceLabel: L("Family doctor", "家庭醫生"), refillDue: "2025-12-01", refillGapDays: 5 },
      { id: "mr3", name: "Amlodipine", indication: L("Hypertension", "高血壓"), source: "family_doctor", sourceLabel: L("Family doctor", "家庭醫生"), refillDue: "2025-11-30", refillGapDays: 6 },
      { id: "mr4", name: "Metformin", indication: L("Type 2 diabetes", "第二型糖尿病"), source: "family_doctor", sourceLabel: L("Family doctor", "家庭醫生"), refillDue: "2025-12-22" },
      { id: "mr5", name: "Aspirin", indication: L("IHD secondary prevention", "缺血性心臟二級預防"), source: "specialist", sourceLabel: L("Cardiology", "心臟科"), refillDue: "2026-01-05" },
    ],
    pharmacistFlags: [
      { id: "pf1", type: "misuse", title: L("Rescue inhaler overuse risk", "急救吸入劑過量風險"), detail: L("6 puffs reported yesterday vs max 4 — assess control & technique", "昨日報告6次 vs 上限4次 — 評估控制及技巧"), severity: "high" },
      { id: "pf2", type: "refill", title: L("Amlodipine refill gap", "氨氯地平配藥缺口"), detail: L("5 days overdue — BP destabilisation risk", "逾期5天 — 血壓不穩風險"), severity: "high" },
      { id: "pf3", type: "burden", title: L("Moderate pill burden", "中等服藥負擔"), detail: L("5 chronic meds + complex inhaler regimen", "5種慢性藥 + 複雜吸入劑方案"), severity: "medium" },
      { id: "pf4", type: "timing", title: L("Timing complexity", "服藥時間複雜"), detail: L("Mixed OD/BD + PRN rescue — consider blister pack", "混合每日/每日兩次 + 需要時急救 — 考慮分裝"), severity: "medium" },
      { id: "pf5", type: "duplication", title: L("No duplication detected", "未發現重複"), detail: L("Single antihypertensive — OK", "單一降壓藥 — 正常"), severity: "low" },
    ],
    counselingTasks: [
      { id: "co1", task: L("Inhaler technique check (LABA/LAMA + spacer)", "吸入劑技巧檢查（長效組合 + 儲霧器）"), status: "due" },
      { id: "co2", task: L("Explain rescue vs maintenance inhalers", "解釋急救 vs 維持吸入劑"), status: "due" },
      { id: "co3", task: L("Amlodipine adherence counselling", "氨氯地平依從輔導"), status: "scheduled" },
      { id: "co4", task: L("Smoking interaction with COPD meds", "吸煙與慢阻肺藥物相互作用"), status: "scheduled" },
    ],
    pharmacistInterventions: [
      { id: "pi1", date: "2025-11-20", action: L("Flagged rescue overuse to DHC nurse", "向地區康健中心護士標記急救過量"), outcome: L("Call-back scheduled", "已安排回電") },
      { id: "pi2", date: "2025-10-15", action: L("Blister pack offered — patient declined", "提供分裝 — 患者拒絕"), outcome: L("Revisit after discharge", "出院後再議") },
    ],
    pharmacistActions: [
      { id: "pa1", action: L("Contact Dr. Lee re: amlodipine refill & BP trend", "聯絡李醫生：氨氯地平配藥及血壓趨勢"), priority: "high" },
      { id: "pa2", action: L("Counsel patient on inhaler technique — book 20 min slot", "輔導吸入劑技巧 — 預約20分鐘"), priority: "high" },
      { id: "pa3", action: L("Simplify timing chart for caregiver", "為照顧者簡化服藥時間表"), priority: "medium" },
    ],
    adherenceNotes: L("Self-reported missed amlodipine 3 days last week. Rescue inhaler used as maintenance — education gap.", "自述上週漏服氨氯地平3天。急救吸入劑被當維持劑使用 — 教育缺口。"),
  },
  p2: {
    lastReview: "2025-10-05",
    nextAppointment: "2025-12-10",
    careTeam: [
      { id: "ct1", role: L("Family doctor", "家庭醫生"), name: "Dr. Ho Chun-wah", organization: "Tuen Mun FM Clinic" },
      { id: "ct2", role: L("DHC allied health", "地區康健中心專職"), name: "Tuen Mun DHC team", organization: "Tuen Mun DHC" },
      { id: "ct3", role: L("Pharmacist", "藥劑師"), name: "Ms. Yeung", organization: "Tuen Mun Pharmacy" },
    ],
    appointments: [
      { id: "ap1", date: "2025-12-10", title: L("Pulmonary rehab", "肺復康"), location: L("Tuen Mun DHC", "屯門地區康健中心"), with: "Allied health" },
    ],
    checklist: [
      { id: "cl1", label: L("Take insulin as prescribed", "按時注射胰島素"), done: true, priority: "high" },
      { id: "cl2", label: L("Re-book pulmonary rehab", "重新預約肺復康"), done: false, priority: "high" },
    ],
    conditionExplainers: [
      { id: "ce1", name: L("COPD (severe)", "慢阻肺（嚴重）"), simpleExplanation: L("Your lungs need careful monitoring. Attend rehab sessions.", "您的肺部需密切監察。請出席復康環節。") },
      { id: "ce2", name: L("Diabetes", "糖尿病"), simpleExplanation: L("Blood sugar control prevents complications.", "控制血糖可預防併發症。") },
    ],
    patientRedFlags: [
      { id: "pr1", symptom: L("Very high blood sugar", "血糖非常高"), action: L("Contact nurse or A&E", "聯絡護士或往急症室") },
    ],
    patientMedCards: [
      { id: "pm1", name: "Insulin glargine", purpose: L("Controls blood sugar", "控制血糖"), whenToTake: L("Every night", "每晚"), refillStatus: L("OK", "充足"), status: "ok" },
    ],
    smokingPanel: L("You quit smoking — great progress. Keep avoiding relapse with DHC support.", "您已戒煙 — 進展良好。繼續在地區康健中心支援下避免復吸。"),
    problemCards: [
      { id: "pc1", domain: L("COPD", "慢阻肺"), status: "uncontrolled", summary: L("Severe; missed rehab", "嚴重；錯過復康"), nextAction: L("Re-engage DHC", "重新參與地區康健中心") },
      { id: "pc2", domain: L("Diabetes", "糖尿病"), status: "uncontrolled", summary: L("HbA1c 9.1%", "糖化9.1%"), nextAction: L("Insulin optimisation", "胰島素優化") },
    ],
    referralActions: [
      { id: "ra1", action: L("Primary care insulin management", "基層胰島素管理"), pathway: "primary", status: "recommended" },
      { id: "ra2", action: L("DHC pulmonary rehab", "地區康健中心肺復康"), pathway: "dhc", status: "pending" },
    ],
    nurseQueue: [
      { id: "nq1", task: L("Re-book pulmonary rehab", "重新預約肺復康"), priority: "urgent" },
    ],
    selfManagement: [
      { id: "sm1", label: L("Rehab attendance", "復康出席"), value: "Missed", status: "poor", detail: L("No-show 6 weeks ago", "6週前缺席") },
    ],
    careBarriers: [
      { id: "cb1", barrier: L("Polypharmacy confusion", "多藥混淆"), impact: L("Insulin timing errors", "胰島素時間錯誤") },
    ],
    coachingPlan: [
      { id: "ch1", goal: L("Foot care daily check", "每日足部檢查"), status: "active" },
    ],
    nurseRedFlags: [L("HbA1c critical — urgent GP review", "糖化危急 —  urgent GP")],
    nurseOutreach: { lastContact: "2025-11-01", summary: L("Missed rehab", "錯過復康"), nextStep: L("Re-book", "重新預約") },
    medReconciliation: [
      { id: "mr1", name: "Insulin glargine", indication: L("Diabetes", "糖尿病"), source: "hospital", sourceLabel: L("Hospital", "醫院"), ownerUnclear: true },
      { id: "mr2", name: "Tiotropium", indication: L("COPD", "慢阻肺"), source: "specialist", sourceLabel: L("Specialist", "專科") },
    ],
    pharmacistFlags: [
      { id: "pf1", type: "burden", title: L("Polypharmacy", "多藥共用"), detail: L("Insulin + multiple oral agents", "胰島素 + 多種口服藥"), severity: "high" },
    ],
    counselingTasks: [
      { id: "co1", task: L("Insulin storage & timing", "胰島素儲存及時間"), status: "due" },
    ],
    pharmacistInterventions: [],
    pharmacistActions: [
      { id: "pa1", action: L("Med review with family doctor", "與家庭醫生用藥覆核"), priority: "high" },
    ],
    adherenceNotes: L("Refill confusion between hospital and community scripts.", "醫院與社區處方配藥混淆。"),
  },
  p3: {
    lastReview: "2025-11-15",
    nextAppointment: "2025-12-18",
    careTeam: [
      { id: "ct1", role: L("Family doctor", "家庭醫生"), name: "Dr. Tsang Wai-keung", organization: "Kwun Tong FM Clinic" },
      { id: "ct2", role: L("DHC nurse", "地區康健中心護士"), name: "Kwun Tong DHC", organization: "Kwun Tong DHC" },
    ],
    appointments: [
      { id: "ap1", date: "2025-12-18", title: L("Smoking cessation", "戒煙輔導"), location: L("Kwun Tong DHC", "觀塘地區康健中心"), with: "Allied health" },
    ],
    checklist: [
      { id: "cl1", label: L("Take BP medicines", "服用血壓藥"), done: true, priority: "high" },
      { id: "cl2", label: L("Book echo appointment", "預約超聲心動圖"), done: false, priority: "normal" },
    ],
    conditionExplainers: [
      { id: "ce1", name: L("Heart failure risk", "心衰竭風險"), simpleExplanation: L("Your heart needs protection — take meds and report swelling or breathlessness.", "心臟需要保護 — 服藥並報告腫脹或气促。") },
    ],
    patientRedFlags: [
      { id: "pr1", symptom: L("Sudden weight gain or swelling", "體重突增或腫脹"), action: L("Call family doctor same day", "即日致電家庭醫生") },
    ],
    patientMedCards: [
      { id: "pm1", name: "Bisoprolol", purpose: L("Heart rate & BP", "心率及血壓"), whenToTake: L("Morning", "早上"), refillStatus: L("OK", "充足"), status: "ok" },
    ],
    smokingPanel: L("Cutting down smoking reduces heart and lung strain. DHC can help when you're ready.", "減少吸煙可減輕心肺負擔。準備好時地區康健中心可提供協助。"),
    problemCards: [
      { id: "pc1", domain: L("HF risk", "心衰竭風險"), status: "monitoring", summary: L("Echo overdue", "超聲心動圖逾期"), nextAction: L("Cardiology referral chase", "追蹤心臟科轉介") },
    ],
    referralActions: [
      { id: "ra1", action: L("Continue primary care", "繼續基層"), pathway: "primary", status: "recommended" },
      { id: "ra2", action: L("Cardiology echo", "心臟科超聲心動圖"), pathway: "specialist", status: "pending" },
    ],
    nurseQueue: [
      { id: "nq1", task: L("Low self-management confidence — coaching call", "自我管理信心低 — 輔導電話"), priority: "routine" },
    ],
    selfManagement: [
      { id: "sm1", label: L("Confidence", "信心"), value: "Low", status: "poor", detail: L("Frequent ED worry", "擔心常往急症室") },
    ],
    careBarriers: [
      { id: "cb1", barrier: L("Anxiety about breathlessness", "對气促焦虑"), impact: L("ED visits", "急症室就診") },
    ],
    coachingPlan: [
      { id: "ch1", goal: L("Action plan for breathlessness", "气促應對計劃"), status: "active" },
    ],
    nurseRedFlags: [L("Echo overdue 5 months", "超聲心動圖逾期5個月")],
    nurseOutreach: { lastContact: "2025-11-20", summary: L("Stable BP; anxious", "血壓穩定；焦虑"), nextStep: L("Book cessation", "預約戒煙") },
    medReconciliation: [
      { id: "mr1", name: "Bisoprolol", indication: L("HF risk / HTN", "心衰竭風險/高血壓"), source: "family_doctor", sourceLabel: L("Family doctor", "家庭醫生") },
      { id: "mr2", name: "Ramipril", indication: L("HTN / cardiac", "高血壓/心臟"), source: "family_doctor", sourceLabel: L("Family doctor", "家庭醫生") },
    ],
    pharmacistFlags: [
      { id: "pf1", type: "timing", title: L("Both morning — OK", "均早上 — 正常"), detail: L("Simple regimen", "方案簡單"), severity: "low" },
    ],
    counselingTasks: [
      { id: "co1", task: L("Smoking cessation med options", "戒煙藥物選項"), status: "scheduled" },
    ],
    pharmacistInterventions: [],
    pharmacistActions: [
      { id: "pa1", action: L("Routine refill check", "常規配藥檢查"), priority: "medium" },
    ],
    adherenceNotes: L("Good oral med adherence; smoking continues.", "口服藥依從良好；仍在吸煙。"),
  },
};

export function getRoleExtensions(patientId: string): RoleExtensions {
  if (patientId === "pads-004") {
    return comorbidParkinsonCopdExtensions;
  }
  if (patientId.startsWith("pads-")) {
    return defaultParkinsonExtensions;
  }
  return roleExtensions[patientId] ?? defaultParkinsonExtensions;
}
