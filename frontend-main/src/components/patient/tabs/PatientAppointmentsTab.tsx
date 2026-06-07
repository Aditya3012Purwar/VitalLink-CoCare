import { Calendar, Phone, Users } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface Props {
  patient: Patient;
  locale: Locale;
}

export function PatientAppointmentsTab({ patient, locale }: Props) {
  const ext = getRoleExtensions(patient.id);
  const isZh = locale === "zh";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          {isZh ? "我的預約" : "My appointments"}
        </h2>
        <p className="text-xs text-slate-muted">
          {isZh ? "護理團隊及即將預約" : "Care team & upcoming visits"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cocare-600" />
              <CardTitle className="text-sm">{isZh ? "我的護理團隊" : "My care team"}</CardTitle>
            </div>
          </CardHeader>
          <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-1.5 p-2">
            <div className="rounded-clinical border border-cocare-200/60 bg-cocare-50/30 p-2 dark:border-cocare-900/40">
              <p className="text-xs font-medium">{patient.familyDoctor}</p>
              <p className="text-[10px] text-cocare-700 dark:text-cocare-400">
                {isZh ? "主治神經科醫生" : "Primary neurologist"}
              </p>
            </div>
            {ext.careTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-clinical border p-2 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{member.name}</p>
                  <p className="truncate text-[10px] text-cocare-700 dark:text-cocare-400">{lt(member.role, locale)}</p>
                </div>
                {member.contact && (
                  <a
                    href={`tel:${member.contact}`}
                    className="flex shrink-0 items-center gap-0.5 rounded-clinical border px-1.5 py-0.5 text-[10px] text-cocare-600 hover:bg-cocare-50"
                  >
                    <Phone className="h-3 w-3" />
                    {isZh ? "致電" : "Call"}
                  </a>
                )}
              </div>
            ))}
          </ScrollableArea>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b py-2 px-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cocare-600" />
              <CardTitle className="text-sm">{isZh ? "即將預約" : "Upcoming appointments"}</CardTitle>
            </div>
          </CardHeader>
          <ScrollableArea locale={locale} className="min-h-0 flex-1 space-y-1.5 p-2">
            {ext.appointments.map((ap) => (
              <div key={ap.id} className="rounded-clinical border p-2 dark:border-slate-700">
                <p className="text-[10px] font-medium text-cocare-700 dark:text-cocare-400">
                  {formatDate(ap.date, locale)}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                  {lt(ap.title, locale)}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-muted">
                  {lt(ap.location, locale)} · {ap.with}
                </p>
              </div>
            ))}
          </ScrollableArea>
        </Card>
      </div>
    </div>
  );
}
