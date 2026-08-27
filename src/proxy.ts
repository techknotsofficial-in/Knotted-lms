import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { aj } from "@/lib/arcjet";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip Arcjet for internal assets, auth endpoints, and payment webhooks
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhook = pathname.startsWith("/api/webhooks");

  if (!isStatic && !isWebhook && !isAuthApi && process.env.ARCJET_KEY && process.env.NODE_ENV === "production") {
    try {
      const decision = await aj.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429 }
          );
        }
        if (decision.reason.isBot()) {
          return NextResponse.json(
            { error: "Automated access is restricted." },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: "Access denied by security shield policy." },
          { status: 403 }
        );
      }
    } catch (err) {
      // In dev or on network timeout, allow request to proceed gracefully
      console.warn("Arcjet middleware evaluation bypassed:", err);
    }
  }

  // 2. Authentication Route Protection
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/verify-otp");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/creator") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  // Redirect unauthenticated users trying to access protected dashboards
  if (isProtectedRoute && !sessionToken) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login page to dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/creator/:path*",
    "/onboarding",
    "/login",
    "/checkout/:path*",
  ],
};
