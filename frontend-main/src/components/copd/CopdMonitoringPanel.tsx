import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  Cloud,
  Droplets,
  Moon,
  Stethoscope,
  Wind,
} from "lucide-react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { getCopdVitals } from "@/lib/api";
import type { Locale } from "@/types/patient";
import type { CopdVitals } from "@/types/copd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function hasCopdComorbidity(patient: { padsId?: string; conditions?: string[] }): boolean {
  if (patient.padsId === "004") return true;
  return (patient.conditions ?? []).some((c) => /copd/i.test(c));
}

function useCopdVitals(padsId: string | undefined) {
  const [vitals, setVitals] = useState<CopdVitals | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!padsId) return;
    setLoading(true);
    getCopdVitals(padsId)
      .then(setVitals)
      .catch(() => setVitals(null))
      .finally(() => setLoading(false));
  }, [padsId]);

  return { vitals, loading };
}

function spo2Status(spo2: number): "ok" | "warn" | "critical" {
  if (spo2 < 90) return "critical";
  if (spo2 < 92) return "warn";
  return "ok";
}

function statusAccent(status: "ok" | "warn" | "critical") {
  return status === "critical" ? "text-rose-600" : status === "warn" ? "text-amber-600" : "text-cocare-700";
}

function SummaryMetric({
  icon,
  label,
  value,
  unit,
  accent,
  compact = false,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-clinical border border-sky-200/60 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-center gap-1 text-slate-muted">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">{label}</span>
      </div>
      <p className={cn("font-display font-semibold", compact ? "mt-0.5 text-base" : "mt-1 text-xl", accent)}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-slate-muted">{unit}</span>}
      </p>
    </div>
  );
}

/** Basic COPD vitals for Disease Summary — shown to all roles */
export function CopdSummaryMetrics({
  padsId,
  locale,
  compact = false,
}: {
  padsId: string;
  locale: Locale;
  compact?: boolean;
}) {
  const { vitals, loading } = useCopdVitals(padsId);
  const isZh = locale === "zh";

  if (loading) {
    return (
      <p className="text-xs text-slate-muted">
        {isZh ? "載入慢阻肺摘要…" : "Loading COPD summary…"}
      </p>
    );
  }

  if (!vitals) return null;

  const s = vitals.summary;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Wind className={compact ? "h-3.5 w-3.5 text-sky-600" : "h-4 w-4 text-sky-600"} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">
          {isZh ? "慢阻肺" : "COPD"}
        </p>
        {!compact && (
          <Badge variant="outline" className="text-[10px]">
            <Cloud className="mr-1 h-3 w-3" />
            {vitals.ehealth_platform}
          </Badge>
        )}
      </div>
      <div className={cn("grid grid-cols-2 sm:grid-cols-4", compact ? "gap-1.5" : "gap-2")}>
        <SummaryMetric
          icon={<Droplets className="h-3 w-3" />}
          label={isZh ? "平均血氧" : "Avg oxygen"}
          value={`${s.spo2_avg_pct}`}
          unit="%"
          accent={statusAccent(spo2Status(s.spo2_avg_pct))}
          compact={compact}
        />
        <SummaryMetric
          icon={<Moon className="h-3 w-3" />}
          label={isZh ? "睡眠效率" : "Sleep efficiency"}
          value={`${s.sleep_efficiency_pct}`}
          unit="%"
          accent={statusAccent(s.sleep_efficiency_pct < 70 ? "warn" : "ok")}
          compact={compact}
        />
        <SummaryMetric
          icon={<Activity className="h-3 w-3" />}
          label={isZh ? "呼吸頻率" : "Respiratory rate"}
          value={`${s.respiratory_rate_avg}`}
          unit="/min"
          accent={statusAccent(s.respiratory_rate_avg > 20 ? "warn" : "ok")}
          compact={compact}
        />
        <SummaryMetric
          icon={<Stethoscope className="h-3 w-3" />}
          label={isZh ? "峰流速" : "Peak flow"}
          value={`${s.pef_l_min}`}
          unit="L/min"
          accent={statusAccent(s.pef_predicted_pct < 60 ? "warn" : "ok")}
          compact={compact}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  status?: "ok" | "warn" | "critical";
  detail?: string;
}) {
  const statusClass =
    status === "critical"
      ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/40"
      : status === "warn"
        ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40"
        : "border-slate-200 dark:border-slate-700";

  return (
    <div className={`rounded-clinical border p-4 ${statusClass}`}>
      <div className="flex items-center gap-2 text-slate-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-muted">{unit}</span>}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-muted">{detail}</p>}
    </div>
  );
}

function TrendChart({
  title,
  data,
  unit,
  target,
  color,
  locale,
}: {
  title: string;
  data: { date: string; value: number }[];
  unit: string;
  target?: number;
  color: string;
  locale: Locale;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <div className="mt-2 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                stroke="#94a3b8"
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" width={28} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }}
                formatter={(v: number) => [`${v} ${unit}`, locale === "zh" ? "數值" : "Value"]}
              />
              {target !== undefined && (
                <ReferenceLine
                  y={target}
                  stroke="#2f9488"
                  strokeDasharray="4 4"
                  label={{ value: locale === "zh" ? "目標" : "Target", fontSize: 9, fill: "#2f9488" }}
                />
              )}
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const riskColors = {
  low: "risk-stable" as const,
  moderate: "risk-moderate" as const,
  high: "risk-high" as const,
};

/** Full COPD report — Detailed Report section, after Parkinson charts */
export function CopdDetailedReport({
  padsId,
  locale,
}: {
  padsId: string;
  locale: Locale;
}) {
  const { vitals, loading } = useCopdVitals(padsId);
  const isZh = locale === "zh";

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-muted">
          {isZh ? "載入慢阻肺詳細報告…" : "Loading COPD detailed report…"}
        </CardContent>
      </Card>
    );
  }

  if (!vitals) return null;

  const s = vitals.summary;
  const sleep = vitals.sleep_disorder;
  const spo2Stat = spo2Status(s.spo2_avg_pct);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Wind}
        title={isZh ? "慢阻肺詳細報告" : "COPD detailed report"}
        description={
          isZh
            ? "電子健康平台數據 — 血氧趨勢、睡眠障礙分析、呼吸參數及臨床推理（帕金森圖表之後）"
            : "E-health platform data — oxygen trends, sleep disorder analysis, respiratory parameters, and clinical reasoning (after Parkinson charts)"
        }
        badge={
          <Badge variant="outline" className="text-sky-700 dark:text-sky-400">
            <Cloud className="mr-1 h-3 w-3" />
            {vitals.ehealth_platform}
          </Badge>
        }
      />

      <Card className="border-l-4 border-l-sky-500">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {isZh ? "關鍵指標（14日）" : "Key metrics (14-day)"}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={riskColors[s.exacerbation_risk]}>
                {isZh ? "惡化風險" : "Exacerbation"}: {s.exacerbation_risk}
              </Badge>
              <Badge variant="outline">{s.gold_stage}</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-muted">
            {isZh ? "最後同步" : "Last sync"}: {vitals.last_sync} · {vitals.respiratory_specialist}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Droplets}
              label={isZh ? "平均血氧 (SpO₂)" : "Avg oxygen (SpO₂)"}
              value={s.spo2_avg_pct}
              unit="%"
              status={spo2Stat}
              detail={
                isZh
                  ? `目標 ≥${s.spo2_target_pct}% · 夜間低氧 ${s.nocturnal_desat_events} 次`
                  : `Target ≥${s.spo2_target_pct}% · ${s.nocturnal_desat_events} nocturnal dips`
              }
            />
            <MetricCard
              icon={Moon}
              label={isZh ? "睡眠效率" : "Sleep efficiency"}
              value={s.sleep_efficiency_pct}
              unit="%"
              status={s.sleep_efficiency_pct < 70 ? "warn" : "ok"}
              detail={
                isZh
                  ? `平均 ${sleep.avg_sleep_hours}h · AHI ${s.sleep_disorder_index}`
                  : `Avg ${sleep.avg_sleep_hours}h · AHI ${s.sleep_disorder_index}`
              }
            />
            <MetricCard
              icon={Activity}
              label={isZh ? "呼吸頻率" : "Respiratory rate"}
              value={s.respiratory_rate_avg}
              unit="/min"
              status={s.respiratory_rate_avg > 20 ? "warn" : "ok"}
            />
            <MetricCard
              icon={Stethoscope}
              label={isZh ? "峰流速 (PEF)" : "Peak flow (PEF)"}
              value={s.pef_l_min}
              unit="L/min"
              status={s.pef_predicted_pct < 60 ? "warn" : "ok"}
              detail={`${s.pef_predicted_pct}% ${isZh ? "預測值" : "predicted"}`}
            />
          </div>

          <div className="rounded-clinical border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              {isZh ? "睡眠障礙詳情" : "Sleep disorder detail"}
            </p>
            <p className="mt-1 font-medium text-sm">{sleep.diagnosis}</p>
            <p className="mt-1 text-xs text-slate-muted">{s.sleep_disorder_label}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isZh
                ? `嚴重度：${sleep.severity} · 深睡 ${sleep.deep_sleep_pct}% · REM ${sleep.rem_sleep_pct}% · 醒後再入睡 ${sleep.wake_after_sleep_onset_min} 分鐘 · 打鼾指數 ${sleep.snoring_index}`
                : `Severity: ${sleep.severity} · Deep sleep ${sleep.deep_sleep_pct}% · REM ${sleep.rem_sleep_pct}% · WASO ${sleep.wake_after_sleep_onset_min} min · Snoring index ${sleep.snoring_index}`}
            </p>
            <p className="mt-2 text-xs text-slate-muted italic">{sleep.notes}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900 dark:text-white">
              {isZh ? "趨勢圖表" : "Trend charts"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TrendChart
                title={isZh ? "14日血氧趨勢" : "14-day SpO₂ trend"}
                data={vitals.trends.spo2}
                unit="%"
                target={s.spo2_target_pct}
                color={spo2Stat === "critical" ? "#e11d48" : "#0ea5e9"}
                locale={locale}
              />
              <TrendChart
                title={isZh ? "夜間最低血氧" : "Nighttime SpO₂ (lowest)"}
                data={vitals.trends.nighttime_spo2}
                unit="%"
                target={88}
                color="#6366f1"
                locale={locale}
              />
              <TrendChart
                title={isZh ? "睡眠時數" : "Sleep hours"}
                data={vitals.trends.sleep_hours}
                unit="h"
                target={7}
                color="#8b5cf6"
                locale={locale}
              />
              <TrendChart
                title={isZh ? "呼吸頻率" : "Respiratory rate"}
                data={vitals.trends.respiratory_rate}
                unit="/min"
                color="#14b8a6"
                locale={locale}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-clinical border p-3 text-sm">
              <p className="text-xs text-slate-muted">{isZh ? "每週咳嗽" : "Cough / week"}</p>
              <p className="font-semibold">{s.cough_episodes_week}</p>
            </div>
            <div className="rounded-clinical border p-3 text-sm">
              <p className="text-xs text-slate-muted">{isZh ? "夜間低氧事件" : "Nocturnal desaturation"}</p>
              <p className="font-semibold">{s.nocturnal_desat_events}</p>
            </div>
            <div className="rounded-clinical border p-3 text-sm">
              <p className="text-xs text-slate-muted">{isZh ? "平均睡眠" : "Avg sleep"}</p>
              <p className="font-semibold">{sleep.avg_sleep_hours}h</p>
            </div>
          </div>

          <div className="rounded-clinical border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
              {isZh ? "臨床推理（可穿戴 + 電子健康 + 問卷融合）" : "Clinical reasoning (wearable + e-health + questionnaire fusion)"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {vitals.clinical_reasoning}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
