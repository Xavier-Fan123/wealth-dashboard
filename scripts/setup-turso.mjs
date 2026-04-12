import "dotenv/config";
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
const allowSeedReset = process.env.ALLOW_SEED_RESET === "1";

if (!tursoUrl || !tursoAuthToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables.");
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "shares" REAL NOT NULL,
    "avgCost" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "ManualAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "entity" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "units" REAL,
    "price" REAL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "BalanceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDate" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  // Unique constraints (CREATE INDEX IF NOT EXISTS is safe to re-run)
  `CREATE UNIQUE INDEX IF NOT EXISTS "Holding_entity_ticker_key" ON "Holding"("entity", "ticker")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ManualAsset_entity_name_key" ON "ManualAsset"("entity", "name")`,
];

const seedResetStatements = [
  `DELETE FROM "Transaction"`,
  `DELETE FROM "ManualAsset"`,
  `DELETE FROM "Holding"`,
  `DELETE FROM "BalanceItem"`,
  `INSERT INTO "Holding" (id, entity, asset, ticker, shares, avgCost, currency, createdAt, updatedAt) VALUES
    ('h1', 'FAMILY', 'VOO', 'VOO', 19, 634.02, 'USD', datetime('now'), datetime('now')),
    ('h2', 'FAMILY', 'QQQ', 'QQQ', 16, 608.81, 'USD', datetime('now'), datetime('now'))`,
  `INSERT INTO "ManualAsset" (id, entity, name, balance, currency, category, createdAt, updatedAt) VALUES
    ('m1', 'FAMILY', 'USD Cash', 110000, 'USD', 'CASH_EQUIVALENT', datetime('now'), datetime('now')),
    ('m3', 'COMPANY', 'Company Bank Balance', 10000, 'SGD', 'CORPORATE_CASH', datetime('now'), datetime('now'))`,
  `INSERT INTO "Transaction" (id, date, entity, asset, currency, amount, units, price, type, note, createdAt) VALUES
    ('t0', '2026-02-20T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 21787.34, NULL, NULL, 'DEPOSIT', 'Opening capital basis for seeded holdings', datetime('now')),
    ('t1', '2026-02-21T00:00:00.000Z', 'FAMILY', 'VOO', 'USD', 12046.38, 19, 634.02, 'BUY', 'VOO initial position', datetime('now')),
    ('t2', '2026-02-21T00:00:00.000Z', 'FAMILY', 'QQQ', 'USD', 9740.96, 16, 608.81, 'BUY', 'QQQ initial position', datetime('now')),
    ('t3', '2026-02-21T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 100000, NULL, NULL, 'DEPOSIT', 'USD cash balance', datetime('now')),
    ('t4', '2026-02-21T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 10000, NULL, NULL, 'DEPOSIT', 'Converted cash balance', datetime('now')),
    ('t5', '2026-02-21T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'SGD', 10000, NULL, NULL, 'DEPOSIT', 'Company SGD balance', datetime('now'))`,
  `INSERT INTO "BalanceItem" (id, entity, name, type, amount, currency, dueDate, note, createdAt, updatedAt) VALUES
    ('b1', 'FAMILY', 'Home Mortgage', 'LIABILITY', 350000, 'SGD', '2035-12-31T00:00:00.000Z', 'Outstanding principal', datetime('now'), datetime('now')),
    ('b2', 'COMPANY', 'Supplier Payables', 'PAYABLE', 8000, 'SGD', '2026-03-31T00:00:00.000Z', 'Open supplier invoices', datetime('now'), datetime('now')),
    ('b3', 'COMPANY', 'Customer Receivables', 'RECEIVABLE', 12000, 'SGD', '2026-03-15T00:00:00.000Z', 'Pending wholesale settlement', datetime('now'), datetime('now'))`,
];

const statements = allowSeedReset
  ? [...schemaStatements, ...seedResetStatements]
  : schemaStatements;

console.log("Connecting to Turso...");
console.log(`Mode: ${allowSeedReset ? "schema + seed reset" : "schema only (safe mode)"}`);

for (const sql of statements) {
  const label = sql.trim().substring(0, 60);
  try {
    await client.execute(sql);
    console.log(`OK: ${label}...`);
  } catch (err) {
    console.error(`FAIL: ${label}...`);
    console.error(err instanceof Error ? err.message : String(err));
  }
}

const holdings = await client.execute('SELECT count(*) as c FROM "Holding"');
const assets = await client.execute('SELECT count(*) as c FROM "ManualAsset"');
const txns = await client.execute('SELECT count(*) as c FROM "Transaction"');
const balanceItems = await client.execute('SELECT count(*) as c FROM "BalanceItem"');
console.log(
  `\nVerification: ${holdings.rows[0].c} holdings, ${assets.rows[0].c} manual assets, ${txns.rows[0].c} transactions, ${balanceItems.rows[0].c} balance items`
);
console.log("Done! Turso database setup completed.");
