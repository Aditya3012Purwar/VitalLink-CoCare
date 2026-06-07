import { AlertTriangle } from "lucide-react";
import type { Locale, Patient } from "@/types/patient";
import { formatDate } from "@/lib/utils";

interface AlertBannerProps {
  patient: Patient;
  locale: Locale;
}

export function AlertBanner({ patient, locale }: AlertBannerProps) {
  const urgent = patient.alerts.filter((a) => a.urgency === "today");
  if (urgent.length === 0) return null;

  const top = urgent[0];
  return (
    <div className="flex items-start gap-3 rounded-clinical border border-rose-200 bg-rose-50/90 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/40">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
          {locale === "zh" ? "高風險警報" : "High-risk alert"}
          {urgent.length > 1 && ` · ${urgent.length}`}
        </p>
        <p className="mt-0.5 text-sm text-rose-800/90 dark:text-rose-300/90">
          {locale === "zh" ? top.titleZh : top.title} — {locale === "zh" ? top.detailZh : top.detail}
        </p>
      </div>
    </div>
  );
}

interface SummaryStripProps {
  patient: Patient;
  locale: Locale;
  lastReview: string;
  nextAppointment: string;
}

export function SummaryStrip({ patient, locale, lastReview, nextAppointment }: SummaryStripProps) {
  const items = [
    {
      label: locale === "zh" ? "最近入院" : "Last admission",
      value: formatDate(patient.lastAdmission, locale),
    },
    {
      label: locale === "zh" ? "最近覆診" : "Last review",
      value: formatDate(lastReview, locale),
    },
    {
      label: locale === "zh" ? "下次預約" : "Next appointment",
      value: formatDate(nextAppointment, locale),
    },
    {
      label: locale === "zh" ? "風險分層" : "Risk tier",
      value: patient.riskTier,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40"
        >
          <p className="text-[10px] uppercase tracking-wide text-slate-muted">{item.label}</p>
          <p className="font-display text-sm font-semibold capitalize text-slate-900 dark:text-white">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

interface TimelineStripProps {
  patient: Patient;
  locale: Locale;
}

export function TimelineStrip({ patient, locale }: TimelineStripProps) {
  const recent = [...patient.timeline]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {recent.map((ev) => (
        <div
          key={ev.id}
          className="shrink-0 rounded-lg border border-slate-200/60 bg-white/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40"
        >
          <p className="text-[10px] text-slate-muted">{formatDate(ev.date, locale)}</p>
          <p className="max-w-[140px] truncate text-xs font-medium text-slate-800 dark:text-slate-200">
            {locale === "zh" ? ev.titleZh : ev.title}
          </p>
        </div>
      ))}
    </div>
  );
}
