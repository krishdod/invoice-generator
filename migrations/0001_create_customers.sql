-- Local / remote D1 schema for JCF invoice customers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  gstin TEXT,
  state_code TEXT NOT NULL DEFAULT '24',
  phone TEXT,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_gstin
  ON customers (gstin)
  WHERE gstin IS NOT NULL AND is_active = 1;

CREATE INDEX IF NOT EXISTS idx_customers_name
  ON customers (name COLLATE NOCASE);
