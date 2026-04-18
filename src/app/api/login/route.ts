import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  authConfigured,
  signSession,
  timingSafeEqual,
} from "@/lib/auth";

export const runtime = "edge";

function isSafeRedirect(target: string): boolean {
  return target.startsWith("/") && !target.startsWith("//");
}

export async function POST(req: NextRequest) {
  const config = authConfigured();
  const form = await req.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const fromRaw = String(form.get("from") ?? "/");
  const from = isSafeRedirect(fromRaw) ? fromRaw : "/";

  if (!config) {
    // Auth not configured — nothing to verify against; just send them home.
    return NextResponse.redirect(new URL(from, req.url), 303);
  }

  const userOk = timingSafeEqual(username, config.user);
  const passOk = timingSafeEqual(password, config.pass);
  if (!(userOk && passOk)) {
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", "1");
    if (from !== "/") errorUrl.searchParams.set("from", from);
    return NextResponse.redirect(errorUrl, 303);
  }

  const token = await signSession(config.user, config.secret);
  const res = NextResponse.redirect(new URL(from, req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
