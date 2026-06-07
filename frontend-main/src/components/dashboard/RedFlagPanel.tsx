import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { urgencyColors } from "@/lib/utils";
import { ui, t } from "@/lib/i18n";
import type { AlertUrgency, Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface RedFlagPanelProps {
  patient: Patient;
  locale: Locale;
  scrollable?: boolean;
  maxItems?: number;
}

const urgencyOrder: AlertUrgency[] = ["today", "this_week", "preventive"];

export function RedFlagPanel({ patient, locale, scrollable, maxItems }: RedFlagPanelProps) {
  const allAlerts = urgencyOrder.flatMap((urgency) =>
    patient.alerts.filter((a) => a.urgency === urgency),
  );
  const alerts = maxItems ? allAlerts.slice(0, maxItems) : allAlerts;

  return (
    <Card className={scrollable ? "flex h-full flex-col" : "h-full"}>
      <CardHeader className={scrollable ? "shrink-0" : undefined}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <CardTitle>{t(ui.sections.alerts, locale)}</CardTitle>
        </div>
      </CardHeader>
      {scrollable ? (
        <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-2 p-4 md:p-5">
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-muted">
              {locale === "zh" ? "目前沒有紅旗警報" : "No red flags at this time"}
            </p>
          ) : (
            alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-clinical border-l-4 p-3 ${urgencyColors[alert.urgency]}`}
              >
                <p className="font-medium text-sm text-slate-900 dark:text-white">
                  {locale === "zh" ? alert.titleZh : alert.title}
                </p>
                <p className="mt-1 text-xs text-slate-muted dark:text-slate-400">
                  {locale === "zh" ? alert.detailZh : alert.detail}
                </p>
                <p className="mt-1.5 text-[10px] text-cocare-700 dark:text-cocare-400">
                  → {locale === "zh" ? alert.ownerZh : alert.owner}
                </p>
              </motion.div>
            ))
          )}
        </ScrollableArea>
      ) : (
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-muted">
              {locale === "zh" ? "目前沒有紅旗警報" : "No red flags at this time"}
            </p>
          ) : (
            alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-clinical border-l-4 p-3 ${urgencyColors[alert.urgency]}`}
              >
                <p className="font-medium text-sm text-slate-900 dark:text-white">
                  {locale === "zh" ? alert.titleZh : alert.title}
                </p>
                <p className="mt-1 text-xs text-slate-muted dark:text-slate-400">
                  {locale === "zh" ? alert.detailZh : alert.detail}
                </p>
                <p className="mt-1.5 text-[10px] text-cocare-700 dark:text-cocare-400">
                  → {locale === "zh" ? alert.ownerZh : alert.owner}
                </p>
              </motion.div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}
