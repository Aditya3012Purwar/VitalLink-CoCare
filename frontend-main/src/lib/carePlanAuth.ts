import type { AuthUser } from "@/types/auth";
import type { CarePlanItem } from "@/types/patient";

const DOCTOR_NAME_TO_ID: Record<string, string> = {
  "Dr. Sarah Müller": "doc-mueller",
  "Dr. James Chen": "doc-chen",
};

function normalizeName(name: string | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

export function namesMatch(a: string | undefined, b: string | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

/** Name shown on the care plan that identifies the author (not task owner). */
export function carePlanAuthorName(item: CarePlanItem): string {
  return item.authoredByName?.trim() ?? "";
}

/** True when the logged-in doctor's name matches the plan author's name. */
export function isCarePlanAuthor(item: CarePlanItem, user: AuthUser): boolean {
  const authorName = carePlanAuthorName(item);
  if (!authorName) return false;
  if (namesMatch(authorName, user.name)) return true;
  if (user.id && item.authoredBy && user.id === item.authoredBy) return true;
  return false;
}

/** Resolve stable author id when saving new items (metadata only). */
export function resolveDoctorAuthorId(doctor: AuthUser): string {
  if (doctor.id.startsWith("doc-")) return doctor.id;
  return DOCTOR_NAME_TO_ID[doctor.name] ?? doctor.id;
}

export function canManageCarePlan(user: AuthUser | null | undefined): boolean {
  return user?.role === "doctor";
}

export function canEditCarePlanItem(item: CarePlanItem, user: AuthUser): boolean {
  if (!canManageCarePlan(user)) return false;
  return isCarePlanAuthor(item, user);
}

export function doctorIdForName(name: string): string {
  return DOCTOR_NAME_TO_ID[name] ?? name;
}

export function newCarePlanItemId(patientId: string): string {
  return `${patientId}-cp-${Date.now()}`;
}
