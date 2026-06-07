import { Flower2, HeartPulse, Network, User, Stethoscope, Heart, Pill } from "lucide-react";
import { ui, t } from "@/lib/i18n";
import type { Locale } from "@/types/patient";
import type { AuthRole } from "@/types/auth";
import type { UserRole, WorkspaceTab } from "@/types/roles";
import { cn } from "@/lib/utils";

interface WorkspaceTabSwitcherProps {
  tab: WorkspaceTab;
  locale: Locale;
  authRole?: AuthRole;
  onChange: (tab: WorkspaceTab) => void;
  onDarkChrome?: boolean;
}

const allTabs: {
  id: WorkspaceTab;
  icon: React.ComponentType<{ className?: string }>;
  label: { en: string; zh: string };
}[] = [
  { id: "network", icon: Network, label: ui.careNetworkTab },
  { id: "healthChat", icon: Flower2, label: ui.healthChatTab },
  { id: "patient", icon: User, label: ui.roles.patient },
  { id: "doctor", icon: Stethoscope, label: ui.roles.doctor },
  { id: "caretaker", icon: Heart, label: ui.roles.caretaker },
  { id: "nurse", icon: Heart, label: ui.roles.nurse },
  { id: "pharmacist", icon: Pill, label: ui.roles.pharmacist },
];

function tabsForRole(role?: AuthRole) {
  if (role === "doctor") {
    return allTabs.filter((t) => ["network", "doctor", "patient"].includes(t.id));
  }
  if (role === "patient") {
    return allTabs.filter((t) => t.id === "patient" || t.id === "healthChat");
  }
  if (role === "chemist") {
    return allTabs.filter((t) => t.id === "pharmacist");
  }
  if (role === "caretaker") {
    return allTabs.filter((t) => ["network", "caretaker", "patient"].includes(t.id));
  }
  return allTabs;
}

export function WorkspaceTabSwitcher({ tab, locale, authRole, onChange, onDarkChrome }: WorkspaceTabSwitcherProps) {
  const tabs = tabsForRole(authRole);
  const shell = onDarkChrome
    ? "border-slate-600/50 bg-slate-700/40"
    : "border-slate-200/80 bg-white/60 dark:border-slate-700 dark:bg-slate-800/60";
  const idle = onDarkChrome
    ? "text-slate-300 hover:bg-slate-700"
    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700";

  return (
    <div className={`flex flex-wrap gap-1 rounded-clinical border p-1 ${shell}`}>
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            tab === id
              ? "bg-cocare-600 text-white shadow-sm"
              : idle
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{t(label, locale)}</span>
        </button>
      ))}
    </div>
  );
}

export function WorkspaceTabBadge({ tab, locale }: { tab: WorkspaceTab; locale: Locale }) {
  if (tab === "network") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Network className="h-3 w-3" />
        {t(ui.careNetworkTab, locale)} · {t(ui.careNetworkDesc, locale)}
      </span>
    );
  }

  if (tab === "healthChat") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
        <Flower2 className="h-3 w-3" />
        {t(ui.healthChatTab, locale)} · {t(ui.healthChatDesc, locale)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cocare-100 px-3 py-1 text-xs font-medium text-cocare-800 dark:bg-cocare-900/50 dark:text-cocare-200">
      <HeartPulse className="h-3 w-3" />
      {t(ui.roles[tab], locale)} · {t(ui.roleDesc[tab], locale)}
    </span>
  );
}

/** @deprecated use WorkspaceTabSwitcher */
export function RoleSwitcher({
  role,
  locale,
  onChange,
}: {
  role: UserRole;
  locale: Locale;
  onChange: (role: UserRole) => void;
}) {
  return (
    <WorkspaceTabSwitcher tab={role} locale={locale} onChange={(t) => t !== "network" && onChange(t)} />
  );
}

export function RoleBadge({ role, locale }: { role: UserRole; locale: Locale }) {
  return <WorkspaceTabBadge tab={role} locale={locale} />;
}
