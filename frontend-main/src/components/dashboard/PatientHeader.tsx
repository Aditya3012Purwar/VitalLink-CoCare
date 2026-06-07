import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Calendar,
  HeartPulse,
  Pill,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface PatientHeaderProps {
  patient: Patient;
  locale: Locale;
  /** Narrow sidebar column layout (overview) */
  compact?: boolean;
  onPrescribe?: () => void;
  onAskAi?: () => void;
  aiAssistantActive?: boolean;
}

export function PatientHeader({ patient, locale, compact, onPrescribe, onAskAi, aiAssistantActive }: PatientHeaderProps) {
  const riskVariant =
    patient.riskTier === "high"
      ? "risk-high"
      : patient.riskTier === "moderate"
        ? "risk-moderate"
        : "risk-stable";

  const followUpColor =
    patient.followUpStatus === "overdue"
      ? "text-rose-600 dark:text-rose-400"
      : patient.followUpStatus === "due_soon"
        ? "text-amber-600 dark:text-amber-400"
        : "text-cocare-600 dark:text-cocare-400";

  const sexLabel = patient.sex === "M" ? (locale === "zh" ? "男" : "Male") : locale === "zh" ? "女" : "Female";

  if (compact) {
    return (
      <Card glass className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-clinical bg-cocare-100 dark:bg-cocare-900/50">
              <User className="h-5 w-5 text-cocare-700 dark:text-cocare-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base font-semibold leading-tight text-slate-900 dark:text-white">
                {locale === "zh" ? patient.nameZh : patient.name}
              </h1>
              <p className="text-xs text-slate-muted dark:text-slate-400">
                {patient.age}y · {sexLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={riskVariant}>
              {t(ui.riskTier, locale)}: {patient.riskTier}
            </Badge>
            {(locale === "zh" ? patient.conditionsZh : patient.conditions).slice(0, 3).map((c) => (
              <Badge key={c} variant="outline" className="text-[10px]">
                {c}
              </Badge>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-muted">{locale === "zh" ? "依從性" : "Adherence"}</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{patient.adherenceScore}%</dd>
            </div>
            <div>
              <dt className="text-slate-muted">{locale === "zh" ? "跟進" : "Follow-up"}</dt>
              <dd className={`font-semibold capitalize ${followUpColor}`}>
                {patient.followUpStatus.replace("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-muted">{locale === "zh" ? "出院後" : "Since discharge"}</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {patient.kpis.daysSinceDischarge}d
              </dd>
            </div>
            {patient.parkinsonMeta && (
              <div>
                <dt className="text-slate-muted">{locale === "zh" ? "診斷後" : "Since dx"}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {patient.parkinsonMeta.yearsSinceDiagnosis}{locale === "zh" ? "年" : "y"}
                </dd>
              </div>
            )}
          </dl>
          {patient.padsId && (onPrescribe || onAskAi) && (
            <div className="flex justify-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
              {onPrescribe && (
                <Button size="sm" onClick={onPrescribe} className="gap-1.5">
                  <Pill className="h-3.5 w-3.5" />
                  {locale === "zh" ? "開處方" : "Prescribe"}
                </Button>
              )}
              {onAskAi && (
                <Button
                  size="sm"
                  variant={aiAssistantActive ? "primary" : "outline"}
                  onClick={onAskAi}
                  className="gap-1.5"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {aiAssistantActive
                    ? locale === "zh" ? "返回分析" : "Back"
                    : locale === "zh" ? "AI 助手" : "AI assistant"}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card glass className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-clinical bg-cocare-100 dark:bg-cocare-900/50">
            <User className="h-7 w-7 text-cocare-700 dark:text-cocare-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white md:text-2xl">
                {locale === "zh" ? patient.nameZh : patient.name}
              </h1>
              <Badge variant={riskVariant}>
                {t(ui.riskTier, locale)}: {patient.riskTier}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
              {patient.age}y · {sexLabel}
              {patient.parkinsonMeta && (
                <>
                  {" · "}
                  {locale === "zh" ? "診斷後" : "Dx"}: {patient.parkinsonMeta.yearsSinceDiagnosis}
                  {locale === "zh" ? "年" : "y"}
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(locale === "zh" ? patient.conditionsZh : patient.conditions).map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 lg:justify-end">
          <StatPill
            icon={HeartPulse}
            label={locale === "zh" ? "依從性" : "Adherence"}
            value={`${patient.adherenceScore}%`}
          />
          <StatPill
            icon={Calendar}
            label={locale === "zh" ? "跟進狀態" : "Follow-up"}
            value={patient.followUpStatus.replace("_", " ")}
            valueClass={followUpColor}
          />
          <StatPill
            icon={AlertTriangle}
            label={locale === "zh" ? "出院後天數" : "Days since discharge"}
            value={String(patient.kpis.daysSinceDischarge)}
          />
        </div>
      </div>
    </Card>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-clinical border border-slate-200/80 bg-white/60 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cocare-600 dark:text-cocare-400" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-muted dark:text-slate-500">
            {label}
          </p>
          <p className={`font-display text-lg font-semibold capitalize ${valueClass ?? "text-slate-900 dark:text-white"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface KpiCardsProps {
  patient: Patient;
  locale: Locale;
}

export function KpiCards({ patient, locale }: KpiCardsProps) {
  const kpis = [
    {
      label: locale === "zh" ? "入院次數 (12個月)" : "Admissions (12mo)",
      value: patient.kpis.admissions12mo,
      accent: patient.kpis.admissions12mo > 0 ? "text-rose-600" : "text-cocare-700",
    },
    {
      label: locale === "zh" ? "待辦事項" : "Open tasks",
      value: patient.kpis.openTasks,
      accent: "text-amber-600",
    },
    {
      label: locale === "zh" ? "今日紅旗警報" : "Red flags today",
      value: patient.kpis.redFlags,
      accent: patient.kpis.redFlags > 0 ? "text-rose-600" : "text-cocare-700",
    },
    {
      label: locale === "zh" ? "依從評分" : "Adherence score",
      value: `${patient.adherenceScore}%`,
      accent: patient.adherenceScore < 65 ? "text-amber-600" : "text-cocare-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card className="p-4">
            <p className="text-xs text-slate-muted dark:text-slate-400">{k.label}</p>
            <p className={`mt-1 font-display text-2xl font-semibold ${k.accent} dark:opacity-90`}>
              {k.value}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
