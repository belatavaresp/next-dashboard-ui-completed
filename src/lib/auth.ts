import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { Role, SessionClaims } from "@/lib/types";

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Guard for route handlers: every handler calls this before touching data.
 * Throws an HttpError that `handleRoute` turns into a JSON response.
 */
export async function requireRole(...roles: Role[]): Promise<SessionClaims> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Não autenticado");
  if (roles.length && !roles.includes(session.role)) {
    throw new HttpError(403, "Acesso negado");
  }
  return session;
}

export async function requireSession(): Promise<SessionClaims> {
  return requireRole();
}

/** True when the session may read the given class. Admins may read any class. */
export function canAccessClass(session: SessionClaims, classId: string) {
  if (session.role === "admin") return true;
  return session.classes.some((entry) => entry.id === classId);
}
