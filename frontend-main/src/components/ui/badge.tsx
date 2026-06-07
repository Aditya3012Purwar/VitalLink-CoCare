import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "risk-high" | "risk-moderate" | "risk-stable";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-body",
        variant === "default" && "bg-cocare-100 text-cocare-800 dark:bg-cocare-900/50 dark:text-cocare-200",
        variant === "outline" && "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300",
        variant === "risk-high" && "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
        variant === "risk-moderate" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        variant === "risk-stable" && "bg-cocare-100 text-cocare-800 dark:bg-cocare-900/40 dark:text-cocare-300",
        className
      )}
      {...props}
    />
  );
}
