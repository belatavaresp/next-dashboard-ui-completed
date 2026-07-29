import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  verifySession,
} from "@/lib/session";
import type { SessionClaims } from "@/lib/types";

const PUBLIC_PATHS = new Set([
  "/",
  "/student-sign-in",
  "/teacher-sign-in",
  "/adm-sign-in",
]);

/** Where each role goes when it has no better destination. */
function homeFor(session: SessionClaims) {
  if (session.role === "admin") return "/admin";
  if (session.role === "teacher") return "/teacher";
  const first = session.classes[0];
  return first?.id ? `/class/${first.id}` : "/";
}

/**
 * Legacy URLs like /student-6 name a grade, while a class id names one
 * institution's grade, so the target depends on who is asking.
 */
function resolveLegacyClassUrl(session: SessionClaims, grade: string) {
  const matches = session.classes.filter((entry) => entry.grade === grade && entry.id);

  if (matches.length === 1) return `/class/${matches[0].id}`;
  // Ambiguous (same grade at two institutions) or no match: fall back to a page
  // where the user can pick, rather than guessing.
  return homeFor(session);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;

  const session = token ? await verifySession(token) : null;

  if (!session) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(LEGACY_SESSION_COOKIE);
    return response;
  }

  const legacyClassMatch = pathname.match(/^\/student-([\w-]+)$/);
  if (legacyClassMatch) {
    return NextResponse.redirect(
      new URL(resolveLegacyClassUrl(session, legacyClassMatch[1]), request.url),
      { status: 308 }
    );
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(homeFor(session), request.url));
  }

  if (pathname.startsWith("/teacher") && session.role === "student") {
    return NextResponse.redirect(new URL(homeFor(session), request.url));
  }

  const classMatch = pathname.match(/^\/class\/([^/]+)$/);
  if (classMatch && session.role !== "admin") {
    const classId = classMatch[1];
    if (!session.classes.some((entry) => entry.id === classId)) {
      return NextResponse.redirect(new URL(homeFor(session), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/teacher",
    "/teacher/:path*",
    "/class/:path*",
    "/activities/:path*",
    // Partial-segment params need a single param, not `:path*`, to match
    // /student-6. `:path*` silently matches nothing here.
    "/student-:grade",
  ],
};
