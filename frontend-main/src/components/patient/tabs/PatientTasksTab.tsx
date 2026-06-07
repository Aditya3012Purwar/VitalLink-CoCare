import { ClipboardList } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt, t, ui } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { PatientChecklist } from "@/components/patient/PatientChecklist";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { Badge } from "@/components/ui/Badge";

interface Props {
  patient: Patient;
  locale: Locale;
  canEditChecklist?: boolean;
  onChecklistChange?: (items: Patient["checklist"]) => void;
}

const statusTone: Record<string, string> = {
  overdue: "risk-high",
  due_soon: "risk-moderate",
  scheduled: "risk-stable",
  completed: "outline",
};

export function PatientTasksTab({
  patient,
  locale,
  canEditChecklist = true,
  onChecklistChange,
}: Props) {
  const ext = getRoleExtensions(patient.id);
  const isZh = locale === "zh";
  const openTasks = patient.carePlan.filter((c) => c.status !== "completed");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          {isZh ? "今日護理任務" : "Today's care tasks"}
        </h2>
        <p className="text-xs text-slate-muted">
          {isZh ? "勾選清單並查看護理計劃" : "Check off items and view care plan"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
        <PatientChecklist
          items={patient.checklist ?? ext.checklist}
          locale={locale}
          editable={canEditChecklist}
          compact
          onChange={onChecklistChange}
        />

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-cocare-600" />
              <CardTitle className="text-sm">{t(ui.sections.carePlan, locale)}</CardTitle>
            </div>
          </CardHeader>
          <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-1.5 p-2">
            {openTasks.length === 0 ? (
              <p className="text-xs text-slate-muted">
                {isZh ? "暫無待辦護理計劃項目。" : "No open care plan tasks."}
              </p>
            ) : (
              openTasks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-clinical border border-slate-200 p-2 dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-1">
                    <p className="text-xs font-medium leading-snug text-slate-900 dark:text-white">
                      {isZh ? item.actionZh : item.action}
                    </p>
                    <Badge
                      variant={statusTone[item.status] as "risk-high" | "risk-moderate" | "risk-stable" | "outline"}
                      className="text-[10px]"
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-muted">
                    {isZh ? item.ownerZh : item.owner}
                    {item.dueDate && ` · ${formatDate(item.dueDate, locale)}`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {isZh ? item.rationaleZh : item.rationale}
                  </p>
                </div>
              ))
            )}
          </ScrollableArea>
        </Card>
      </div>
    </div>
  );
}
