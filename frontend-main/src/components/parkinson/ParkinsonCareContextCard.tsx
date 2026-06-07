import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Props {
  patient: Patient;
  locale: Locale;
  variant: "timeline" | "carePlan" | "ownership" | "referral";
}

const copy = {
  timeline: {
    en: "Chronological Parkinson's journey — diagnosis, PADS smartwatch assessments, neurology visits, and medication changes.",
    zh: "帕金森病護理時間軸 — 診斷、PADS 智能手錶評估、神經科就診及用藥調整。",
  },
  carePlan: {
    en: "Levodopa timing, home smartwatch monitoring (11 PADS tasks), PDNMS screening, and neurology follow-up.",
    zh: "左旋多巴用藥時間、家居智能手錶監測（11 項 PADS 任務）、PDNMS 篩查及神經科跟進。",
  },
  ownership: {
    en: "Movement disorders neurologist leads motor care; caretaker supports home assessments; family doctor coordinates referrals.",
    zh: "運動障礙神經科醫生主導運動症狀護理；照顧者支援家居評估；家庭醫生統籌轉介。",
  },
  referral: {
    en: "Typical pathway: GP suspicion → movement disorders clinic → PADS home monitoring → community Parkinson's support.",
    zh: "典型路徑：家庭醫生懷疑 → 運動障礙門診 → PADS 家居監測 → 社區帕金森支援。",
  },
};

export function ParkinsonCareContextCard({ patient, locale, variant }: Props) {
  const isZh = locale === "zh";
  const text = copy[variant][locale];

  return (
    <Card className="border-cocare-200/50 bg-gradient-to-br from-cocare-50/40 to-white dark:border-cocare-800/30 dark:from-cocare-950/20 dark:to-slate-900">
      <CardContent className="p-4">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{text}</p>
        {patient.parkinsonMeta && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {isZh ? "診斷後" : "Since dx"}: {patient.parkinsonMeta.yearsSinceDiagnosis}
              {isZh ? "年" : "y"}
            </Badge>
            <Badge variant="outline">
              NMS {patient.parkinsonMeta.nmsPositive}/{patient.parkinsonMeta.nmsTotal}
            </Badge>
            {patient.padsId && (
              <Badge variant="outline">PADS {isZh ? "已連接" : "connected"}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
