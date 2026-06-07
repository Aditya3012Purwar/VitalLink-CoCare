import { useEffect, useState } from "react";
import { Activity, Brain, CheckCircle2, Database, RefreshCw, Watch, Zap } from "lucide-react";
import { getWearableSummary } from "@/data/mock-pads-wearables";
import { checkApiHealth } from "@/lib/api";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Props {
  patient: Patient;
  locale: Locale;
  apiOnline?: boolean | null;
}

function VitalChip({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: string | number;
  unit?: string;
  status: "normal" | "elevated" | "critical";
}) {
  const color =
    status === "critical"
      ? "text-rose-600 dark:text-rose-400"
      : status === "elevated"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${color}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>}
      </p>
    </div>
  );
}

export function PadsMonitoringPanel({ patient, locale, apiOnline: apiOnlineProp }: Props) {
  const isZh = locale === "zh";
  const [apiOnlineLocal, setApiOnlineLocal] = useState<boolean | null>(null);
  const apiOnline = apiOnlineProp ?? apiOnlineLocal;
  const wearable = patient.padsId ? getWearableSummary(patient.padsId) : null;

  useEffect(() => {
    if (apiOnlineProp !== undefined) return;
    checkApiHealth().then(setApiOnlineLocal).catch(() => setApiOnlineLocal(false));
  }, [apiOnlineProp, patient.padsId]);

  if (!wearable) return null;

  const tremorStatus =
    wearable.restTremorSeverity === "high"
      ? "critical"
      : wearable.restTremorSeverity === "moderate"
        ? "elevated"
        : "normal";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-clinical bg-emerald-100 dark:bg-emerald-900/50">
                <Watch className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">PADS Smartwatch</CardTitle>
                <p className="text-xs text-slate-muted">{wearable.platform}</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {isZh ? "已同步" : "Synced"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              {isZh
                ? `${wearable.device} · ${wearable.samplingHz} Hz · ${wearable.assessmentSteps} 項居家評估`
                : `${wearable.device} · ${wearable.samplingHz} Hz · ${wearable.assessmentSteps} home assessment steps`}
            </p>
            <p className="text-xs text-slate-muted">
              {isZh ? "最後同步：" : "Last sync: "}
              {wearable.lastSync}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-clinical bg-amber-100 dark:bg-amber-900/50">
                <Database className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">{isZh ? "後端 API" : "Analysis API"}</CardTitle>
                <p className="text-xs text-slate-muted">FastAPI · PhysioNet PADS</p>
              </div>
            </div>
            <Badge variant="outline" className={apiOnline ? "text-emerald-600" : "text-amber-600"}>
              {apiOnline ? (isZh ? "在線" : "Online") : isZh ? "離線" : "Offline"}
            </Badge>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            {isZh
              ? "即時載入震顫信號、PDNMS 問卷及 ML 病情表現分析。"
              : "Live tremor signals, PDNMS questionnaire, and ML performance analysis."}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-cocare-600" />
            {isZh ? "智能手錶關鍵指標" : "Smartwatch vital metrics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <VitalChip
              label={isZh ? "靜止震顫" : "Rest tremor"}
              value={wearable.dominantTremorHz}
              unit="Hz"
              status={tremorStatus}
            />
            <VitalChip
              label={isZh ? "ML PD 概率" : "ML PD probability"}
              value={`${(wearable.mlPdProbability * 100).toFixed(0)}`}
              unit="%"
              status={wearable.mlPdProbability >= 0.85 ? "elevated" : "normal"}
            />
            <VitalChip
              label="PDNMS"
              value={`${wearable.nmsPositive}/${wearable.nmsTotal}`}
              status={wearable.nmsPositive >= 12 ? "critical" : wearable.nmsPositive >= 8 ? "elevated" : "normal"}
            />
            <VitalChip
              label={isZh ? "異常任務" : "Elevated tasks"}
              value={wearable.elevatedTasks}
              status={wearable.elevatedTasks >= 4 ? "critical" : wearable.elevatedTasks >= 2 ? "elevated" : "normal"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Brain className="h-3 w-3" />
              {isZh ? "11 項動作評估" : "11 movement tasks"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {isZh ? "雙腕加速度" : "Bilateral accelerometry"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {isZh ? "每週家居監測" : "Weekly home monitoring"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
