import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SESSION_COOKIE, authConfigured, verifySession } from "@/lib/auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in · X Wealth",
};

function isSafeRedirect(target: string): boolean {
  return target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/login");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const config = authConfigured();

  // Already signed in? Bounce to the app.
  if (config) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySession(token, config.secret);
    if (session) {
      redirect(isSafeRedirect(params.from ?? "") ? (params.from as string) : "/");
    }
  }

  const from = isSafeRedirect(params.from ?? "") ? (params.from as string) : "/";
  const hasError = params.error === "1";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/icons/icon-192.png"
            alt="X Wealth"
            width={64}
            height={64}
            className="rounded-2xl"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">X Wealth</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </div>
        </div>

        <form
          action="/api/login"
          method="POST"
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <input type="hidden" name="from" value={from} />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {hasError && (
              <p className="text-sm text-destructive" role="alert">
                Incorrect username or password.
              </p>
            )}

            <Button type="submit" size="lg" className="w-full">
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Stays signed in on this device for a year.
        </p>
      </div>
    </main>
  );
}
