import { useEffect, useState } from "react";
import { ClipboardPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { createPrescription, getMedicineCatalog } from "@/lib/api";
import type { Locale } from "@/types/patient";
import type { MedicineCatalogItem, Prescription } from "@/types/prescription";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface LineDraft {
  medicine_id: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string;
}

interface Props {
  padsId: string;
  doctorName: string;
  locale: Locale;
  onCreated: (rx: Prescription) => void;
}

export function PrescriptionForm({ padsId, doctorName, locale, onCreated }: Props) {
  const [catalog, setCatalog] = useState<MedicineCatalogItem[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMedicineCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const addLine = () => {
    const med = catalog[0];
    if (!med) return;
    setLines((l) => [
      ...l,
      {
        medicine_id: med.id,
        dose: med.default_dose,
        frequency: med.default_frequency,
        duration_days: 30,
        instructions: med.notes,
      },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<LineDraft>) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const next = { ...line, ...patch };
        if (patch.medicine_id) {
          const med = catalog.find((m) => m.id === patch.medicine_id);
          if (med) {
            next.dose = med.default_dose;
            next.frequency = med.default_frequency;
            next.instructions = med.notes;
          }
        }
        return next;
      })
    );
  };

  const submit = async () => {
    if (lines.length === 0) {
      setError(locale === "zh" ? "請至少添加一種藥物" : "Add at least one medicine");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rx = await createPrescription(padsId, doctorName, lines, notes);
      onCreated(rx);
      setLines([]);
      setNotes("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardPlus className="h-5 w-5 text-emerald-600" />
          <CardTitle>{locale === "zh" ? "開立處方" : "Issue prescription"}</CardTitle>
        </div>
        <p className="text-sm text-slate-muted">
          {locale === "zh"
            ? "分析完成後，從藥物目錄選擇並設定劑量與頻率。處方將更新至患者檔案並生成 QR 碼。"
            : "After analysis, select medicines from the catalog and set dose & frequency. Updates the patient profile and generates a QR code."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {lines.length === 0 ? (
          <p className="text-sm text-slate-muted">
            {locale === "zh" ? "尚未添加藥物 — 點擊下方按鈕開始" : "No medicines added yet — click below to start"}
          </p>
        ) : (
          lines.map((line, idx) => (
            <div key={idx} className="rounded-clinical border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <select
                  value={line.medicine_id}
                  onChange={(e) => updateLine(idx, { medicine_id: e.target.value })}
                  className="flex-1 rounded-clinical border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  {catalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setLines((l) => l.filter((_, i) => i !== idx))}
                  className="rounded p-1 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="text-xs">
                  <span className="text-slate-muted">{locale === "zh" ? "劑量" : "Dose"}</span>
                  <input
                    value={line.dose}
                    onChange={(e) => updateLine(idx, { dose: e.target.value })}
                    className="mt-1 w-full rounded-clinical border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="text-xs">
                  <span className="text-slate-muted">{locale === "zh" ? "頻率" : "Frequency"}</span>
                  <input
                    value={line.frequency}
                    onChange={(e) => updateLine(idx, { frequency: e.target.value })}
                    className="mt-1 w-full rounded-clinical border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="text-xs">
                  <span className="text-slate-muted">{locale === "zh" ? "天數" : "Days"}</span>
                  <input
                    type="number"
                    value={line.duration_days}
                    onChange={(e) => updateLine(idx, { duration_days: Number(e.target.value) })}
                    className="mt-1 w-full rounded-clinical border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs">
                <span className="text-slate-muted">{locale === "zh" ? "用藥指示" : "Instructions"}</span>
                <input
                  value={line.instructions}
                  onChange={(e) => updateLine(idx, { instructions: e.target.value })}
                  className="mt-1 w-full rounded-clinical border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
          ))
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={locale === "zh" ? "臨床備註（可選）" : "Clinical notes (optional)"}
          className="w-full rounded-clinical border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          rows={2}
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && (
          <p className="rounded-clinical border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
            {locale === "zh"
              ? "✓ 處方已保存。患者可在「患者」分頁查看 QR 碼並分享給藥劑師。"
              : "✓ Prescription saved. Patient can view the QR code in the Patient tab and share it with the chemist."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1" disabled={catalog.length === 0}>
            <Plus className="h-4 w-4" />
            {locale === "zh" ? "添加藥物" : "Add medicine"}
          </Button>
          <Button type="button" size="sm" onClick={submit} disabled={loading || lines.length === 0} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPlus className="h-4 w-4" />}
            {loading
              ? locale === "zh" ? "提交中…" : "Submitting…"
              : locale === "zh" ? "確認處方並生成 QR" : "Confirm & generate QR"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
