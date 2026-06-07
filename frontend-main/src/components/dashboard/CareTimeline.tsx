import { motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  CalendarX,
  FileText,
  Pill,
  Stethoscope,
  ArrowLeftRight,
} from "lucide-react";
import { formatDate, layerColors } from "@/lib/utils";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient, TimelineEvent } from "@/types/patient";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

const typeIcons: Record<TimelineEvent["type"], React.ComponentType<{ className?: string }>> = {
  admission: Building2,
  ed_visit: AlertCircle,
  exacerbation: Stethoscope,
  vitals_flag: FileText,
  missed_followup: CalendarX,
  med_change: Pill,
  referral: ArrowLeftRight,
};

interface CareTimelineProps {
  patient: Patient;
  locale: Locale;
}

export function CareTimeline({ patient, locale }: CareTimelineProps) {
  const sorted = [...patient.timeline].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t(ui.sections.timeline, locale)}</CardTitle>
        <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
          {locale === "zh"
            ? "入院、急症、加重、指標異常、錯過跟進及轉介紀錄"
            : "Admissions, ED visits, exacerbations, flags, missed follow-ups & referrals"}
        </p>
      </CardHeader>
      <ScrollableArea locale={locale} className="max-h-[520px] p-4 md:p-5">
        <div className="relative space-y-0 pl-2">
          <div className="absolute bottom-0 left-[19px] top-2 w-px bg-cocare-200 dark:bg-cocare-800" />
          {sorted.map((event, i) => {
            const Icon = typeIcons[event.type];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-4 pb-6"
              >
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-cocare-200 bg-white dark:border-cocare-700 dark:bg-slate-900">
                  <Icon className="h-4 w-4 text-cocare-600 dark:text-cocare-400" />
                </div>
                <div className="min-w-0 flex-1 rounded-clinical border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {locale === "zh" ? event.titleZh : event.title}
                    </p>
                    <span className="text-xs text-slate-muted dark:text-slate-500">
                      {formatDate(event.date, locale)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
                    {locale === "zh" ? event.detailZh : event.detail}
                  </p>
                  {event.layer && (
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${layerColors[event.layer]}`}
                    >
                      {event.layer.replace("_", " ")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollableArea>
    </Card>
  );
}
