import type { TaskSummary, TremorSeverity } from "@/types/parkinson";
import type { Locale } from "@/types/patient";

interface Props {
  tasks: TaskSummary[];
  locale: Locale;
  onSelectTask?: (taskId: string) => void;
  selectedTask?: string;
}

const severityColors: Record<TremorSeverity, string> = {
  normal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  mild: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  moderate: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

function cellSeverity(m: { severity: TremorSeverity } | null): TremorSeverity {
  return m?.severity ?? "normal";
}

export function TaskSeverityHeatmap({ tasks, locale, onSelectTask, selectedTask }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="py-2 text-left font-medium text-slate-muted">
              {locale === "zh" ? "評估步驟" : "Assessment step"}
            </th>
            <th className="py-2 text-center font-medium text-slate-muted">
              {locale === "zh" ? "左手" : "Left wrist"}
            </th>
            <th className="py-2 text-center font-medium text-slate-muted">
              {locale === "zh" ? "右手" : "Right wrist"}
            </th>
            <th className="py-2 text-center font-medium text-slate-muted">Hz</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const leftSev = cellSeverity(t.left);
            const rightSev = cellSeverity(t.right);
            const freq = t.left?.tremor_frequency_hz ?? t.right?.tremor_frequency_hz ?? 0;
            const isSelected = selectedTask === t.task_id;

            return (
              <tr
                key={t.task_id}
                className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                  isSelected ? "bg-cocare-50/60 dark:bg-cocare-950/30" : ""
                }`}
                onClick={() => onSelectTask?.(t.task_id)}
              >
                <td className="py-2.5 pr-2">
                  <span className="font-medium">{t.label}</span>
                  <span className="ml-2 text-[10px] capitalize text-slate-muted">{t.category}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityColors[leftSev]}`}>
                    {leftSev}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityColors[rightSev]}`}>
                    {rightSev}
                  </span>
                </td>
                <td className="py-2.5 text-center font-mono text-xs">{freq}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
