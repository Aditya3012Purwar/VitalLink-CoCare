import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, locale: "en" | "zh" = "en"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "zh" ? "zh-HK" : "en-HK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const layerColors: Record<string, string> = {
  family_doctor: "bg-cocare-100 text-cocare-800 dark:bg-cocare-900/40 dark:text-cocare-200",
  specialist: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  hospital: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  dhc: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  community: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  patient: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const urgencyColors: Record<string, string> = {
  today: "border-l-rose-500 bg-rose-50/80 dark:bg-rose-950/30",
  this_week: "border-l-amber-500 bg-amber-50/80 dark:bg-amber-950/30",
  preventive: "border-l-cocare-500 bg-cocare-50/80 dark:bg-cocare-950/30",
};

export const statusColors: Record<string, string> = {
  overdue: "text-rose-600 dark:text-rose-400",
  due_soon: "text-amber-600 dark:text-amber-400",
  scheduled: "text-cocare-600 dark:text-cocare-400",
  completed: "text-slate-500 dark:text-slate-400",
};
