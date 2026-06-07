import { Sparkles } from "lucide-react";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent } from "@/components/ui/Card";

interface AiSummaryCardProps {
  patient: Patient;
  locale: Locale;
}

export function AiSummaryCard({ patient, locale }: AiSummaryCardProps) {
  return (
    <Card className="border-cocare-200/60 bg-gradient-to-br from-cocare-50/80 to-white dark:border-cocare-800/40 dark:from-cocare-950/30 dark:to-slate-900">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clinical bg-cocare-100 dark:bg-cocare-900/50">
            <Sparkles className="h-5 w-5 text-cocare-600 dark:text-cocare-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">
                {t(ui.aiLabel, locale)}
              </h3>
              <span className="rounded-full bg-cocare-100 px-2 py-0.5 text-[10px] font-medium text-cocare-800 dark:bg-cocare-900/60 dark:text-cocare-300">
                {locale === "zh" ? "統籌支援" : "Coordination support"}
              </span>
            </div>
            <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">
              {locale === "zh" ? patient.aiSummaryZh : patient.aiSummary}
            </p>
            <p className="mt-3 text-xs text-slate-muted dark:text-slate-500">
              {t(ui.aiDisclaimer, locale)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
