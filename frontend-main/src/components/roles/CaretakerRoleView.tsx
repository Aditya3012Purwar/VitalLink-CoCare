import { CheckCircle2, Circle, Heart, Users } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DiseaseSummaryCard } from "@/components/dashboard/DiseaseSummaryCard";
import { SmartwatchDashboard } from "@/components/parkinson/SmartwatchDashboard";
import { ParkinsonAiInsight } from "@/components/parkinson/ParkinsonAiInsight";

interface Props {
  patient: Patient;
  locale: Locale;
}

export function CaretakerRoleView({ patient, locale }: Props) {
  const ext = getRoleExtensions(patient.id);

  return (
    <div className="space-y-6">
      <div className="rounded-clinical border border-amber-200/60 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="font-display text-xl font-semibold text-amber-900 dark:text-amber-200">
          {locale === "zh" ? "照顧者儀表板" : "Caretaker dashboard"}
        </h2>
        <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-300/80">
          {locale === "zh"
            ? "簡化視圖 — 家居智能手錶監測、護理任務及何時聯絡醫生。"
            : "Simplified view — home smartwatch monitoring, care tasks, and when to contact the doctor."}
        </p>
        <p className="mt-1 text-xs text-slate-muted">{patient.dhcCluster}</p>
      </div>

      <DiseaseSummaryCard patient={patient} locale={locale} />

      {patient.padsId && (
        <>
          <ParkinsonAiInsight padsId={patient.padsId} locale={locale} audience="caretaker" />
          <SmartwatchDashboard patient={patient} locale={locale} audience="caretaker" />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{locale === "zh" ? "今日護理任務" : "Today's care tasks"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ext.checklist.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 rounded-clinical border p-4 ${
                item.done
                  ? "border-cocare-200 bg-cocare-50/50"
                  : item.priority === "high"
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200"
              }`}
            >
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-cocare-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 text-slate-400" />
              )}
              <span className="text-sm font-medium">{lt(item.label, locale)}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-200/60">
        <CardHeader>
          <CardTitle className="text-rose-800 dark:text-rose-300">
            {locale === "zh" ? "何時聯絡醫生" : "When to contact the doctor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {ext.patientRedFlags.slice(0, 4).map((rf) => (
            <div key={rf.id} className="rounded-clinical border border-rose-100 bg-rose-50/30 p-3 dark:border-rose-900/30">
              <p className="font-medium text-sm">{lt(rf.symptom, locale)}</p>
              <p className="mt-1 text-xs text-slate-muted">{lt(rf.action, locale)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cocare-600" />
            <CardTitle>{locale === "zh" ? "護理團隊" : "Care team"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 rounded-clinical border p-3 dark:border-slate-700">
            <Heart className="h-4 w-4 text-cocare-600" />
            <div>
              <p className="font-medium text-sm">{patient.familyDoctor}</p>
              <p className="text-xs text-slate-muted">{locale === "zh" ? "神經科醫生" : "Neurologist"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
