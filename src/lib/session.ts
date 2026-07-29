import { SignJWT, jwtVerify } from "jose";
import { LEGACY_ROLE_MAP, type Role, type SessionClaims } from "@/lib/types";

export const SESSION_COOKIE = "session";
/** Cookie written by the previous client-side login; cleared on sign in and out. */
export const LEGACY_SESSION_COOKIE = "authToken";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // one day, matching the old cookie

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env.local.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verifies a session token. Tolerates the legacy payload shape (numeric `role`,
 * `Class` array of grade strings) so tokens issued by the old API do not force
 * everyone to sign in again the moment this deploys.
 */
export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const role: Role | undefined =
      typeof payload.role === "number"
        ? LEGACY_ROLE_MAP[payload.role]
        : (payload.role as Role | undefined);

    if (!role) return null;

    const rawClasses = payload.classes ?? payload.Class;
    const classes = Array.isArray(rawClasses)
      ? rawClasses.map((entry) =>
          typeof entry === "string"
            ? { id: "", grade: entry }
            : {
                id: String((entry as { id?: unknown }).id ?? ""),
                grade: String((entry as { grade?: unknown }).grade ?? ""),
              }
        )
      : [];

    return {
      sub: String(payload.sub ?? ""),
      username: String(payload.username ?? ""),
      name: String(payload.name ?? ""),
      role,
      classes,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
