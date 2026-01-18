import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedRoutes = ["/dashboard"];

// Paths that are ONLY for public users (redirect to dashboard if logged in)
// ⚠️ Note: I removed "/" from here because we handle it explicitly below
const publicRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 🟢 1. ROOT PATH HANDLING (Your new requirement)
  if (pathname === "/") {
    if (token) {
      // User is logged in -> Go to Dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // User is NOT logged in -> Go to Login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 🔍 2. Determine Route Type
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // 🔒 3. Protected Route & No Token -> Redirect to Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ↩️ 4. Public Route (Login/Signup) & Token -> Redirect to Dashboard
  // (Prevents logged-in users from seeing the login page again)
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ✅ 5. Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};