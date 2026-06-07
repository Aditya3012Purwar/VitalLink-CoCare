import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { checkApiHealth } from "@/lib/api";
import type { Locale, Patient } from "@/types/patient";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { CopdDetailedReport, hasCopdComorbidity } from "@/components/copd/CopdMonitoringPanel";
import { PadsMonitoringPanel } from "@/components/parkinson/PadsMonitoringPanel";
import { SmartwatchDashboard } from "@/components/parkinson/SmartwatchDashboard";
import { DoctorPerformancePanel } from "@/components/parkinson/DoctorPerformancePanel";

interface Props {
  patient: Patient;
  locale: Locale;
}

export function DetailedReportSection({ patient, locale }: Props) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const isZh = locale === "zh";

  useEffect(() => {
    if (!patient.padsId) return;
    checkApiHealth().then(setApiOnline).catch(() => setApiOnline(false));
  }, [patient.padsId]);

  if (!patient.padsId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={BarChart3}
          title={isZh ? "詳細報告" : "Detailed report"}
          description={
            isZh
              ? "PADS 智能手錶信號、圖表及臨床分析詳情"
              : "PADS smartwatch signals, charts, and full clinical analysis"
          }
        />
        <p className="rounded-clinical border border-slate-200 bg-white p-6 text-sm text-slate-muted dark:border-slate-700 dark:bg-slate-900">
          {isZh ? "此患者未連接 PADS 智能手錶數據。" : "No PADS smartwatch data linked for this patient."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={BarChart3}
        title={isZh ? "詳細報告" : "Detailed report"}
        description={
          isZh
            ? "帕金森：PADS 原始信號、震顫頻譜、非運動症狀圖表及病情表現分析；慢阻肺詳報見下方"
            : "Parkinson's: PADS raw signals, tremor spectra, NMS charts, and performance analysis; COPD full report below"
        }
        badge={
          <Badge variant="outline" className="text-cocare-700 dark:text-cocare-400">
            PADS {patient.padsId}
          </Badge>
        }
      />

      <PadsMonitoringPanel patient={patient} locale={locale} apiOnline={apiOnline} />

      <DoctorPerformancePanel padsId={patient.padsId} locale={locale} layout="full" />

      <SmartwatchDashboard patient={patient} locale={locale} audience="doctor" variant="chartsOnly" />

      {hasCopdComorbidity(patient) && patient.padsId && (
        <CopdDetailedReport padsId={patient.padsId} locale={locale} />
      )}
    </div>
  );
}
