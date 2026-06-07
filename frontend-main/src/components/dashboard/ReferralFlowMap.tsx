import { motion } from "framer-motion";
import { ArrowRight, Building2, Home, Stethoscope, Users } from "lucide-react";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient, ReferralStage } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const stageIcons: Record<ReferralStage, React.ComponentType<{ className?: string }>> = {
  primary_care: Home,
  specialist: Stethoscope,
  hospital: Building2,
  dhc_community: Users,
};

const statusStyles = {
  current: "ring-2 ring-cocare-500 bg-cocare-50 dark:bg-cocare-950/40",
  completed: "opacity-80 bg-slate-50 dark:bg-slate-800/40",
  pending: "border-dashed border-amber-400 bg-amber-50/30 dark:bg-amber-950/20",
  escalation: "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20",
};

interface ReferralFlowMapProps {
  patient: Patient;
  locale: Locale;
}

export function ReferralFlowMap({ patient, locale }: ReferralFlowMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(ui.sections.referral, locale)}</CardTitle>
        <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
          {locale === "zh"
            ? "基層 ↔ 專科 ↔ 醫院 ↔ 地區康健中心雙向轉介"
            : "Primary ↔ specialist ↔ hospital ↔ DHC two-way referral"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {patient.referralFlow.map((node, i) => {
            const Icon = stageIcons[node.stage];
            return (
              <div key={node.stage} className="flex flex-1 items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex-1 rounded-clinical border p-4 ${statusStyles[node.status]}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-cocare-600 dark:text-cocare-400" />
                    <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {locale === "zh" ? node.labelZh : node.label}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-muted dark:text-slate-400">
                    {locale === "zh" ? node.detailZh : node.detail}
                  </p>
                  <span className="mt-2 inline-block text-[10px] font-medium uppercase tracking-wide text-cocare-600 dark:text-cocare-400">
                    {node.status.replace("_", " ")}
                  </span>
                </motion.div>
                {i < patient.referralFlow.length - 1 && (
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-cocare-400 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
