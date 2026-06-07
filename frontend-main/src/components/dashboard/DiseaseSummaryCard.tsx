import { useEffect, useState } from "react";
import { Activity, Brain, HeartPulse } from "lucide-react";
import { CopdSummaryMetrics, hasCopdComorbidity } from "@/components/copd/CopdMonitoringPanel";
import { getPerformanceAnalysis } from "@/lib/api";
import type { Locale, Patient } from "@/types/patient";
import type { PerformanceAnalysis } from "@/types/parkinson";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Props {
  patient: Patient;
  locale: Locale;
  /** Tighter spacing for doctor overview — aligns with alerts panel below */
  variant?: "default" | "overview";
}

const statusVariant = {
  stable: "risk-stable" as const,
  moderate: "risk-moderate" as const,
  declining: "risk-high" as const,
};

export function DiseaseSummaryCard({ patient, locale, variant = "default" }: Props) {
  const isOverview = variant === "overview";
  const isZh = locale === "zh";
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(!!patient.padsId);

  useEffect(() => {
    if (!patient.padsId) return;
    setLoading(true);
    getPerformanceAnalysis(patient.padsId)
      .then(setAnalysis)
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [patient.padsId]);

  const summaryText = analysis?.executive_summary
    ?? (isZh ? patient.aiSummaryZh : patient.aiSummary);

  const overallStatus = analysis?.performance.overall_status ?? patient.riskTier;

  return (
    <Card className={isOverview ? "shrink-0" : undefined}>
      <CardHeader
        className={cn(
          "flex flex-row flex-wrap items-center justify-between gap-2",
          isOverview && "border-b py-2 px-4 md:px-4"
        )}
      >
        <CardTitle className={isOverview ? "text-sm font-semibold" : undefined}>
          {isZh ? "病情概覽" : "Disease summary"}
        </CardTitle>
        {analysis && (
          <Badge variant={statusVariant[analysis.performance.overall_status]}>
            {analysis.performance.overall_status}
          </Badge>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          isOverview
            ? "space-y-2 px-4 pb-2.5 pt-2 md:px-4"
            : "space-y-4"
        )}
      >
        {loading ? (
          <p className={cn("text-slate-muted", isOverview ? "text-xs" : "text-sm")}>
            {isZh ? "載入病情摘要…" : "Loading disease summary…"}
          </p>
        ) : (
          <p
            className={cn(
              "text-slate-700 dark:text-slate-300",
              isOverview ? "text-xs leading-snug" : "text-sm leading-relaxed"
            )}
          >
            {summaryText}
          </p>
        )}

        <div className={cn("grid grid-cols-2 sm:grid-cols-4", isOverview ? "gap-1.5" : "gap-2.5")}>
          {analysis ? (
            <>
              <MetricChip
                icon={<Activity className="h-3.5 w-3.5" />}
                label={isZh ? "運動表現" : "Motor score"}
                value={String(analysis.performance.motor_score)}
                accent={scoreColor(analysis.performance.motor_score)}
                compact={isOverview}
              />
              <MetricChip
                icon={<Brain className="h-3.5 w-3.5" />}
                label={isZh ? "非運動症狀" : "NMS score"}
                value={String(analysis.performance.nms_score)}
                accent={scoreColor(analysis.performance.nms_score, true)}
                compact={isOverview}
              />
            </>
          ) : (
            <>
              <MetricChip
                icon={<Activity className="h-3.5 w-3.5" />}
                label={isZh ? "風險等級" : "Risk tier"}
                value={overallStatus}
                accent="text-slate-900 dark:text-white capitalize"
                compact={isOverview}
              />
              {patient.parkinsonMeta && (
                <MetricChip
                  icon={<Brain className="h-3.5 w-3.5" />}
                  label="PDNMS"
                  value={`${patient.parkinsonMeta.nmsPositive}/${patient.parkinsonMeta.nmsTotal}`}
                  accent={
                    patient.parkinsonMeta.nmsPositive >= 12
                      ? "text-rose-600"
                      : "text-amber-600"
                  }
                  compact={isOverview}
                />
              )}
            </>
          )}
          <MetricChip
            icon={<HeartPulse className="h-3.5 w-3.5" />}
            label={isZh ? "依從評分" : "Adherence"}
            value={`${patient.adherenceScore}%`}
            accent={patient.adherenceScore < 65 ? "text-amber-600" : "text-cocare-700"}
            compact={isOverview}
          />
          <MetricChip
            label={isZh ? "今日紅旗" : "Red flags today"}
            value={String(patient.kpis.redFlags)}
            accent={patient.kpis.redFlags > 0 ? "text-rose-600" : "text-cocare-700"}
            compact={isOverview}
          />
        </div>

        {patient.padsId && hasCopdComorbidity(patient) && (
          <div
            className={cn(
              "border-t border-slate-200/80 dark:border-slate-700",
              isOverview ? "pt-2" : "pt-4"
            )}
          >
            <CopdSummaryMetrics padsId={patient.padsId} locale={locale} compact={isOverview} />
            {!isOverview && (
              <p className="mt-2 text-[11px] leading-snug text-slate-muted">
                {isZh
                  ? "完整慢阻肺趨勢圖、睡眠障礙分析及臨床推理請見「詳細報告」章節（帕金森圖表之後）。"
                  : "Full COPD trends, sleep disorder analysis, and clinical reasoning are in Detailed report (after Parkinson charts)."}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex flex-wrap border-t border-slate-100 dark:border-slate-800",
            isOverview ? "gap-1 pt-1.5" : "gap-1.5 pt-3"
          )}
        >
          {(isZh ? patient.conditionsZh : patient.conditions).map((c) => (
            <Badge key={c} variant="outline" className={isOverview ? "px-1.5 py-0 text-[10px]" : undefined}>
              {c}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function scoreColor(value: number, inverted = false) {
  if (inverted) {
    return value >= 75 ? "text-rose-600" : value >= 50 ? "text-amber-600" : "text-emerald-600";
  }
  return value >= 75 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-rose-600";
}

function MetricChip({
  icon,
  label,
  value,
  accent,
  compact = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-clinical border border-slate-200/80 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-center gap-1 text-slate-muted">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">{label}</span>
      </div>
      <p className={cn("font-display font-semibold", compact ? "mt-0.5 text-base" : "mt-1 text-xl", accent)}>
        {value}
      </p>
    </div>
  );
}
