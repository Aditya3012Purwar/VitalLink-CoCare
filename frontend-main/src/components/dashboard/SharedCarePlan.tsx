import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { formatDate, layerColors, statusColors } from "@/lib/utils";
import {
  canEditCarePlanItem,
  canManageCarePlan,
  carePlanAuthorName,
  newCarePlanItemId,
  resolveDoctorAuthorId,
} from "@/lib/carePlanAuth";
import type { AuthUser } from "@/types/auth";
import type { CarePlanItem, CareLayer, Locale, Patient, TaskStatus } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CARE_PLAN_SECTIONS = ["medication", "follow_up"] as const;
type CarePlanSection = (typeof CARE_PLAN_SECTIONS)[number];

const sectionLabels: Record<CarePlanSection, { en: string; zh: string }> = {
  medication: { en: "Medication plan", zh: "用藥計劃" },
  follow_up: { en: "Follow-ups", zh: "覆診安排" },
};

const statusOptions: TaskStatus[] = ["overdue", "due_soon", "scheduled", "completed"];

interface SharedCarePlanProps {
  patient: Patient;
  locale: Locale;
  currentUser?: AuthUser | null;
  onUpdate?: (item: CarePlanItem) => void;
  onDelete?: (id: string) => void;
  onAdd?: (item: CarePlanItem) => void;
}

export function SharedCarePlan({
  patient,
  locale,
  currentUser,
  onUpdate,
  onDelete,
  onAdd,
}: SharedCarePlanProps) {
  const isZh = locale === "zh";
  const isDoctor = canManageCarePlan(currentUser);
  const [expanded, setExpanded] = useState<CarePlanSection>("medication");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const visibleSections = CARE_PLAN_SECTIONS.filter((sec) =>
    patient.carePlan.some((c) => c.section === sec)
  );
  const activeSection: CarePlanSection = visibleSections.includes(expanded)
    ? expanded
    : visibleSections[0] ?? "medication";

  const canEdit = (item: CarePlanItem) =>
    isDoctor && currentUser != null && canEditCarePlanItem(item, currentUser);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{isZh ? "護理計劃" : "Care plan"}</CardTitle>
        {isDoctor && currentUser && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {isZh ? "新增項目" : "Add item"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {adding && isDoctor && currentUser && (
          <div className="mb-4">
            <CarePlanAddForm
              patient={patient}
              locale={locale}
              doctor={currentUser}
              defaultSection={activeSection}
              onCancel={() => setAdding(false)}
              onSave={(item) => {
                onAdd?.(item);
                setAdding(false);
                setExpanded(item.section as CarePlanSection);
              }}
            />
          </div>
        )}

        {visibleSections.length === 0 && !adding ? (
          <p className="text-sm text-slate-muted">
            {isZh ? "暫無護理計劃項目。" : "No care plan items yet."}
            {isDoctor && (isZh ? " 使用「新增項目」建立計劃。" : " Use Add item to create one.")}
          </p>
        ) : visibleSections.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              {visibleSections.map((sec) => {
                const count = patient.carePlan.filter((c) => c.section === sec).length;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setExpanded(sec);
                      setEditingId(null);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeSection === sec
                        ? "bg-cocare-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isZh ? sectionLabels[sec].zh : sectionLabels[sec].en} ({count})
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 space-y-3"
              >
                {patient.carePlan
                  .filter((c) => c.section === activeSection)
                  .map((item) => (
                    <CarePlanRow
                      key={item.id}
                      item={item}
                      locale={locale}
                      isDoctor={isDoctor}
                      canEdit={canEdit(item)}
                      isEditing={editingId === item.id}
                      onEdit={() => setEditingId(item.id)}
                      onCancel={() => setEditingId(null)}
                      onSave={(updated) => {
                        onUpdate?.(updated);
                        setEditingId(null);
                      }}
                      onDelete={() => {
                        const label = isZh ? item.actionZh : item.action;
                        const confirmed = window.confirm(
                          isZh ? `確定刪除「${label}」？` : `Delete "${label}" from the care plan?`
                        );
                        if (confirmed) {
                          onDelete?.(item.id);
                          if (editingId === item.id) setEditingId(null);
                        }
                      }}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface CarePlanRowProps {
  item: CarePlanItem;
  locale: Locale;
  isDoctor: boolean;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (item: CarePlanItem) => void;
  onDelete: () => void;
}

function CarePlanRow({
  item,
  locale,
  isDoctor,
  canEdit,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: CarePlanRowProps) {
  const isZh = locale === "zh";

  if (isEditing) {
    return <CarePlanEditForm item={item} locale={locale} onCancel={onCancel} onSave={onSave} />;
  }

  return (
    <div className="rounded-clinical border border-slate-100 p-4 transition-shadow hover:shadow-clinical dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-slate-900 dark:text-white">
          {isZh ? item.actionZh : item.action}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className={`text-xs font-medium capitalize ${statusColors[item.status]}`}>
            {item.status.replace("_", " ")}
          </span>
          {canEdit ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cocare-600 dark:hover:bg-slate-800 dark:hover:text-cocare-400"
                title={isZh ? "更新" : "Update"}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                title={isZh ? "刪除" : "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : isDoctor ? (
            <span
              className="inline-flex max-w-[14rem] items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              title={
                carePlanAuthorName(item)
                  ? isZh
                    ? `僅 ${carePlanAuthorName(item)} 可編輯`
                    : `Only ${carePlanAuthorName(item)} can edit`
                  : isZh
                    ? "僅作者可編輯"
                    : "Only the author can edit"
              }
            >
              <Lock className="h-3 w-3 shrink-0" />
              {carePlanAuthorName(item)
                ? isZh
                  ? `${carePlanAuthorName(item)} 撰寫`
                  : `By ${carePlanAuthorName(item)}`
                : isZh
                  ? "僅作者"
                  : "Author only"}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <span className="text-xs text-slate-muted dark:text-slate-500">
            {isZh ? "負責" : "Owner"}
          </span>
          <p className="flex items-center gap-2">
            {isZh ? item.ownerZh : item.owner}
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${layerColors[item.ownerLayer]}`}>
              {item.ownerLayer.replace("_", " ")}
            </span>
          </p>
        </div>
        {item.dueDate && (
          <div>
            <span className="text-xs text-slate-muted dark:text-slate-500">
              {isZh ? "到期" : "Due"}
            </span>
            <p>{formatDate(item.dueDate, locale)}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-muted dark:text-slate-400">
        {isZh ? item.rationaleZh : item.rationale}
      </p>
      {carePlanAuthorName(item) && (
        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
          {isZh ? "作者：" : "Authored by "}
          {carePlanAuthorName(item)}
        </p>
      )}
    </div>
  );
}

function CarePlanAddForm({
  patient,
  locale,
  doctor,
  defaultSection,
  onCancel,
  onSave,
}: {
  patient: Patient;
  locale: Locale;
  doctor: AuthUser;
  defaultSection: CarePlanSection;
  onCancel: () => void;
  onSave: (item: CarePlanItem) => void;
}) {
  const isZh = locale === "zh";
  const [draft, setDraft] = useState({
    section: defaultSection,
    action: "",
    actionZh: "",
    owner: doctor.name,
    ownerZh: doctor.name,
    ownerLayer: "specialist" as CareLayer,
    dueDate: "",
    status: "scheduled" as TaskStatus,
    rationale: "",
    rationaleZh: "",
  });

  const handleSave = () => {
    const action = draft.action.trim();
    if (!action) return;
    const item: CarePlanItem = {
      id: newCarePlanItemId(patient.id),
      section: draft.section,
      action,
      actionZh: draft.actionZh.trim() || action,
      owner: draft.owner.trim() || doctor.name,
      ownerZh: draft.ownerZh.trim() || doctor.name,
      ownerLayer: draft.ownerLayer,
      dueDate: draft.dueDate || undefined,
      status: draft.status,
      rationale: draft.rationale.trim() || (isZh ? "醫生新增護理計劃" : "Added by treating physician"),
      rationaleZh: draft.rationaleZh.trim() || "醫生新增護理計劃",
      authoredBy: resolveDoctorAuthorId(doctor),
      authoredByName: doctor.name,
      createdAt: new Date().toISOString(),
    };
    onSave(item);
  };

  return (
    <div className="rounded-clinical border-2 border-cocare-300 bg-cocare-50/30 p-4 dark:border-cocare-700 dark:bg-cocare-950/20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cocare-700 dark:text-cocare-400">
        {isZh ? "新增護理計劃" : "Add care plan item"}
      </p>
      <p className="mb-3 text-xs text-slate-muted">
        {isZh
          ? `將以您的名義記錄（${doctor.name}），僅您可編輯或刪除。`
          : `Recorded under your authorship (${doctor.name}) — only you can edit or delete.`}
      </p>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "類別" : "Section"}</span>
          <select
            value={draft.section}
            onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value as CarePlanSection }))}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {CARE_PLAN_SECTIONS.map((s) => (
              <option key={s} value={s}>
                {isZh ? sectionLabels[s].zh : sectionLabels[s].en}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "行動" : "Action"}</span>
          <input
            type="text"
            value={isZh ? draft.actionZh : draft.action}
            onChange={(e) => {
              const v = e.target.value;
              setDraft((d) => (isZh ? { ...d, actionZh: v } : { ...d, action: v }));
            }}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "負責人" : "Owner"}</span>
          <input
            type="text"
            value={isZh ? draft.ownerZh : draft.owner}
            onChange={(e) => {
              const v = e.target.value;
              setDraft((d) => (isZh ? { ...d, ownerZh: v } : { ...d, owner: v }));
            }}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs text-slate-muted">{isZh ? "到期日" : "Due date"}</span>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
              className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-slate-muted">{isZh ? "狀態" : "Status"}</span>
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))}
              className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "理據" : "Rationale"}</span>
          <textarea
            value={isZh ? draft.rationaleZh : draft.rationale}
            onChange={(e) => {
              const v = e.target.value;
              setDraft((d) => (isZh ? { ...d, rationaleZh: v } : { ...d, rationale: v }));
            }}
            rows={2}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {isZh ? "取消" : "Cancel"}
        </Button>
        <Button type="button" size="sm" onClick={handleSave} className="gap-1">
          <Check className="h-3.5 w-3.5" />
          {isZh ? "新增" : "Add"}
        </Button>
      </div>
    </div>
  );
}

function CarePlanEditForm({
  item,
  locale,
  onCancel,
  onSave,
}: {
  item: CarePlanItem;
  locale: Locale;
  onCancel: () => void;
  onSave: (item: CarePlanItem) => void;
}) {
  const isZh = locale === "zh";
  const [draft, setDraft] = useState<CarePlanItem>({ ...item });

  const update = <K extends keyof CarePlanItem>(key: K, value: CarePlanItem[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-clinical border-2 border-cocare-300 bg-cocare-50/30 p-4 dark:border-cocare-700 dark:bg-cocare-950/20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cocare-700 dark:text-cocare-400">
        {isZh ? "更新護理計劃" : "Update care plan item"}
      </p>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "行動" : "Action"}</span>
          <input
            type="text"
            value={isZh ? draft.actionZh : draft.action}
            onChange={(e) => {
              const v = e.target.value;
              if (isZh) update("actionZh", v);
              else update("action", v);
            }}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "負責人" : "Owner"}</span>
          <input
            type="text"
            value={isZh ? draft.ownerZh : draft.owner}
            onChange={(e) => {
              const v = e.target.value;
              if (isZh) update("ownerZh", v);
              else update("owner", v);
            }}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs text-slate-muted">{isZh ? "到期日" : "Due date"}</span>
            <input
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(e) => update("dueDate", e.target.value || undefined)}
              className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-slate-muted">{isZh ? "狀態" : "Status"}</span>
            <select
              value={draft.status}
              onChange={(e) => update("status", e.target.value as TaskStatus)}
              className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-xs text-slate-muted">{isZh ? "理據" : "Rationale"}</span>
          <textarea
            value={isZh ? draft.rationaleZh : draft.rationale}
            onChange={(e) => {
              const v = e.target.value;
              if (isZh) update("rationaleZh", v);
              else update("rationale", v);
            }}
            rows={2}
            className="mt-1 w-full rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {isZh ? "取消" : "Cancel"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              ...draft,
              authoredBy: item.authoredBy,
              authoredByName: item.authoredByName,
            })
          }
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          {isZh ? "儲存" : "Save"}
        </Button>
      </div>
    </div>
  );
}
