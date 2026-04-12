-- Clear all demo data
DELETE FROM "Transaction";
DELETE FROM "ManualAsset";
DELETE FROM "Holding";
DELETE FROM "BalanceItem";

-- Family Holdings (avg cost = latest closing price)
INSERT INTO "Holding" (id, entity, asset, ticker, shares, avgCost, currency, createdAt, updatedAt) VALUES
('h1', 'FAMILY', 'VOO', 'VOO', 19, 634.02, 'USD', datetime('now'), datetime('now')),
('h2', 'FAMILY', 'QQQ', 'QQQ', 16, 608.81, 'USD', datetime('now'), datetime('now'));

-- Manual Assets
INSERT INTO "ManualAsset" (id, entity, name, balance, currency, category, createdAt, updatedAt) VALUES
('m1', 'FAMILY', 'USD Cash', 110000, 'USD', 'CASH_EQUIVALENT', datetime('now'), datetime('now')),
('m3', 'COMPANY', 'Company Bank Balance', 10000, 'SGD', 'CORPORATE_CASH', datetime('now'), datetime('now'));

-- Initial transactions to match
INSERT INTO "Transaction" (id, date, entity, asset, currency, amount, units, price, type, note, createdAt) VALUES
('t0', '2026-02-20T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 21787.34, NULL, NULL, 'DEPOSIT', 'Opening capital basis for seeded holdings', datetime('now')),
('t1', '2026-02-21T00:00:00.000Z', 'FAMILY', 'VOO', 'USD', 12046.38, 19, 634.02, 'BUY', 'VOO initial position', datetime('now')),
('t2', '2026-02-21T00:00:00.000Z', 'FAMILY', 'QQQ', 'USD', 9740.96, 16, 608.81, 'BUY', 'QQQ initial position', datetime('now')),
('t3', '2026-02-21T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 100000, NULL, NULL, 'DEPOSIT', 'USD cash balance', datetime('now')),
('t4', '2026-02-21T00:00:00.000Z', 'FAMILY', 'USD Cash', 'USD', 10000, NULL, NULL, 'DEPOSIT', 'Converted cash balance', datetime('now')),
('t5', '2026-02-21T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'SGD', 10000, NULL, NULL, 'DEPOSIT', 'Company SGD balance', datetime('now'));

-- Balance sheet entries (liability / receivable / payable)
INSERT INTO "BalanceItem" (id, entity, name, type, amount, currency, dueDate, note, createdAt, updatedAt) VALUES
('b1', 'FAMILY', 'Home Mortgage', 'LIABILITY', 350000, 'SGD', '2035-12-31T00:00:00.000Z', 'Outstanding principal', datetime('now'), datetime('now')),
('b2', 'COMPANY', 'Supplier Payables', 'PAYABLE', 8000, 'SGD', '2026-03-31T00:00:00.000Z', 'Open supplier invoices', datetime('now'), datetime('now')),
('b3', 'COMPANY', 'Customer Receivables', 'RECEIVABLE', 12000, 'SGD', '2026-03-15T00:00:00.000Z', 'Pending wholesale settlement', datetime('now'), datetime('now'));
