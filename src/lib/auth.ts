// Edge-runtime compatible signed-cookie session.
// Uses Web Crypto API (HMAC-SHA256). No Node-only deps.

export const SESSION_COOKIE = "wp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

type Payload = {
  sub: string;
  exp: number;
};

function textEncoder() {
  return new TextEncoder();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const str = atob(b64);
  const buf = new ArrayBuffer(str.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(username: string, secret: string): Promise<string> {
  const payload: Payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(textEncoder().encode(payloadJson));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<Payload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const key = await hmacKey(secret);
  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    sigBytes = base64UrlDecode(sigB64);
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    textEncoder().encode(payloadB64)
  );
  if (!ok) return null;
  try {
    const json = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(json) as Payload;
    if (!payload || typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Constant-time string compare — avoids leaking password length-mismatch timing.
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = textEncoder().encode(a);
  const bBytes = textEncoder().encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

export function authConfigured(): {
  user: string;
  pass: string;
  secret: string;
} | null {
  const user = process.env.APP_BASIC_AUTH_USER;
  const pass = process.env.APP_BASIC_AUTH_PASS;
  const secret = process.env.APP_AUTH_SECRET;
  if (!user || !pass || !secret) return null;
  return { user, pass, secret };
}
