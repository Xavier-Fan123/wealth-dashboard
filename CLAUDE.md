# WealthPulse Dashboard

## Project Overview
Family & Corporate Wealth Management Dashboard. Tracks family investments (VOO, QQQ, Gold ETF, cash) and company liquidity (SGD bank balance). Base currency is **SGD** with live FX conversion.

**Live URL**: https://wealth-dashboard-seven.vercel.app/
**GitHub**: https://github.com/Xavier-Fan123/wealth-dashboard

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, TypeScript, Turbopack)
- **Styling**: Tailwind CSS v4 (inline `@theme` in globals.css, NOT v3 config file)
- **Database**: Prisma v6 + SQLite (local) / Turso libsql (production)
- **Market Data**: yahoo-finance2 v3 (`new YahooFinance()` instantiation required)
- **FX Rates**: Frankfurter API (USD→SGD, USD→CNY, derived CNY→SGD)
- **Charts**: Recharts (PieChart, BarChart)
- **Icons**: lucide-react
- **UI Primitives**: Radix UI, class-variance-authority

## Architecture

### Database (Prisma schema: `prisma/schema.prisma`)
Three models:
- **Holding** — Auto-priced stock positions (entity, ticker, shares, avgCost, currency)
- **ManualAsset** — Cash accounts not auto-priced (name, balance, currency, category)
- **Transaction** — Capital flow log (date, entity, asset, amount, units, price, type, note)

Entity is always `FAMILY` or `COMPANY`. Categories: `CASH_EQUIVALENT`, `CORPORATE_CASH`.

### Dual Database Mode (`src/lib/prisma.ts`)
- **Production (Vercel)**: Uses Turso via `@prisma/adapter-libsql` when `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars are set
- **Local dev**: Falls back to SQLite file via `DATABASE_URL=file:./dev.db`
- Uses `as never` cast for adapter option due to Prisma v6 type limitation

### API Routes (`src/app/api/`)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/dashboard` | GET | Aggregated dashboard data: holdings with live prices, manual assets, FX rates, allocation, burn rate |
| `/api/holdings` | GET | Raw holdings list |
| `/api/manual-assets` | GET, PUT | Read/update manual asset balances |
| `/api/transactions` | GET, POST | Transaction log + auto-update holdings & cash |

### Transaction Logic (`src/app/api/transactions/route.ts`)
**Critical business rule**: BUY/SELL automatically adjusts cash accounts.
- **BUY**: Increases holding shares + **deducts** from corresponding cash account (USD Cash / CNY Cash / Company Bank Balance)
- **SELL**: Decreases holding shares + **adds back** to corresponding cash account
- **DEPOSIT**: Only way to increase total cash (external injection)
- **WITHDRAW**: Decreases cash account
- Cash account mapping: `USD→"USD Cash"`, `CNY→"CNY Cash"`, `SGD→"Company Bank Balance"`

### Market Data (`src/lib/market.ts`)
- yahoo-finance2 v3: Must use `new YahooFinance()` then `yf.quote(ticker)` — NOT default import
- Return type is `any` due to v3 TypeScript issues
- FX from `api.frankfurter.app/latest?from=USD&to=SGD,CNY`
- CNY/SGD derived as USD/SGD ÷ USD/CNY

### UI Components

**Dashboard components** (`src/components/dashboard/`):
| Component | Description | Mobile Behavior |
|-----------|-------------|-----------------|
| `sidebar.tsx` | Nav sidebar, accepts `open`/`onClose` props | Slide-in drawer with backdrop, auto-close on tap |
| `kpi-cards.tsx` | Total Net Worth, Family Net Worth, Company Liquidity, Family Cash | Grid responsive |
| `allocation-chart.tsx` | Donut chart (equity/commodity/cash/corporate) | Stacks vertically, smaller chart |
| `portfolio-table.tsx` | Holdings with live price, P&L, market value | Cards on mobile (`lg:hidden`), table on desktop (`hidden lg:block`) |
| `corporate-board.tsx` | Cash balance, burn rate, runway, monthly outflow chart | Smaller chart height on mobile |
| `transaction-form.tsx` | Modal form to log transactions | Bottom-sheet style on mobile |
| `transaction-list.tsx` | Recent capital flows | Cards on mobile (`md:hidden`), table on desktop |
| `fx-ticker.tsx` | Live FX rates ticker | Compact text, hide dividers on mobile |

**UI primitives** (`src/components/ui/`): badge, button, card, input, select

**Main page** (`src/app/page.tsx`): Client component with hamburger menu for mobile sidebar toggle.

### Styling (`src/app/globals.css`)
Dark theme using Tailwind v4 `@theme inline` block with CSS variables:
- `--color-background: #09090b`, `--color-card: #18181b`, `--color-border: #27272a`
- Semantic colors: `--color-success`, `--color-warning`, `--color-destructive`, `--color-info`, `--color-primary`

## Deployment

### Vercel
- Auto-deploys on push to `main`
- Build command: `prisma generate && next build`
- `serverExternalPackages: ["@libsql/client", "yahoo-finance2"]` in `next.config.ts`

### Environment Variables (Vercel)
| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | `libsql://wealth-dashboard-xavier-fan123.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | (JWT token, must be single line — no line breaks!) |
| `DATABASE_URL` | `file:./dev.db` |

### Turso Database
- Region: aws-ap-northeast-1 (Tokyo)
- Schema pushed via `scripts/setup-turso.mjs` (Node.js script using @libsql/client directly)
- No Turso CLI needed — all setup done via script

## Current Portfolio Data
- **VOO**: 19 shares (avg cost $634.02)
- **QQQ**: 16 shares (avg cost $608.81)
- **USD Cash**: $100,000
- **CNY Cash**: ¥200,000
- **Company Bank (SGD)**: S$10,000

## Local Development
```bash
npm install
npx prisma generate
npx prisma db push          # create local SQLite tables
npx prisma db execute --file prisma/reset.sql  # seed data
npm run dev                  # http://localhost:3000
```

## Known Quirks / Gotchas
1. **Prisma v6 only** — v7 has breaking changes (ESM-only client, new generator). Don't upgrade.
2. **yahoo-finance2 v3** — Requires `new YahooFinance()`. Quote return type is `any`.
3. **Turso auth token** — Must be pasted as single line in Vercel env vars (no newlines).
4. **No authentication** — Anyone with the URL can view/modify data. Consider adding password protection.
5. **`as never` cast** in prisma.ts for adapter — Prisma v6 types don't fully support driver adapters.

## Future Improvements
- [ ] Add password/auth protection
- [ ] Add SGD Cash account for family
- [ ] Historical net worth tracking chart
- [ ] Dividend tracking
- [ ] Multi-currency P&L display
- [ ] Data export (CSV)
