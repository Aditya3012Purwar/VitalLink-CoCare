import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Share2,
  X,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import type { Prescription } from "@/types/prescription";
import type { CarePlanItem, Locale, Patient } from "@/types/patient";
import type { PatientChecklistItem } from "@/types/roles";
import type { PatientWorkspaceSection } from "@/types/patientWorkspace";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ShareCarePlanModal } from "@/components/dashboard/ShareCarePlanModal";
import { HealthChatTab } from "@/components/tabs/HealthChatTab";
import { PatientOverviewTab } from "@/components/patient/tabs/PatientOverviewTab";
import { PatientTasksTab } from "@/components/patient/tabs/PatientTasksTab";
import { PatientMedicineTab } from "@/components/patient/tabs/PatientMedicineTab";
import { PatientAppointmentsTab } from "@/components/patient/tabs/PatientAppointmentsTab";
import { CaretakerEmergencyBanner } from "@/components/caretaker/CaretakerEmergencyBanner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";

interface Props {
  patient: Patient;
  locale: Locale;
  dark: boolean;
  authUser: AuthUser;
  showShareModal: boolean;
  prescription?: Prescription | null;
  onLogout: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onShare: () => void;
  onCloseShare: () => void;
  onChecklistChange?: (patientId: string, checklist: PatientChecklistItem[]) => void;
}

const navItems: {
  id: PatientWorkspaceSection;
  icon: React.ComponentType<{ className?: string }>;
  label: { en: string; zh: string };
}[] = [
  { id: "overview", icon: LayoutDashboard, label: { en: "My overview", zh: "我的概覽" } },
  { id: "healthTalk", icon: Flower2, label: { en: "Health Talk", zh: "健康對話" } },
  { id: "tasks", icon: ClipboardList, label: { en: "To-do tasks", zh: "護理任務" } },
  { id: "medicine", icon: Pill, label: { en: "My medicine", zh: "我的藥物" } },
  { id: "appointments", icon: Calendar, label: { en: "My appointments", zh: "我的預約" } },
];

const chrome = (dark: boolean) =>
  dark ? "border-slate-800 bg-slate-900/80" : "border-slate-700/50 bg-slate-800/95";

const chromeBorder = (dark: boolean) => (dark ? "border-slate-800" : "border-slate-700/50");

const chromeText = (dark: boolean) => (dark ? "text-slate-400" : "text-slate-300");

export function PatientWorkspace({
  patient,
  locale,
  dark,
  authUser,
  showShareModal,
  prescription,
  onLogout,
  onToggleTheme,
  onToggleLocale,
  onShare,
  onCloseShare,
  onChecklistChange,
}: Props) {
  const [section, setSection] = useState<PatientWorkspaceSection>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const isZh = locale === "zh";
  const isCaretaker = authUser.role === "caretaker";
  const roleLabel = isCaretaker
    ? isZh ? "照顧者" : "Caretaker"
    : isZh ? "患者" : "Patient";

  const ehealthLabel =
    patient.ehealthSync === "synced"
      ? isZh ? "已同步" : "Synced"
      : patient.ehealthSync === "partial"
        ? isZh ? "部分同步" : "Partial"
        : isZh ? "待同步" : "Pending";

  const openTaskCount = (patient.checklist ?? []).filter((c) => !c.done).length;
  const currentNavItem = navItems.find((item) => item.id === section);

  const selectSection = (id: PatientWorkspaceSection) => {
    setSection(id);
    setNavOpen(false);
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener("change", onResize);
    return () => mq.removeEventListener("change", onResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-clinical dark:bg-slate-950">
      {navOpen && (
        <button
          type="button"
          aria-label={isZh ? "關閉選單" : "Close menu"}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(16rem,85vw)] shrink-0 flex-col border-r backdrop-blur-md transition-transform duration-300 ease-out md:static md:z-auto md:w-60 md:translate-x-0 ${chrome(dark)} ${
          navOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className={`border-b p-4 ${chromeBorder(dark)}`}>
          <div className="mb-3 flex items-center justify-between md:block">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label={isZh ? "關閉選單" : "Close menu"}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-700 md:hidden ${chromeText(dark)}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`mb-3 flex items-center gap-1 text-xs transition-colors hover:text-white ${chromeText(dark)}`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {isZh ? "登出" : "Sign out"}
          </button>
          <VitalLinkLogo
            locale={locale}
            size="sm"
            dark={dark}
            subtitle={roleLabel}
            textClassName="text-white"
            subtitleClassName={chromeText(dark)}
          />
        </div>

        <div className={`border-b p-3 ${chromeBorder(dark)}`}>
          <div className={`rounded-lg p-3 ${dark ? "bg-slate-800/60" : "bg-slate-700/60"}`}>
            <p className="font-display text-sm font-semibold leading-tight text-white">
              {isZh ? patient.nameZh : patient.name}
            </p>
            <p className={`mt-0.5 text-[11px] ${chromeText(dark)}`}>
              {isCaretaker ? (isZh ? "照顧中" : "Caring for") : (isZh ? "本人" : "Self")} · {patient.age} {patient.sex}
            </p>
            {isCaretaker && (
              <p className={`mt-1 text-[10px] ${chromeText(dark)}`}>{authUser.name}</p>
            )}
          </div>
        </div>

        <ScrollableArea locale={locale} wrapperClassName="flex-1 min-h-0" className="space-y-0.5 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectSection(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-clinical px-3 py-2.5 text-sm font-medium transition-colors ${
                section === item.id
                  ? "bg-cocare-600 text-white shadow-clinical"
                  : `${chromeText(dark)} hover:bg-slate-700`
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{isZh ? item.label.zh : item.label.en}</span>
              {item.id === "tasks" && openTaskCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {openTaskCount}
                </span>
              )}
            </button>
          ))}
        </ScrollableArea>
      </aside>

      <div className="flex min-w-0 w-full flex-1 flex-col overflow-hidden">
        {isCaretaker && patient.padsId && (
          <CaretakerEmergencyBanner
            padsId={patient.padsId}
            patientName={isZh ? patient.nameZh : patient.name}
            locale={locale}
          />
        )}

        <header className={`flex shrink-0 items-center justify-between gap-2 border-b px-2 py-2 backdrop-blur-md sm:px-3 md:px-4 ${chrome(dark)}`}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-expanded={navOpen}
              aria-label={isZh ? "開啟選單" : "Open menu"}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-clinical border transition-colors md:hidden ${
                dark
                  ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  : "border-slate-600/60 bg-slate-700/80 text-white hover:bg-slate-600"
              }`}
            >
              <Menu className="h-5 w-5" />
            </button>
            {currentNavItem && (
              <div className="flex min-w-0 items-center gap-1.5 md:hidden">
                <currentNavItem.icon className="h-4 w-4 shrink-0 text-cocare-400" />
                <span className="truncate text-sm font-medium text-white">
                  {isZh ? currentNavItem.label.zh : currentNavItem.label.en}
                </span>
              </div>
            )}
            <Badge
              variant="outline"
              className={`hidden sm:inline-flex ${dark ? "" : "!border-slate-600 !bg-slate-700/50 !text-slate-200"}`}
            >
              PADS: {ehealthLabel}
            </Badge>
            <Badge
              variant="outline"
              className={`hidden lg:inline-flex ${dark ? "" : "!border-slate-600 !text-slate-200 !bg-slate-700/50"}`}
            >
              {isZh ? "不作臨床診斷" : "Not for clinical diagnosis"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className={`gap-1.5 ${dark ? "" : "!border-slate-600 !text-slate-200 !bg-slate-700/50 hover:!bg-slate-600/50"}`}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isZh ? "分享護理計劃" : "Share care plan"}</span>
            </Button>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} locale={locale} onLocaleToggle={onToggleLocale} onDarkHeader />
          </div>
        </header>

        <main
          className={`flex min-h-0 flex-1 flex-col overflow-hidden md:p-3 ${
            section === "healthTalk" ? "p-0 sm:p-1" : "p-1 sm:p-2"
          }`}
        >
          <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col max-md:max-w-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${patient.id}-${section}`}
                className="flex h-full min-h-0 flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {section === "overview" && (
                  <PatientOverviewTab
                    patient={patient}
                    locale={locale}
                    greetingName={isCaretaker ? (isZh ? patient.nameZh : patient.name) : undefined}
                  />
                )}
                {section === "healthTalk" && <HealthChatTab patient={patient} locale={locale} />}
                {section === "tasks" && (
                  <PatientTasksTab
                    patient={patient}
                    locale={locale}
                    canEditChecklist
                    onChecklistChange={
                      onChecklistChange
                        ? (items) => onChecklistChange(patient.id, items)
                        : undefined
                    }
                  />
                )}
                {section === "medicine" && (
                  <PatientMedicineTab patient={patient} locale={locale} prescription={prescription} />
                )}
                {section === "appointments" && (
                  <PatientAppointmentsTab patient={patient} locale={locale} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {showShareModal && <ShareCarePlanModal patient={patient} locale={locale} onClose={onCloseShare} />}
    </div>
  );
}
