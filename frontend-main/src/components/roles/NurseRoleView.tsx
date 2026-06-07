import { motion } from "framer-motion";
import { AlertCircle, Heart, Phone, Users } from "lucide-react";
import { getRoleExtensions } from "@/data/roleExtensions";
import { lt } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SmartwatchDashboard } from "@/components/parkinson/SmartwatchDashboard";
import { Badge } from "@/components/ui/Badge";

interface RoleViewProps {
  patient: Patient;
  locale: Locale;
}

export function NurseRoleView({ patient, locale }: RoleViewProps) {
  const ext = getRoleExtensions(patient.id);

  return (
    <div className="space-y-6">
      <div className="rounded-clinical border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="font-display text-lg font-semibold text-amber-900 dark:text-amber-200">
          {locale === "zh" ? "帕金森照顧者工作台" : "Parkinson's caretaker desk"}
        </p>
        <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
          {patient.dhcCluster}
        </p>
      </div>

      {patient.padsId && (
        <SmartwatchDashboard patient={patient} locale={locale} audience="caretaker" />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-cocare-600" />
            <CardTitle>{locale === "zh" ? "跟進隊列" : "Follow-up queue"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ext.nurseQueue.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center justify-between gap-3 rounded-clinical border p-4 ${
                item.priority === "urgent"
                  ? "border-rose-200 bg-rose-50/40 dark:border-rose-900"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{lt(item.task, locale)}</p>
                {item.dueDate && (
                  <p className="mt-1 text-xs text-slate-muted">{formatDate(item.dueDate, locale)}</p>
                )}
              </div>
              <Badge variant={item.priority === "urgent" ? "risk-high" : "outline"}>
                {item.priority}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "zh" ? "自我管理狀態" : "Self-management status"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ext.selfManagement.map((sm) => (
              <div
                key={sm.id}
                className={`rounded-clinical border p-4 ${
                  sm.status === "poor"
                    ? "border-rose-200 dark:border-rose-900"
                    : sm.status === "warning"
                      ? "border-amber-200 dark:border-amber-900"
                      : "border-cocare-200 dark:border-cocare-800"
                }`}
              >
                <p className="text-sm text-slate-muted">{lt(sm.label, locale)}</p>
                <p className="mt-1 font-display text-xl font-semibold">{sm.value}</p>
                <p className="mt-2 text-xs text-slate-muted">{lt(sm.detail, locale)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "護理障礙" : "Care barriers"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ext.careBarriers.map((b) => (
              <div key={b.id} className="rounded-clinical bg-slate-50 p-4 dark:bg-slate-800/40">
                <p className="font-medium">{lt(b.barrier, locale)}</p>
                <p className="mt-1 text-sm text-slate-muted">{lt(b.impact, locale)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-cocare-600" />
              <CardTitle>{locale === "zh" ? "輔導計劃" : "Coaching plan"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {ext.coachingPlan.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between rounded-clinical border p-3 dark:border-slate-700">
                <p className="text-sm font-medium">{lt(ch.goal, locale)}</p>
                <Badge variant="outline" className="capitalize">{ch.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-200/60 dark:border-rose-900/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <CardTitle>{locale === "zh" ? "護士外展紅旗" : "Red flags for nurse outreach"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ext.nurseRedFlags.map((flag, i) => (
            <p key={i} className="rounded-lg bg-rose-50/50 px-3 py-2 text-sm dark:bg-rose-950/30">
              • {lt(flag, locale)}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cocare-600" />
            <CardTitle>{locale === "zh" ? "社區 / 地區康健中心統籌" : "Community / DHC coordination"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              locale === "zh" ? "專職轉介" : "Allied health referral",
              locale === "zh" ? "護士診所" : "Nurse clinic",
              locale === "zh" ? "營養 / 物理治療" : "Dietetics / physio",
              locale === "zh" ? "視光 / 篩查" : "Optometry / screening",
            ].map((s) => (
              <Badge key={s} variant="outline">{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-cocare-50/30 dark:bg-cocare-950/20">
        <CardHeader>
          <CardTitle>{locale === "zh" ? "外展紀錄摘要" : "Call note / outreach summary"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-muted">
            {locale === "zh" ? "最近聯絡" : "Last contact"}: {formatDate(ext.nurseOutreach.lastContact, locale)}
          </p>
          <p className="mt-3 text-sm leading-relaxed">{lt(ext.nurseOutreach.summary, locale)}</p>
          <p className="mt-3 text-sm font-medium text-cocare-700 dark:text-cocare-400">
            {locale === "zh" ? "下一步" : "Next step"}: {lt(ext.nurseOutreach.nextStep, locale)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
