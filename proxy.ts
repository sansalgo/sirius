import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is in the publicRoutes array
  const isPublicRoute = publicRoutes.includes(pathname);

  // Call the better-auth session endpoint to check for valid auth
  const url = new URL("/api/auth/get-session", request.url);
  const response = await fetch(url, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  const sessionData = await response.json().catch(() => null);
  const isAuthenticated = !!sessionData?.session;

  // 1. Redirect unauthenticated users to login if they try to access protected routes
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from auth pages to their dashboard/home
  if (isAuthenticated && ["/login", "/signup", "/forgot-password"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url)); // You can change this to wherever authed users should go
  }

  return NextResponse.next();
}

// Ensure the middleware is only called for generic page routes,
// excluding Next.js internals, static assets, and API routes.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$).*)",
  ],
};
