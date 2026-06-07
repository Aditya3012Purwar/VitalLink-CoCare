import { motion } from "framer-motion";
import { AlertTriangle, ClipboardCheck, Pill, Shield } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RoleViewProps {
  patient: Patient;
  locale: Locale;
}

const sourceColors = {
  family_doctor: "bg-cocare-100 text-cocare-800 dark:bg-cocare-900/40",
  specialist: "bg-sky-100 text-sky-800 dark:bg-sky-900/40",
  hospital: "bg-rose-100 text-rose-800 dark:bg-rose-900/40",
  unclear: "bg-amber-100 text-amber-800 dark:bg-amber-900/40",
};

const severityBorder = {
  high: "border-l-rose-500",
  medium: "border-l-amber-500",
  low: "border-l-cocare-500",
};

export function PharmacistRoleView({ patient, locale }: RoleViewProps) {
  const ext = getRoleExtensions(patient.id);

  return (
    <div className="space-y-6">
      <div className="rounded-clinical border border-violet-200/60 bg-violet-50/30 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-violet-700 dark:text-violet-400" />
          <p className="font-display text-lg font-semibold text-violet-900 dark:text-violet-200">
            {locale === "zh" ? "社區藥房 · 用藥安全工作站" : "Community pharmacy · Medication safety desk"}
          </p>
        </div>
        <p className="mt-2 text-sm text-violet-800/80 dark:text-violet-300/80">
          {lt(ext.adherenceNotes, locale)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cocare-600" />
            <CardTitle>{locale === "zh" ? "用藥核對" : "Medication reconciliation"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-muted">
                <th className="pb-2 pr-4">{locale === "zh" ? "藥物" : "Medication"}</th>
                <th className="pb-2 pr-4">{locale === "zh" ? "適應症" : "Indication"}</th>
                <th className="pb-2 pr-4">{locale === "zh" ? "來源" : "Source"}</th>
                <th className="pb-2">{locale === "zh" ? "配藥" : "Refill"}</th>
              </tr>
            </thead>
            <tbody>
              {ext.medReconciliation.map((med) => (
                <tr key={med.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 pr-4 font-medium">
                    {med.name}
                    {med.ownerUnclear && (
                      <Badge variant="risk-moderate" className="ml-2 text-[10px]">
                        {locale === "zh" ? "責任不明" : "Owner unclear"}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-muted">{lt(med.indication, locale)}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColors[med.source]}`}>
                      {lt(med.sourceLabel, locale)}
                    </span>
                  </td>
                  <td className="py-3">
                    {med.refillGapDays ? (
                      <span className="font-medium text-rose-600">
                        {med.refillGapDays}d {locale === "zh" ? "逾期" : "overdue"}
                      </span>
                    ) : med.refillDue ? (
                      formatDate(med.refillDue, locale)
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>{locale === "zh" ? "用藥風險標記" : "Medication risk flags"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ext.pharmacistFlags.map((flag, i) => (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-clinical border-l-4 bg-slate-50/50 p-4 dark:bg-slate-800/30 ${severityBorder[flag.severity]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{lt(flag.title, locale)}</p>
                <Badge variant="outline" className="text-[10px] uppercase">{flag.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-muted">{lt(flag.detail, locale)}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "依從性儀表板" : "Adherence dashboard"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.medications.map((med) => (
              <div key={med.id}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{med.name}</span>
                  <span className={med.adherence < 65 ? "text-rose-600" : "text-cocare-600"}>{med.adherence}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${med.adherence < 65 ? "bg-rose-500" : med.adherence < 80 ? "bg-amber-500" : "bg-cocare-500"}`}
                    style={{ width: `${med.adherence}%` }}
                  />
                </div>
                {med.flag && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{med.flag}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "患者輔導任務" : "Patient counseling tasks"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {ext.counselingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-clinical border p-3 dark:border-slate-700">
                <p className="text-sm font-medium">{lt(task.task, locale)}</p>
                <Badge variant="outline" className="capitalize">{task.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "zh" ? "跨提供者用藥可見性" : "Cross-provider medication visibility"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: locale === "zh" ? "家庭醫生" : "Family doctor", count: ext.medReconciliation.filter((m) => m.source === "family_doctor").length },
              { label: locale === "zh" ? "專科" : "Specialist", count: ext.medReconciliation.filter((m) => m.source === "specialist").length },
              { label: locale === "zh" ? "醫院 / 不明" : "Hospital / unclear", count: ext.medReconciliation.filter((m) => m.source === "hospital" || m.source === "unclear").length },
            ].map((block) => (
              <div key={block.label} className="rounded-clinical border p-4 text-center dark:border-slate-700">
                <p className="font-display text-2xl font-semibold text-cocare-700">{block.count}</p>
                <p className="text-xs text-slate-muted">{block.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "藥劑師介入紀錄" : "Pharmacist intervention log"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ext.pharmacistInterventions.length === 0 ? (
              <p className="text-sm text-slate-muted">{locale === "zh" ? "暫無紀錄" : "No entries yet"}</p>
            ) : (
              ext.pharmacistInterventions.map((pi) => (
                <div key={pi.id} className="rounded-clinical border p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-muted">{formatDate(pi.date, locale)}</p>
                  <p className="mt-1 text-sm font-medium">{lt(pi.action, locale)}</p>
                  <p className="mt-1 text-xs text-cocare-700">{lt(pi.outcome, locale)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "建議跟進行動" : "Recommended follow-up actions"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ext.pharmacistActions.map((pa) => (
              <div
                key={pa.id}
                className={`rounded-clinical border p-3 ${
                  pa.priority === "high" ? "border-rose-200 dark:border-rose-900" : "dark:border-slate-700"
                }`}
              >
                <p className="text-sm font-medium">{lt(pa.action, locale)}</p>
                <Badge variant={pa.priority === "high" ? "risk-high" : "outline"} className="mt-2">
                  {pa.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
