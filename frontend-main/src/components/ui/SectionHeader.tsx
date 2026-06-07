import type { ComponentType, ReactNode } from "react";

interface SectionHeaderProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: ReactNode;
}

export function SectionHeader({ icon: Icon, title, description, badge }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clinical bg-cocare-100 dark:bg-cocare-900/50">
          <Icon className="h-5 w-5 text-cocare-700 dark:text-cocare-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-muted dark:text-slate-400">{description}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}
