import { motion } from "framer-motion";
import { Info, Network, Users } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { AlertBanner, SummaryStrip, TimelineStrip } from "@/components/shell/SharedShellParts";
import { ReferralFlowMap } from "@/components/dashboard/ReferralFlowMap";
import { CareTimeline } from "@/components/dashboard/CareTimeline";
import { OwnershipMatrix } from "@/components/dashboard/OwnershipMatrix";
import { AiSummaryCard } from "@/components/dashboard/AiSummaryCard";
import { RedFlagPanel } from "@/components/dashboard/RedFlagPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface CareNetworkTabProps {
  patient: Patient;
  locale: Locale;
}

export function CareNetworkTab({ patient, locale }: CareNetworkTabProps) {
  const ext = getRoleExtensions(patient.id);

  return (
    <div className="space-y-6">
      <Card className="border-cocare-200/60 bg-gradient-to-br from-cocare-50/80 to-white dark:from-cocare-950/30 dark:to-slate-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-clinical bg-cocare-100 dark:bg-cocare-900/50">
              <Info className="h-6 w-6 text-cocare-600 dark:text-cocare-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                {locale === "zh" ? "帕金森護理網絡 — 醫生、照顧者與患者" : "Parkinson care network — doctor, caretaker & patient"}
              </h2>
              <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
                {locale === "zh"
                  ? "此分頁展示帕金森病患者跨神經科、照顧者及智能手錶監測的統籌背景。醫生、護士、藥劑師與患者各看不同工作流程，但底層 PADS 智能手錶數據與護理計劃相同。"
                  : "This tab shows the coordination context for Parkinson's care — neurologist, caretaker, and smartwatch monitoring. Each role gets a tailored workflow, but the underlying PADS smartwatch data and care plan are shared."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  locale === "zh" ? "智能手錶震顫監測" : "Smartwatch tremor monitoring",
                  locale === "zh" ? "PDNMS 非運動症狀" : "PDNMS non-motor symptoms",
                  locale === "zh" ? "左旋多巴開關期" : "Levodopa on/off periods",
                  locale === "zh" ? "照顧者家居評估" : "Caretaker home assessments",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-cocare-200 bg-white/80 px-3 py-1 text-xs font-medium text-cocare-800 dark:border-cocare-800 dark:bg-slate-900/60 dark:text-cocare-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertBanner patient={patient} locale={locale} />
      <SummaryStrip
        patient={patient}
        locale={locale}
        lastReview={ext.lastReview}
        nextAppointment={ext.nextAppointment}
      />
      <TimelineStrip patient={patient} locale={locale} />

      <ReferralFlowMap patient={patient} locale={locale} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-cocare-600" />
              <CardTitle>
                {locale === "zh" ? "角色如何連接同一計劃" : "How roles connect to one plan"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  role: t(ui.roles.doctor, locale),
                  desc:
                    locale === "zh"
                      ? "主責風險分層、轉介決策及共享計劃編訂"
                      : "Owns risk tier, referral decisions, and shared plan authoring",
                },
                {
                  role: t(ui.roles.nurse, locale),
                  desc:
                    locale === "zh"
                      ? "執行地區康健中心跟進、輔導及出院後監測"
                      : "Executes DHC follow-up, coaching, and post-discharge monitoring",
                },
                {
                  role: t(ui.roles.pharmacist, locale),
                  desc:
                    locale === "zh"
                      ? "核對跨提供者用藥、依從性及安全標記"
                      : "Reconciles cross-provider meds, adherence, and safety flags",
                },
                {
                  role: t(ui.roles.patient, locale),
                  desc:
                    locale === "zh"
                      ? "查看簡化版下一步、藥物及紅旗徵象"
                      : "Sees simplified next steps, medicines, and red-flag symptoms",
                },
              ] as const
            ).map((item, i) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 rounded-clinical border border-slate-100 p-3 dark:border-slate-800"
              >
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-cocare-600" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{item.role}</p>
                  <p className="mt-0.5 text-sm text-slate-muted dark:text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <RedFlagPanel patient={patient} locale={locale} />
      </div>

      <AiSummaryCard patient={patient} locale={locale} />
      <OwnershipMatrix patient={patient} locale={locale} />
      <CareTimeline patient={patient} locale={locale} />

      <p className="text-center text-xs text-slate-muted dark:text-slate-500">
        {t(ui.demoDisclaimer, locale)}
      </p>
    </div>
  );
}
