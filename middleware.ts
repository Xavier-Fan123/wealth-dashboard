import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, authConfigured, verifySession } from "@/lib/auth";

const PUBLIC_EXACT = new Set<string>([
  "/login",
  "/api/login",
  "/api/logout",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/favicon.ico",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/icons/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const config = authConfigured();
  if (!config) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, config.secret);
  if (session) return NextResponse.next();

  // API routes: return 401 JSON so fetch callers don't follow a redirect to HTML.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Page routes: send the user to /login with a "from" hint.
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname + search);
  return NextResponse.redirect(loginUrl, 303);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
