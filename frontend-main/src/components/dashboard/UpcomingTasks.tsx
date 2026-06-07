import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { formatDate, statusColors } from "@/lib/utils";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface UpcomingTasksProps {
  patient: Patient;
  locale: Locale;
  scrollable?: boolean;
  /** Overview panel label — defaults to upcoming tasks */
  title?: { en: string; zh: string };
  onViewFull?: () => void;
}

export function UpcomingTasks({ patient, locale, scrollable, title, onViewFull }: UpcomingTasksProps) {
  const panelTitle = title ? (locale === "zh" ? title.zh : title.en) : t(ui.sections.tasks, locale);
  const tasks = patient.carePlan
    .filter((c) => c.status !== "completed")
    .sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, scheduled: 2, completed: 3 };
      return order[a.status] - order[b.status];
    });

  return (
    <Card className={scrollable ? "flex h-full flex-col" : undefined}>
      <CardHeader className={`${scrollable ? "shrink-0" : ""} flex flex-row items-center justify-between gap-2`}>
        <CardTitle>{panelTitle}</CardTitle>
        {onViewFull && (
          <button
            type="button"
            onClick={onViewFull}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-cocare-600 hover:underline dark:text-cocare-400"
          >
            {locale === "zh" ? "完整計劃" : "Full plan"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </CardHeader>
      {scrollable ? (
        <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-2 p-4 md:p-5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-clinical border border-slate-100 p-3 dark:border-slate-800"
            >
              {task.status === "overdue" ? (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {locale === "zh" ? task.actionZh : task.action}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-muted">
                    {locale === "zh" ? task.ownerZh : task.owner}
                  </span>
                  {task.dueDate && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{formatDate(task.dueDate, locale)}</span>
                    </>
                  )}
                  <span className={`capitalize ${statusColors[task.status]}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </ScrollableArea>
      ) : (
        <CardContent className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-clinical border border-slate-100 p-3 dark:border-slate-800"
            >
              {task.status === "overdue" ? (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {locale === "zh" ? task.actionZh : task.action}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-muted">
                    {locale === "zh" ? task.ownerZh : task.owner}
                  </span>
                  {task.dueDate && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{formatDate(task.dueDate, locale)}</span>
                    </>
                  )}
                  <span className={`capitalize ${statusColors[task.status]}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

interface WhatChangedCardProps {
  patient: Patient;
  locale: Locale;
}

export function WhatChangedCard({ patient, locale }: WhatChangedCardProps) {
  if (patient.recentChanges.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(ui.whatChanged, locale)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {patient.recentChanges.map((change) => (
          <div
            key={`${change.field}-${change.date}`}
            className="flex items-center justify-between gap-4 rounded-clinical bg-slate-50 p-3 dark:bg-slate-800/40"
          >
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {locale === "zh" ? change.fieldZh : change.field}
              </p>
              <p className="mt-1 text-xs text-slate-muted">{formatDate(change.date, locale)}</p>
            </div>
            <div className="text-right text-sm">
              <span className="text-slate-muted line-through">{change.before}</span>
              <span className="mx-2 text-cocare-600">→</span>
              <span className="font-medium text-slate-900 dark:text-white">{change.after}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
