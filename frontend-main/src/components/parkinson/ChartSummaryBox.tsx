import { Lightbulb } from "lucide-react";

interface Props {
  summary: string;
  locale: "en" | "zh";
  title?: string;
  className?: string;
}

export function ChartSummaryBox({ summary, locale, title, className = "mt-3" }: Props) {
  const label =
    title ?? (locale === "zh" ? "簡易解讀" : "Simple explanation");

  return (
    <div className={`${className} flex gap-2 rounded-clinical border border-sky-200/60 bg-sky-50/50 p-3 dark:border-sky-900/40 dark:bg-sky-950/20`}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {summary.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      </div>
    </div>
  );
}
