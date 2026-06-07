import { useState } from "react";
import { Check, CheckCircle2, Circle, Pencil, Plus, Trash2, X } from "lucide-react";
import { lt } from "@/lib/i18n";
import type { Locale } from "@/types/patient";
import type { PatientChecklistItem } from "@/types/roles";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScrollableArea } from "@/components/ui/ScrollableArea";
import { Button } from "@/components/ui/Button";

interface Props {
  items: PatientChecklistItem[];
  locale: Locale;
  editable?: boolean;
  compact?: boolean;
  onChange?: (items: PatientChecklistItem[]) => void;
}

function newItemId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PatientChecklist({ items, locale, editable = false, compact = false, onChange }: Props) {
  const zh = locale === "zh";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const toggleDone = (id: string) => {
    if (!editable || !onChange) return;
    onChange(items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const updateItem = (id: string, patch: Partial<PatientChecklistItem>) => {
    onChange?.(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteItem = (id: string) => {
    onChange?.(items.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addItem = (draft: { en: string; zh: string; priority: "high" | "normal" }) => {
    const en = draft.en.trim();
    const zhLabel = draft.zh.trim();
    if (!en && !zhLabel) return;
    onChange?.([
      ...items,
      {
        id: newItemId(),
        label: { en: en || zhLabel, zh: zhLabel || en },
        done: false,
        priority: draft.priority,
      },
    ]);
    setAdding(false);
  };

  return (
    <Card className={`flex min-h-0 flex-col overflow-hidden border-cocare-200/40 ${compact ? "" : ""}`}>
      <CardHeader className={`flex shrink-0 flex-row flex-wrap items-center justify-between gap-2 ${compact ? "border-b py-2 px-3" : ""}`}>
        <CardTitle className={compact ? "text-sm" : "text-xl"}>
          {zh ? "今日護理清單" : "Today’s care checklist"}
        </CardTitle>
        {editable && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={`gap-1 ${compact ? "h-7 text-[10px]" : ""}`}
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
          >
            <Plus className="h-3 w-3" />
            {zh ? "新增" : "Add"}
          </Button>
        )}
      </CardHeader>
      <ScrollableArea
        locale={locale}
        className={`min-h-0 flex-1 ${compact ? "space-y-1 p-2" : "space-y-3 p-4 md:p-5"}`}
      >
        {adding && editable && (
          <ChecklistForm
            locale={locale}
            onCancel={() => setAdding(false)}
            onSave={addItem}
          />
        )}

        {items.length === 0 && !adding ? (
          <p className={`text-slate-muted ${compact ? "text-xs" : "text-sm"}`}>
            {zh ? "暫無清單項目 — 按「新增項目」開始。" : "No checklist items yet — tap Add item to start."}
          </p>
        ) : (
          items.map((item) =>
            editingId === item.id && editable ? (
              <ChecklistForm
                key={item.id}
                locale={locale}
                initial={item}
                onCancel={() => setEditingId(null)}
                onSave={(draft) => {
                  updateItem(item.id, {
                    label: { en: draft.en.trim() || draft.zh.trim(), zh: draft.zh.trim() || draft.en.trim() },
                    priority: draft.priority,
                  });
                  setEditingId(null);
                }}
              />
            ) : (
              <div
                key={item.id}
                className={`flex items-start gap-2 rounded-clinical border transition-colors ${
                  compact ? "p-1.5" : "gap-3 p-4"
                } ${
                  item.done
                    ? "border-cocare-200 bg-cocare-50/50 dark:border-cocare-800 dark:bg-cocare-950/20"
                    : item.priority === "high"
                      ? "border-amber-200 bg-amber-50/30 dark:border-amber-900"
                      : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDone(item.id)}
                  disabled={!editable}
                  className={`shrink-0 ${editable ? "cursor-pointer" : "cursor-default"} ${compact ? "" : "mt-0.5"}`}
                  aria-label={item.done ? (zh ? "標記未完成" : "Mark incomplete") : zh ? "標記完成" : "Mark complete"}
                >
                  {item.done ? (
                    <CheckCircle2 className={`text-cocare-600 ${compact ? "h-4 w-4" : "h-6 w-6"}`} />
                  ) : (
                    <Circle className={`${compact ? "h-4 w-4" : "h-6 w-6"} ${editable ? "text-slate-400 hover:text-cocare-600" : "text-slate-400"}`} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium leading-snug ${
                      compact ? "text-xs" : "text-base"
                    } ${
                      item.done
                        ? "text-slate-muted line-through dark:text-slate-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {lt(item.label, locale)}
                  </p>
                  {item.priority === "high" && !item.done && (
                    <span className={`inline-block font-medium text-amber-700 dark:text-amber-400 ${compact ? "text-[9px]" : "mt-1 text-xs"}`}>
                      {zh ? "優先" : "Priority"}
                    </span>
                  )}
                </div>

                {editable && !compact && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setAdding(false);
                      }}
                      className="rounded-lg p-1.5 text-slate-muted hover:bg-slate-100 hover:text-cocare-700 dark:hover:bg-slate-800"
                      aria-label={zh ? "編輯" : "Edit"}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg p-1.5 text-slate-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      aria-label={zh ? "刪除" : "Delete"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          )
        )}
      </ScrollableArea>
    </Card>
  );
}

function ChecklistForm({
  locale,
  initial,
  onCancel,
  onSave,
}: {
  locale: Locale;
  initial?: PatientChecklistItem;
  onCancel: () => void;
  onSave: (draft: { en: string; zh: string; priority: "high" | "normal" }) => void;
}) {
  const zh = locale === "zh";
  const [en, setEn] = useState(initial?.label.en ?? "");
  const [zhLabel, setZhLabel] = useState(initial?.label.zh ?? "");
  const [priority, setPriority] = useState<"high" | "normal">(initial?.priority ?? "normal");

  return (
    <div className="rounded-clinical border border-cocare-200 bg-cocare-50/40 p-4 dark:border-cocare-800 dark:bg-cocare-950/20">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-muted">
            {zh ? "項目（英文）" : "Item (English)"}
          </label>
          <input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            className="w-full rounded-clinical border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            placeholder={zh ? "例如：按時服藥" : "e.g. Take morning medicines"}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-muted">
            {zh ? "項目（中文）" : "Item (Chinese)"}
          </label>
          <input
            value={zhLabel}
            onChange={(e) => setZhLabel(e.target.value)}
            className="w-full rounded-clinical border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            placeholder={zh ? "例如：服用早上藥物" : "e.g. 服用早上藥物"}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-muted">
            {zh ? "優先級" : "Priority"}
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "high" | "normal")}
            className="w-full rounded-clinical border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="normal">{zh ? "一般" : "Normal"}</option>
            <option value="high">{zh ? "優先" : "High priority"}</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {zh ? "取消" : "Cancel"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => onSave({ en, zh: zhLabel, priority })}
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          {zh ? "儲存" : "Save"}
        </Button>
      </div>
    </div>
  );
}
