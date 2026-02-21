-- Clear existing data
DELETE FROM "Transaction";
DELETE FROM "ManualAsset";
DELETE FROM "Holding";

-- Family Holdings
INSERT INTO "Holding" (id, entity, asset, ticker, shares, avgCost, currency, createdAt, updatedAt) VALUES
('h1', 'FAMILY', 'VOO', 'VOO', 50, 420.0, 'USD', datetime('now'), datetime('now')),
('h2', 'FAMILY', 'QQQ', 'QQQ', 30, 380.0, 'USD', datetime('now'), datetime('now')),
('h3', 'FAMILY', 'Gold ETF', 'GLD', 40, 185.0, 'USD', datetime('now'), datetime('now'));

-- Manual Assets
INSERT INTO "ManualAsset" (id, entity, name, balance, currency, category, createdAt, updatedAt) VALUES
('m1', 'FAMILY', 'Moomoo Short-term Cash', 25000, 'SGD', 'CASH_EQUIVALENT', datetime('now'), datetime('now')),
('m2', 'COMPANY', 'Company Bank Balance', 180000, 'CNY', 'CORPORATE_CASH', datetime('now'), datetime('now'));

-- Transactions
INSERT INTO "Transaction" (id, date, entity, asset, currency, amount, units, price, type, note, createdAt) VALUES
('t1', '2025-01-15T00:00:00.000Z', 'FAMILY', 'VOO', 'USD', 21000, 50, 420, 'BUY', 'Initial VOO position', datetime('now')),
('t2', '2025-02-01T00:00:00.000Z', 'FAMILY', 'QQQ', 'USD', 11400, 30, 380, 'BUY', 'Initial QQQ position', datetime('now')),
('t3', '2025-03-10T00:00:00.000Z', 'FAMILY', 'Gold ETF', 'USD', 7400, 40, 185, 'BUY', 'Gold hedge position', datetime('now')),
('t4', '2025-04-01T00:00:00.000Z', 'FAMILY', 'Moomoo Short-term Cash', 'SGD', 25000, NULL, NULL, 'DEPOSIT', 'Cash deposit to Moomoo', datetime('now')),
('t5', '2025-01-01T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'CNY', 300000, NULL, NULL, 'DEPOSIT', 'Initial company capital', datetime('now')),
('t6', '2025-02-01T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'CNY', -30000, NULL, NULL, 'WITHDRAW', 'Feb operating expenses', datetime('now')),
('t7', '2025-03-01T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'CNY', -35000, NULL, NULL, 'WITHDRAW', 'Mar operating expenses', datetime('now')),
('t8', '2025-04-01T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'CNY', -28000, NULL, NULL, 'WITHDRAW', 'Apr operating expenses', datetime('now')),
('t9', '2025-05-01T00:00:00.000Z', 'COMPANY', 'Company Bank Balance', 'CNY', -27000, NULL, NULL, 'WITHDRAW', 'May operating expenses', datetime('now'));
