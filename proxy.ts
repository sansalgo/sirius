import { NextRequest, NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const AUTH_REDIRECT_ROUTES = ["/", "/login", "/signup", "/forgot-password"];

// Paths that should be rate-limited (auth-related)
const RATE_LIMITED_PATHS = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate-limit auth endpoints
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    const { success, remaining, reset } = await checkAuthRateLimit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }

    return NextResponse.next();
  }

  // 2. Auth redirect logic (skip for API routes and static assets — handled by matcher)
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/reset-password");

  const sessionUrl = new URL("/api/auth/get-session", request.url);
  const sessionResponse = await fetch(sessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const sessionData = await sessionResponse.json().catch(() => null);
  const isAuthenticated = !!sessionData?.session;

  // Unauthenticated users trying to access protected routes → login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users on auth entry pages → dashboard
  if (isAuthenticated && AUTH_REDIRECT_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Run on all page routes; skip Next.js internals, static assets, and API routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$).*)",
  ],
};
