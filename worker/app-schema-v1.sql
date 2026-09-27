-- VocaDive App Account / Entitlement / Sync Foundation v1
-- Cloudflare D1 / SQLite
-- This schema is intentionally separate from worker/schema.sql so the detective index can remain deployable on its own.

PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_subject)
);

CREATE TABLE IF NOT EXISTS app_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  platform TEXT NOT NULL DEFAULT 'web',
  app_version TEXT NOT NULL DEFAULT '',
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_app_devices_user ON app_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_app_devices_seen ON app_devices(last_seen_at);

CREATE TABLE IF NOT EXISTS app_entitlements (
  user_id TEXT NOT NULL,
  entitlement_key TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  product_id TEXT NOT NULL DEFAULT '',
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, entitlement_key, source),
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_entitlements_status ON app_entitlements(status, expires_at);

CREATE TABLE IF NOT EXISTS app_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  provider TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  purchased_at TEXT,
  expires_at TEXT,
  payload_hash TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, transaction_id),
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_app_purchases_user ON app_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_app_purchases_product ON app_purchases(product_id, status);

CREATE TABLE IF NOT EXISTS app_sync_docs (
  user_id TEXT NOT NULL,
  namespace TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL DEFAULT '{}',
  server_revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, namespace),
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_sync_docs_updated ON app_sync_docs(updated_at);

CREATE TABLE IF NOT EXISTS app_sync_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  namespace TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT '',
  client_revision INTEGER,
  server_revision INTEGER,
  client_payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_sync_conflicts_open ON app_sync_conflicts(user_id, resolved_at);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_meta(key,value)
VALUES('app_schema_version','1');
