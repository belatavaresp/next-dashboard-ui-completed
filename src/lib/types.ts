export const ROLES = ["student", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["active", "inactive"] as const;
export type Status = (typeof STATUSES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Aluno",
  teacher: "Professor",
  admin: "Admin",
};

export const STATUS_LABELS: Record<Status, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

/** Legacy numeric roles used by the previous API and by the old JWT payloads. */
export const LEGACY_ROLE_MAP: Record<number, Role> = {
  0: "student",
  1: "teacher",
  2: "admin",
};

export type ClassRef = {
  id: string;
  name: string;
  grade: string;
  institution: string;
  status: Status;
};

export type PublicUser = {
  id: string;
  name: string;
  lastName: string;
  username: string;
  role: Role;
  status: Status;
  classes: ClassRef[];
};

export type PublicClass = {
  id: string;
  name: string;
  grade: string;
  institution: string;
  status: Status;
  users?: PublicUser[];
  activities?: PublicActivity[];
};

export type PublicActivity = {
  id: string;
  legacyId?: number;
  name: string;
  cover: string;
  guide?: string;
  activityBook?: string;
  extra?: string;
  /** Teacher support content: never serialized for students. */
  teacherGuide?: string;
  classes: ClassRef[];
};

/** Claims carried by the session JWT. */
export type SessionClaims = {
  sub: string;
  username: string;
  name: string;
  role: Role;
  /** Grade is included so middleware can resolve legacy /student-N URLs on the Edge. */
  classes: { id: string; grade: string }[];
};

export function displayName(user: { name: string; lastName?: string }) {
  return [user.name, user.lastName].filter(Boolean).join(" ");
}
