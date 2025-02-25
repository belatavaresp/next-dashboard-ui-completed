import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.JWT_SECRET!;

interface DecodedUser {
  role: number;
  Class?: string[];
}

export async function middleware(req: NextRequest) {
  const tokenCookie = req.cookies.get("authToken"); // Get the token from cookies
  const pathname = req.nextUrl.pathname;

  // Allow access to homepage or login page without token
  if (
    pathname === "/" || 
    pathname === "/student-sign-in" || 
    pathname === "teacher-sign-in" || 
    pathname === "/adm-sign-in"
  ) {
    return NextResponse.next();
  }

  if (!tokenCookie) {
    return NextResponse.redirect(new URL("/", req.url)); // Redirect to homepage if no token
  }

  const token = tokenCookie.value; // Extract the string value

  try {
    // Verify the token with jose and cast the payload
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    console.log("Decoded Payload:", payload); // Check if 'Class' exists in the payload

    // Cast the payload to your custom DecodedUser type
    const decoded = payload as unknown as DecodedUser;

    const response = NextResponse.next();
    response.headers.set('X-User-Role', String(payload.role));
    response.headers.set('X-User-Name', String(payload.name));

    // Block access to /admin for non-admins
    if (pathname.startsWith("/admin") && decoded.role !== 2) {
      console.log("Not an admin, redirecting...");
      return NextResponse.redirect(new URL("/", req.url)); // Redirect if not admin
    }

    // Admins (role 2) can access everything
    if (decoded.role === 2) return NextResponse.next();

    // Protect Teacher Pages (only role 1,2 can access)
    if (pathname.startsWith("/teacher") && decoded.role === 0) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect Student Pages (only students and teachers)
    const studentClassMatch = pathname.match(/^\/student-(\w+)$/);
    if (studentClassMatch) {
      const classId = studentClassMatch[1];

      if (
        decoded.role === 0 && // Student role
        (!decoded.Class || !decoded.Class.includes(classId)) // Ensure they belong to the correct class
      ) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (decoded.role !== 0 && decoded.role !== 1) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    
    console.log(`response: ${response}`)
    return response;
  } catch (error) {
    console.error("Invalid or expired token:", error);
    return NextResponse.redirect(new URL("/", req.url)); // Redirect to homepage if token is invalid
  }
}

// Define which routes should be protected
export const config = {
  matcher: [
    "/admin", 
    "/teacher", 
    "/student-:path*"
  ],
};
