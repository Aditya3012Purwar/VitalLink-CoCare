import { motion } from "framer-motion";
import {
  Calendar,
  Heart,
  Phone,
  Users,
  Watch,
} from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import { PatientChecklist } from "@/components/patient/PatientChecklist";
import { formatDate } from "@/lib/utils";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DiseaseSummaryCard } from "@/components/dashboard/DiseaseSummaryCard";
import { SmartwatchDashboard } from "@/components/parkinson/SmartwatchDashboard";
import { PrescriptionQR } from "@/components/prescription/PrescriptionQR";
import type { Prescription } from "@/types/prescription";

interface RoleViewProps {
  patient: Patient;
  locale: Locale;
  prescription?: Prescription | null;
  canEditChecklist?: boolean;
  onChecklistChange?: (items: Patient["checklist"]) => void;
}

export function PatientRoleView({
  patient,
  locale,
  prescription,
  canEditChecklist = false,
  onChecklistChange,
}: RoleViewProps) {
  const ext = getRoleExtensions(patient.id);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-clinical border border-cocare-200/60 bg-gradient-to-r from-cocare-50/80 to-white p-6 dark:from-cocare-950/30 dark:to-slate-900"
      >
        <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          {locale === "zh" ? `你好，${patient.nameZh.replace("先生", "").replace("女士", "")}` : `Hello, ${patient.name.split(" ").pop()}`}
        </h2>
        <p className="mt-2 text-lg text-slate-muted dark:text-slate-400">
          {locale === "zh"
            ? "這是您今天的護理重點 — 一步一步來。"
            : "Here’s what matters today — one step at a time."}
        </p>
      </motion.div>

      <DiseaseSummaryCard patient={patient} locale={locale} />

      <PatientChecklist
        items={patient.checklist ?? ext.checklist}
        locale={locale}
        editable={canEditChecklist}
        onChange={onChecklistChange}
      />

      {prescription && <PrescriptionQR prescription={prescription} locale={locale} />}

      {patient.padsId && (
        <SmartwatchDashboard patient={patient} locale={locale} audience="patient" />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "我的情況" : "My conditions"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ext.conditionExplainers.map((c) => (
              <div key={c.id} className="rounded-clinical bg-slate-50 p-4 dark:bg-slate-800/40">
                <p className="font-display font-semibold text-cocare-800 dark:text-cocare-300">
                  {lt(c.name, locale)}
                </p>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {lt(c.simpleExplanation, locale)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "我的藥物" : "My medicines"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.medications.length > 0
              ? patient.medications.map((med) => (
                  <div
                    key={med.id}
                    className="rounded-clinical border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{med.name}</p>
                    <p className="mt-1 text-sm font-medium text-cocare-700 dark:text-cocare-400">
                      {med.dose} · {med.frequency}
                    </p>
                    {med.flag && <p className="mt-1 text-sm text-slate-muted">{med.flag}</p>}
                    <p className="mt-1 text-xs text-slate-muted">{med.prescriber}</p>
                  </div>
                ))
              : ext.patientMedCards.map((med) => (
                  <div
                    key={med.id}
                    className={`rounded-clinical border p-4 ${
                      med.status === "overdue"
                        ? "border-rose-200 bg-rose-50/50 dark:border-rose-900"
                        : med.status === "low"
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{med.name}</p>
                    <p className="mt-1 text-base text-slate-muted">{lt(med.purpose, locale)}</p>
                    <p className="mt-2 text-sm font-medium text-cocare-700 dark:text-cocare-400">
                      {lt(med.whenToTake, locale)}
                    </p>
                    <p className="mt-1 text-sm text-slate-muted">{lt(med.refillStatus, locale)}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-200/60 dark:border-rose-900/40">
        <CardHeader>
          <CardTitle className="text-rose-800 dark:text-rose-300">
            {locale === "zh" ? "何時要尋求協助" : "When to seek help"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {ext.patientRedFlags.map((rf) => (
            <div key={rf.id} className="rounded-clinical border border-rose-100 bg-rose-50/30 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
              <p className="font-semibold text-slate-900 dark:text-white">{lt(rf.symptom, locale)}</p>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">{lt(rf.action, locale)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "我的護理團隊" : "My care team"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ext.careTeam.map((member) => (
              <div key={member.id} className="flex items-start justify-between gap-3 rounded-clinical border p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                  <p className="text-sm text-cocare-700 dark:text-cocare-400">{lt(member.role, locale)}</p>
                  <p className="text-xs text-slate-muted">{member.organization}</p>
                </div>
                {member.contact && (
                  <a href={`tel:${member.contact}`} className="flex items-center gap-1 text-sm text-cocare-600">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "即將預約" : "Upcoming appointments"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ext.appointments.map((ap) => (
              <div key={ap.id} className="rounded-clinical border p-4 dark:border-slate-700">
                <p className="text-sm text-slate-muted">{formatDate(ap.date, locale)}</p>
                <p className="font-semibold text-slate-900 dark:text-white">{lt(ap.title, locale)}</p>
                <p className="text-sm text-slate-muted">{lt(ap.location, locale)} · {ap.with}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "進度與依從" : "Progress & adherence"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    className="stroke-cocare-600"
                    strokeWidth="3"
                    strokeDasharray={`${patient.adherenceScore} 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-semibold">
                  {patient.adherenceScore}%
                </span>
              </div>
              <p className="text-base text-slate-muted dark:text-slate-400">
                {locale === "zh"
                  ? "您的護理團隊正協助您改善依從性 — 小步驟也重要。"
                  : "Your care team is helping you improve adherence — small steps count."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cocare-200/40 bg-cocare-50/30 dark:bg-cocare-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Watch className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "智能手錶監測提示" : "Smartwatch monitoring tips"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {lt(ext.smokingPanel, locale)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
