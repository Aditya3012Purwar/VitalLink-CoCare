import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-clinical font-body font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocare-500/50 disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-cocare-600 text-white shadow-clinical hover:bg-cocare-700 active:scale-[0.98]",
        variant === "secondary" &&
          "bg-cocare-50 text-cocare-800 hover:bg-cocare-100 dark:bg-cocare-900/40 dark:text-cocare-200 dark:hover:bg-cocare-900/60",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        variant === "outline" &&
          "border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
        className
      )}
      {...props}
    />
  );
}
