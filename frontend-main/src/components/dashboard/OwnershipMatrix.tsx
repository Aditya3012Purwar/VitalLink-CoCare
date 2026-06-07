import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { layerColors } from "@/lib/utils";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface OwnershipMatrixProps {
  patient: Patient;
  locale: Locale;
}

const statusStyles = {
  active: "border-cocare-300 bg-cocare-50/50 dark:border-cocare-700 dark:bg-cocare-950/20",
  gap: "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20",
  handoff: "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
};

export function OwnershipMatrix({ patient, locale }: OwnershipMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cocare-600" />
          <CardTitle>{t(ui.sections.ownership, locale)}</CardTitle>
        </div>
        <p className="mt-1 text-sm text-slate-muted dark:text-slate-400">
          {locale === "zh"
            ? "使碎片化可見，並明確各層責任歸屬"
            : "Make fragmentation visible — then resolve ownership"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patient.ownership.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-clinical border-2 p-4 ${statusStyles[item.status]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {locale === "zh" ? item.domainZh : item.domain}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${layerColors[item.layer]}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-2 font-display text-base font-medium text-cocare-800 dark:text-cocare-300">
                {locale === "zh" ? item.ownerZh : item.owner}
              </p>
              <p className="mt-2 text-xs text-slate-muted dark:text-slate-400">
                {locale === "zh" ? item.noteZh : item.note}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
