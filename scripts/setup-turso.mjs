import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://wealth-dashboard-xavier-fan123.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE2Nzk2MDMsImlkIjoiYjE0ODJmYzYtYjEyZS00ZGRhLTkyZmQtMTJmYzljNDUxMWZhIiwicmlkIjoiNzlhNTUyZWQtODQwNS00ZTUwLTk0N2UtNzU2ZDM1YmRiOTMxIn0.WuPDbxWlLkJu4j13TsM0xoyZVO0RoiQOvnhsL9jBaMQBBUg1v3c9pcIhp5ugbHaHe7ecPr8uCN6fmQe92jUyBA",
});

// Create tables matching Prisma schema
const statements = [
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
  // Seed data
  `DELETE FROM "Transaction"`,
  `DELETE FROM "ManualAsset"`,
  `DELETE FROM "Holding"`,
  `INSERT INTO "Holding" (id, entity, asset, ticker, shares, avgCost, currency, createdAt, updatedAt) VALUES
    ('h1', 'FAMILY', 'VOO', 'VOO', 19, 634.02, 'USD', datetime('now'), datetime('now')),
    ('h2', 'FAMILY', 'QQQ', 'QQQ', 16, 608.81, 'USD', datetime('now'), datetime('now'))`,
  `INSERT INTO "ManualAsset" (id, entity, name, balance, currency, category, createdAt, updatedAt) VALUES
    ('m1', 'FAMILY', 'USD Cash', 100000, 'USD', 'CASH_EQUIVALENT', datetime('now'), datetime('now')),
    ('m2', 'FAMILY', 'CNY Cash', 200000, 'CNY', 'CASH_EQUIVALENT', datetime('now'), datetime('now')),
    ('m3', 'COMPANY', 'Company Bank Balance', 10000, 'SGD', 'CORPORATE_CASH', datetime('now'), datetime('now'))`,
  `INSERT INTO "Transaction" (id, date, entity, asset, currency, amount, units, price, type, note, createdAt) VALUES
    ('t1', '2026-02-21T00:00:00.000Z', 'FAMILY', 'VOO', 'USD', 12046.38, 19, 634.02, 'BUY', 'VOO initial position', datetime('now')),
    ('t2', '2026-02-21T00:00:00.000Z', 'FAMILY', 'QQQ', 'USD', 9740.96, 16, 608.81, 'BUY', 'QQQ initial position', datetime('now')),
    ('t3', '2026-02-21T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 100000, NULL, NULL, 'DEPOSIT', 'USD cash balance', datetime('now')),
    ('t4', '2026-02-21T00:00:00.000Z', 'FAMILY', 'CNY Cash', 'CNY', 200000, NULL, NULL, 'DEPOSIT', 'CNY cash balance', datetime('now')),
    ('t5', '2026-02-21T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'SGD', 10000, NULL, NULL, 'DEPOSIT', 'Company SGD balance', datetime('now'))`,
];

console.log("Connecting to Turso...");
for (const sql of statements) {
  const label = sql.trim().substring(0, 60);
  try {
    await client.execute(sql);
    console.log(`OK: ${label}...`);
  } catch (err) {
    console.error(`FAIL: ${label}...`);
    console.error(err.message);
  }
}

// Verify
const holdings = await client.execute("SELECT count(*) as c FROM Holding");
const assets = await client.execute("SELECT count(*) as c FROM ManualAsset");
const txns = await client.execute("SELECT count(*) as c FROM \"Transaction\"");
console.log(`\nVerification: ${holdings.rows[0].c} holdings, ${assets.rows[0].c} manual assets, ${txns.rows[0].c} transactions`);
console.log("Done! Turso database is ready.");
