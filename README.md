# WealthPulse Dashboard

Family + small business finance dashboard with manual-entry-first workflows.
Tracks investment holdings, cash assets, company liquidity, and FX-normalized views.

## 1. Quick Start

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma db push
npx prisma db execute --file prisma/reset.sql
npm run dev
```

Open `http://localhost:3000`.

## 2. Security Baseline

### 2.1 Optional Basic Auth (recommended for deployed app)

Add these env vars in `.env` and deployment:

```env
APP_BASIC_AUTH_USER=your-username
APP_BASIC_AUTH_PASS=your-strong-password
```

Behavior:
- If both vars are set, `middleware.ts` protects pages and API routes with Basic Auth.
- If either var is empty, Basic Auth is disabled (useful for local dev).

### 2.2 Secret Leakage Scan

Run before pushing:

```bash
npm run security:scan
```

This scans for common hardcoded token/JWT patterns.

### 2.3 Env Check

Check Turso envs:

```bash
npm run security:env
```

Strict check (includes Basic Auth vars):

```bash
npm run security:env:strict
```

## 3. Turso Setup

### 3.1 Required env vars

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-token
```

### 3.2 Run setup script safely

Safe mode (default): schema only, no data reset.

```bash
node scripts/setup-turso.mjs
```

Destructive mode: reset and seed demo data.

```bash
set ALLOW_SEED_RESET=1
node scripts/setup-turso.mjs
```

After reset, switch back:

```bash
set ALLOW_SEED_RESET=0
```

## 4. Turso Token Rotation Runbook

1. Create a new token in the Turso dashboard.
2. Update `TURSO_AUTH_TOKEN` in your deployment platform (for example Vercel).
3. Redeploy and verify `/api/dashboard` responds successfully.
4. Revoke the old token in Turso.
5. Update local `.env` with the new token.
6. Run `npm run security:scan` to confirm no token is hardcoded.

## 5. Common Commands

```bash
npm run dev
npm run lint
npm run build
npm run security:scan
npm run security:env
```

## 6. Notes

- Market quotes come from `yahoo-finance2`.
- FX rates come from Frankfurter and values are normalized to SGD.
- Transaction writes are now atomic (transactional) to avoid partial updates.
- Statements now include structured `BalanceItem` records for liabilities, payables, and receivables.
- You can maintain these entries from the `Statements` tab (or via `/api/balance-items`).
