import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Cloud,
  TrendingDown,
  TrendingUp,
  MessageCircle,
  User,
  Watch,
} from "lucide-react";
import { getPerformanceAnalysis } from "@/lib/api";
import type { Locale } from "@/types/patient";
import type { PerformanceAlert, PerformanceAnalysis } from "@/types/parkinson";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { Badge } from "@/components/ui/Badge";

interface Props {
  padsId: string;
  locale: Locale;
  layout?: "full" | "overview" | "details";
}

const statusColors = {
  stable: "risk-stable" as const,
  moderate: "risk-moderate" as const,
  declining: "risk-high" as const,
};

function formatAlertTime(timestamp: string, locale: Locale) {
  return new Date(timestamp).toLocaleString(locale === "zh" ? "zh-HK" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SourceTag({ source, locale }: { source: PerformanceAlert["source"]; locale: Locale }) {
  const isWearable = source === "wearable";
  const isVoiceChat = source === "voice_chat";
  const isEHealth = source === "e_health";
  const Icon = isWearable ? Watch : isVoiceChat ? MessageCircle : isEHealth ? Cloud : User;
  const label = isWearable
    ? locale === "zh" ? "可穿戴設備" : "Wearable"
    : isVoiceChat
      ? locale === "zh" ? "健康對話" : "Health Chat"
      : isEHealth
        ? locale === "zh" ? "電子健康平台" : "E-health"
        : locale === "zh" ? "人工回報" : "Human";

  const tone = isWearable
    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
    : isVoiceChat
      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
      : isEHealth
        ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function DoctorPerformancePanel({ padsId, locale, layout = "full" }: Props) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOverview = layout === "overview";
  const scrollable = isOverview || layout === "details";

  useEffect(() => {
    setLoading(true);
    getPerformanceAnalysis(padsId)
      .then(setAnalysis)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [padsId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-muted">
          {locale === "zh" ? "載入病情表現分析…" : "Loading disease performance analysis…"}
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return null;
  }

  const { performance } = analysis;
  const alerts = analysis.alerts ?? analysis.what_happened;
  const TrendIcon = performance.overall_status === "declining" ? TrendingDown : TrendingUp;

  const summaryCard = (
    <Card glass className="border-l-4 border-l-indigo-500">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            <h2 className="font-display text-lg font-semibold">
              {locale === "zh" ? "病情表現摘要" : "Disease performance summary"}
            </h2>
          </div>
          <Badge variant={statusColors[performance.overall_status]}>{performance.overall_status}</Badge>
        </div>
        <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">{analysis.executive_summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ScoreCard
            label={locale === "zh" ? "運動表現" : "Motor score"}
            value={performance.motor_score}
            icon={<Activity className="h-4 w-4" />}
          />
          <ScoreCard
            label={locale === "zh" ? "非運動症狀" : "NMS score"}
            value={performance.nms_score}
            icon={<Brain className="h-4 w-4" />}
          />
          <div className="rounded-clinical border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-slate-muted">
              <TrendIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase">
                {locale === "zh" ? "整體趨勢" : "Overall trend"}
              </span>
            </div>
            <p className="mt-1 font-display text-2xl font-semibold capitalize">{performance.overall_status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const alertList = alerts.map((item, i) => (
    <motion.div
      key={`${item.timestamp}-${i}`}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`rounded-clinical border p-3 ${
        item.red_flag
          ? "border-rose-300/70 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/25"
          : "border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-sm text-slate-900 dark:text-white">{item.event}</p>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {item.red_flag && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              {locale === "zh" ? "紅旗" : "Red flag"}
            </span>
          )}
          <SourceTag source={item.source} locale={locale} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-muted dark:text-slate-400">
        <Clock className="h-3 w-3 shrink-0" />
        <time dateTime={item.timestamp}>{formatAlertTime(item.timestamp, locale)}</time>
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>

      {(item.reason || item.clinical_relevance) && (
        <div className="mt-3 rounded-lg border-l-4 border-cocare-300 bg-white/60 p-2.5 dark:border-cocare-700 dark:bg-slate-900/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cocare-700 dark:text-cocare-400">
            {locale === "zh" ? "原因" : "Reason"}
          </p>
          {item.reason && (
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.reason}</p>
          )}
          {item.clinical_relevance && (
            <p className="mt-2 text-xs font-medium text-cocare-700 dark:text-cocare-400">
              → {item.clinical_relevance}
            </p>
          )}
        </div>
      )}
    </motion.div>
  ));

  const alertsCard = (
    <Card className={scrollable ? "flex h-full min-h-0 flex-col" : undefined}>
      <CardHeader className={scrollable ? "shrink-0 py-3 md:py-3.5" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {locale === "zh" ? "警報" : "Alerts"}
        </CardTitle>
      </CardHeader>
      {scrollable ? (
        <ScrollableArea
          locale={locale}
          className="min-h-0 flex-1 space-y-2.5 px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-2.5"
        >
          {alertList}
        </ScrollableArea>
      ) : (
        <CardContent className="space-y-3">{alertList}</CardContent>
      )}
    </Card>
  );

  if (isOverview) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="shrink-0">{summaryCard}</div>
        <div className="min-h-0 flex-1">{alertsCard}</div>
      </div>
    );
  }

  if (layout === "details") {
    return <div className="flex h-full min-h-0 flex-col">{alertsCard}</div>;
  }

  return (
    <div className="space-y-4">
      {summaryCard}
      {alertsCard}
    </div>
  );
}

function ScoreCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 75 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="rounded-clinical border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex items-center gap-2 text-slate-muted">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <p className={`mt-1 font-display text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
