import { X, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Button } from "@/components/ui/Button";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface ShareCarePlanModalProps {
  patient: Patient;
  locale: Locale;
  onClose: () => void;
}

export function ShareCarePlanModal({ patient, locale, onClose }: ShareCarePlanModalProps) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-clinical bg-white shadow-clinical-lg dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-lg font-semibold">
            {t(ui.printPlan, locale)} — {locale === "zh" ? patient.nameZh : patient.name}
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollableArea locale={locale} className="max-h-[calc(90vh-4.5rem)] flex-1">
          <div className="space-y-6 p-6 print:p-8">
          <section>
            <h3 className="font-display font-semibold text-cocare-700">
              {locale === "zh" ? "患者概要" : "Patient summary"}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {patient.age}y · {(locale === "zh" ? patient.conditionsZh : patient.conditions).join(", ")}
            </p>
            <p className="mt-2 text-sm">{locale === "zh" ? patient.aiSummaryZh : patient.aiSummary}</p>
          </section>

          <section>
            <h3 className="font-display font-semibold text-cocare-700">
              {locale === "zh" ? "共享護理計劃" : "Shared care plan"}
            </h3>
            <ul className="mt-3 space-y-3">
              {patient.carePlan.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-medium">{locale === "zh" ? item.actionZh : item.action}</p>
                  <p className="mt-1 text-slate-muted">
                    {locale === "zh" ? item.ownerZh : item.owner}
                    {item.dueDate && ` · ${formatDate(item.dueDate, locale)}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-display font-semibold text-cocare-700">
              {locale === "zh" ? "紅旗警報" : "Red flags"}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {patient.alerts.map((a) => (
                <li key={a.id}>• {locale === "zh" ? a.titleZh : a.title}</li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-slate-muted">{t(ui.demoDisclaimer, locale)}</p>
          </div>
        </ScrollableArea>
      </div>
    </div>
  );
}
