import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AiSummaryCard } from "@/components/dashboard/AiSummaryCard";
import { PatientHeader, KpiCards } from "@/components/dashboard/PatientHeader";
import { DoctorPerformancePanel } from "@/components/parkinson/DoctorPerformancePanel";
import { SmartwatchDashboard } from "@/components/parkinson/SmartwatchDashboard";
import { DoctorChatbot } from "@/components/parkinson/DoctorChatbot";
import { PrescriptionForm } from "@/components/prescription/PrescriptionForm";
import type { Prescription } from "@/types/prescription";
import { SharedCarePlan } from "@/components/dashboard/SharedCarePlan";
import { WhatChangedCard } from "@/components/dashboard/UpcomingTasks";
import { VitalsMiniChart } from "@/components/dashboard/MedicationList";
import { formatDate } from "@/lib/utils";

interface RoleViewProps {
  patient: Patient;
  locale: Locale;
  doctorName?: string;
  onPrescriptionCreated?: (rx: Prescription) => void;
}

const problemStatusStyle = {
  uncontrolled: "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30",
  monitoring: "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30",
  stable: "border-cocare-300 bg-cocare-50/50 dark:border-cocare-800 dark:bg-cocare-950/30",
};

const pathwayColors = {
  primary: "bg-cocare-100 text-cocare-800 dark:bg-cocare-900/40",
  specialist: "bg-sky-100 text-sky-800 dark:bg-sky-900/40",
  dhc: "bg-amber-100 text-amber-800 dark:bg-amber-900/40",
  pharmacy: "bg-violet-100 text-violet-800 dark:bg-violet-900/40",
  urgent: "bg-rose-100 text-rose-800 dark:bg-rose-900/40",
};

export function DoctorRoleView({ patient, locale, doctorName, onPrescriptionCreated }: RoleViewProps) {
  const ext = getRoleExtensions(patient.id);
  const overdue = patient.carePlan.filter((c) => c.status === "overdue");

  return (
    <div className="space-y-4">
      {/* 3-panel header label */}
      <div className="flex items-center gap-2 text-xs text-slate-muted">
        <LayoutDashboard className="h-4 w-4" />
        <span>
          {locale === "zh"
            ? "流程：智能手錶分析 → 圖表摘要 → AI 問答 → 開處方"
            : "Flow: Smartwatch analysis → Chart summaries → AI chat → Prescribe"}
        </span>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <PatientHeader patient={patient} locale={locale} />
          <KpiCards patient={patient} locale={locale} />

          {patient.padsId && <DoctorPerformancePanel padsId={patient.padsId} locale={locale} />}

          <AiSummaryCard patient={patient} locale={locale} />

          {/* Panel 2: Charts with simple explanations */}
          <SmartwatchDashboard patient={patient} locale={locale} audience="doctor" />

          {patient.padsId && onPrescriptionCreated && (
            <PrescriptionForm
              padsId={patient.padsId}
              doctorName={doctorName ?? "Dr. Sarah Müller"}
              locale={locale}
              onCreated={onPrescriptionCreated}
            />
          )}

          <div>
            <h3 className="mb-3 font-display text-lg font-semibold">
              {locale === "zh" ? "問題導向評估" : "Problem-oriented assessment"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ext.problemCards.map((pc, i) => (
                <motion.div
                  key={pc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-clinical border-2 p-4 ${problemStatusStyle[pc.status]}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-white">{lt(pc.domain, locale)}</p>
                    <Badge variant="outline" className="capitalize">{pc.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-muted">{lt(pc.summary, locale)}</p>
                  <p className="mt-2 text-sm font-medium text-cocare-700 dark:text-cocare-400">
                    → {lt(pc.nextAction, locale)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <VitalsMiniChart patient={patient} locale={locale} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{locale === "zh" ? "逾期行動" : "Overdue actions"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdue.length === 0 ? (
                  <p className="text-sm text-slate-muted">{locale === "zh" ? "無逾期項目" : "No overdue items"}</p>
                ) : (
                  overdue.map((item) => (
                    <div key={item.id} className="rounded-clinical border border-rose-200 p-3 dark:border-rose-900">
                      <p className="font-medium">{locale === "zh" ? item.actionZh : item.action}</p>
                      <p className="mt-1 text-xs text-slate-muted">
                        {locale === "zh" ? item.ownerZh : item.owner}
                        {item.dueDate && ` · ${formatDate(item.dueDate, locale)}`}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{locale === "zh" ? "轉介 / 升級" : "Referral / escalation"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ext.referralActions.map((ra) => (
                  <div key={ra.id} className="flex items-start gap-3 rounded-clinical border p-3 dark:border-slate-700">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cocare-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lt(ra.action, locale)}</p>
                      <div className="mt-2 flex gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pathwayColors[ra.pathway]}`}>
                          {ra.pathway}
                        </span>
                        <span className="text-[10px] capitalize text-slate-muted">{ra.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <SharedCarePlan patient={patient} locale={locale} />
          <WhatChangedCard patient={patient} locale={locale} />
        </div>

        {/* Panel 3 — AI Chatbot (sticky right) */}
        {patient.padsId && (
          <aside className="w-full shrink-0 xl:sticky xl:top-24 xl:w-80 xl:self-start">
            <DoctorChatbot
              padsId={patient.padsId}
              patientName={locale === "zh" ? patient.nameZh : patient.name}
              locale={locale}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

