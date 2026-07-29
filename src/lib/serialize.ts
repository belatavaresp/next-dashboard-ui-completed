import type {
  ClassRef,
  PublicActivity,
  PublicClass,
  PublicUser,
  Role,
  Status,
} from "@/lib/types";
import { normalizeDriveImageLink } from "@/lib/links";

type WithId = { _id: unknown };

function idOf(doc: WithId) {
  return String(doc._id);
}

function isPopulatedClass(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "name" in value;
}

export function toClassRef(value: unknown): ClassRef | null {
  if (!isPopulatedClass(value)) return null;
  return {
    id: String(value._id),
    name: String(value.name),
    grade: String(value.grade ?? ""),
    institution: String(value.institution ?? ""),
    status: (value.status as Status) ?? "active",
  };
}

function toClassRefs(values: unknown): ClassRef[] {
  if (!Array.isArray(values)) return [];
  return values
    .map(toClassRef)
    .filter((ref): ref is ClassRef => ref !== null);
}

export function serializeUser(doc: WithId & Record<string, unknown>): PublicUser {
  return {
    id: idOf(doc),
    name: String(doc.name ?? ""),
    lastName: String(doc.lastName ?? ""),
    username: String(doc.username ?? ""),
    role: doc.role as Role,
    status: (doc.status as Status) ?? "active",
    classes: toClassRefs(doc.classes),
  };
}

export function serializeClass(
  doc: WithId & Record<string, unknown>,
  extra: { users?: PublicUser[]; activities?: PublicActivity[] } = {}
): PublicClass {
  return {
    id: idOf(doc),
    name: String(doc.name ?? ""),
    grade: String(doc.grade ?? ""),
    institution: String(doc.institution ?? ""),
    status: (doc.status as Status) ?? "active",
    ...extra,
  };
}

/**
 * Students must never receive teacher support content, so the field is dropped
 * here rather than hidden in the UI.
 */
export function serializeActivity(
  doc: WithId & Record<string, unknown>,
  { includeTeacherContent = false }: { includeTeacherContent?: boolean } = {}
): PublicActivity {
  const activity: PublicActivity = {
    id: idOf(doc),
    name: String(doc.name ?? ""),
    // Normalized on read as well as on save, so covers stored before the Drive
    // proxy existed still render.
    cover: normalizeDriveImageLink(String(doc.cover ?? "")),
    guide: doc.guide ? String(doc.guide) : undefined,
    activityBook: doc.activityBook ? String(doc.activityBook) : undefined,
    extra: doc.extra ? String(doc.extra) : undefined,
    classes: toClassRefs(doc.classes),
  };

  if (typeof doc.legacyId === "number") activity.legacyId = doc.legacyId;
  if (includeTeacherContent && doc.teacherGuide) {
    activity.teacherGuide = String(doc.teacherGuide);
  }

  return activity;
}
