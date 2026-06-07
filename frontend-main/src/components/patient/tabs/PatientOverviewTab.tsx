import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { DiseaseSummaryCard } from "@/components/dashboard/DiseaseSummaryCard";

interface Props {
  patient: Patient;
  locale: Locale;
  greetingName?: string;
}

export function PatientOverviewTab({ patient, locale, greetingName }: Props) {
  const ext = getRoleExtensions(patient.id);
  const isZh = locale === "zh";
  const displayName = greetingName ?? (isZh
    ? patient.nameZh.replace("先生", "").replace("女士", "")
    : patient.name.split(" ").pop() ?? patient.name);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-clinical border border-cocare-200/50 bg-gradient-to-r from-cocare-50/70 to-white px-3 py-2 dark:from-cocare-950/25 dark:to-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          {isZh ? `你好，${displayName}` : `Hello, ${displayName}`}
        </h2>
        <p className="text-xs text-slate-muted">
          {isZh ? "今日健康概覽" : "Today's health overview"}
        </p>
      </div>

      <DiseaseSummaryCard patient={patient} locale={locale} variant="overview" />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-3">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <CardTitle className="text-sm">{isZh ? "我的情況" : "My conditions"}</CardTitle>
          </CardHeader>
          <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-1.5 p-2">
            {ext.conditionExplainers.map((c) => (
              <div key={c.id} className="rounded-clinical bg-slate-50 p-2 dark:bg-slate-800/40">
                <p className="text-xs font-semibold text-cocare-800 dark:text-cocare-300">{lt(c.name, locale)}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                  {lt(c.simpleExplanation, locale)}
                </p>
              </div>
            ))}
          </ScrollableArea>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-rose-200/60 dark:border-rose-900/40">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <CardTitle className="text-sm text-rose-800 dark:text-rose-300">
              {isZh ? "何時要尋求協助" : "When to seek help"}
            </CardTitle>
          </CardHeader>
          <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-1.5 p-2">
            {ext.patientRedFlags.map((rf) => (
              <div key={rf.id} className="rounded-clinical border border-rose-100 bg-rose-50/30 p-2 dark:border-rose-900/30">
                <p className="text-xs font-semibold leading-snug">{lt(rf.symptom, locale)}</p>
                <p className="mt-0.5 text-[10px] text-slate-muted">{lt(rf.action, locale)}</p>
              </div>
            ))}
          </ScrollableArea>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-cocare-200/40 bg-cocare-50/20 dark:bg-cocare-950/15">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <CardTitle className="text-sm">{isZh ? "進度與提示" : "Progress & tips"}</CardTitle>
          </CardHeader>
          <ScrollableArea locale={locale} className="flex min-h-0 flex-1 flex-col p-3">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="2.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    className="stroke-cocare-600"
                    strokeWidth="2.5"
                    strokeDasharray={`${patient.adherenceScore} 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-cocare-700 dark:text-cocare-300">
                  {patient.adherenceScore}%
                </span>
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-muted">
                {isZh ? "護理依從評分" : "Care adherence score"}
              </p>
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
              {lt(ext.smokingPanel, locale)}
            </p>
          </ScrollableArea>
        </Card>
      </div>
    </div>
  );
}
