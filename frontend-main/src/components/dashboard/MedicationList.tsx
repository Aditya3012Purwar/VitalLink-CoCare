import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Pill } from "lucide-react";
import { ui, t } from "@/lib/i18n";
import type { Locale, Patient } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface MedicationListProps {
  patient: Patient;
  locale: Locale;
}

export function MedicationList({ patient, locale }: MedicationListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-cocare-600" />
          <CardTitle>{t(ui.sections.medications, locale)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patient.medications.map((med) => (
          <div
            key={med.id}
            className="rounded-clinical border border-slate-100 p-3 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{med.name}</p>
                <p className="text-sm text-slate-muted dark:text-slate-400">
                  {med.dose} · {med.frequency}
                </p>
                <p className="mt-1 text-xs text-slate-muted">{med.prescriber}</p>
              </div>
              <AdherenceBar value={med.adherence} />
            </div>
            {med.flag && (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                ⚠ {med.flag}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdherenceBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "bg-cocare-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="text-right">
      <p className="text-xs font-medium text-slate-muted">{value}%</p>
      <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface VitalsMiniChartProps {
  patient: Patient;
  locale: Locale;
}

export function VitalsMiniChart({ patient, locale }: VitalsMiniChartProps) {
  if (patient.vitals.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {patient.vitals.map((vital) => (
        <Card key={vital.label}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {locale === "zh" ? vital.labelZh : vital.label}
            </p>
            <div className="mt-2 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vital.values}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={32} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  {vital.target && (
                    <ReferenceLine
                      y={vital.target}
                      stroke="#2f9488"
                      strokeDasharray="4 4"
                      label={{ value: "Target", fontSize: 10, fill: "#2f9488" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      vital.status === "critical"
                        ? "#e11d48"
                        : vital.status === "elevated"
                          ? "#d97706"
                          : "#2f9488"
                    }
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-muted">
              {vital.unit} ·{" "}
              <span
                className={
                  vital.status === "critical"
                    ? "text-rose-600"
                    : vital.status === "elevated"
                      ? "text-amber-600"
                      : "text-cocare-600"
                }
              >
                {vital.status}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
