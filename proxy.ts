import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic guard for /admin (Next 16: middleware.ts is now proxy.ts).
 *
 * Cookie-presence only — no Auth.js or database imports, so this stays
 * edge-safe. The dashboard layout re-validates the real session with auth();
 * a forged cookie passes here but fails there and lands on the login page.
 * The login page itself is never redirected by the proxy (it performs the
 * real auth() check), which also prevents forged-cookie redirect loops.
 */
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Static constants only (required for build-time analysis).
  matcher: ["/admin", "/admin/:path*"],
};
