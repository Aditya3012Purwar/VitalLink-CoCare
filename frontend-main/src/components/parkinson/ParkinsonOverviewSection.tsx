import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale, Patient } from "@/types/patient";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { DiseaseSummaryCard } from "@/components/dashboard/DiseaseSummaryCard";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { DoctorPerformancePanel } from "@/components/parkinson/DoctorPerformancePanel";
import { DoctorChatbot } from "@/components/parkinson/DoctorChatbot";

interface Props {
  patient: Patient;
  locale: Locale;
  onPrescribe?: () => void;
  onOpenCarePlan?: () => void;
}

export function ParkinsonOverviewSection({ patient, locale, onPrescribe, onOpenCarePlan }: Props) {
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    setShowAssistant(false);
  }, [patient.id]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
        <div className="shrink-0">
          <PatientHeader
            patient={patient}
            locale={locale}
            compact
            onPrescribe={onPrescribe}
            onAskAi={patient.padsId ? () => setShowAssistant((v) => !v) : undefined}
            aiAssistantActive={showAssistant}
          />
        </div>
        <div className="min-h-0 flex-1">
          <UpcomingTasks
            patient={patient}
            locale={locale}
            scrollable
            title={{ en: "Care plan", zh: "護理計劃" }}
            onViewFull={onOpenCarePlan}
          />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DiseaseSummaryCard patient={patient} locale={locale} variant="overview" />

        <div className="mt-2.5 min-h-0 flex-1">
          <AnimatePresence mode="wait">
            {showAssistant && patient.padsId ? (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="h-full min-h-0"
              >
                <DoctorChatbot
                  padsId={patient.padsId}
                  patientName={locale === "zh" ? patient.nameZh : patient.name}
                  locale={locale}
                  embedded
                />
              </motion.div>
            ) : patient.padsId ? (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="h-full min-h-0"
              >
                <DoctorPerformancePanel padsId={patient.padsId} locale={locale} layout="details" />
              </motion.div>
            ) : (
              <motion.div
                key="no-pads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-clinical border border-slate-200 bg-white p-5 text-sm text-slate-muted dark:border-slate-700 dark:bg-slate-900"
              >
                {locale === "zh" ? "此患者未連接 PADS 智能手錶數據。" : "No PADS smartwatch data linked for this patient."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
