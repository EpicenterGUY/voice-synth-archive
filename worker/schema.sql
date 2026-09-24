-- Voice Synth Archive Detective Index v1
-- Cloudflare D1 / SQLite

PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_key TEXT NOT NULL UNIQUE,
  vocadb_id INTEGER,
  nico_id TEXT,
  title TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  artists_json TEXT NOT NULL DEFAULT '[]',
  vocals_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  lyrics_text TEXT NOT NULL DEFAULT '',
  publish_date TEXT,
  publish_year INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  min_bpm REAL,
  max_bpm REAL,
  thumbnail_url TEXT,
  vocadb_url TEXT,
  youtube_url TEXT,
  pvs_json TEXT NOT NULL DEFAULT '[]',
  web_links_json TEXT NOT NULL DEFAULT '[]',
  albums_json TEXT NOT NULL DEFAULT '[]',
  search_blob TEXT NOT NULL DEFAULT '',
  view_counter INTEGER,
  comment_counter INTEGER,
  mylist_counter INTEGER,
  like_counter INTEGER,
  visual_json TEXT,
  melody_json TEXT,
  audio_fingerprint TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_vocadb_id ON songs(vocadb_id);
CREATE INDEX IF NOT EXISTS idx_songs_nico_id ON songs(nico_id);
CREATE INDEX IF NOT EXISTS idx_songs_publish_year ON songs(publish_year);
CREATE INDEX IF NOT EXISTS idx_songs_updated_at ON songs(updated_at);
CREATE INDEX IF NOT EXISTS idx_songs_bpm ON songs(min_bpm,max_bpm);

CREATE VIRTUAL TABLE IF NOT EXISTS song_fts USING fts5(
  song_id UNINDEXED,
  title,
  aliases,
  artists,
  vocals,
  tags,
  lyrics,
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS song_ngrams (
  gram TEXT NOT NULL,
  song_id INTEGER NOT NULL,
  PRIMARY KEY(gram,song_id),
  FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_song_ngrams_song ON song_ngrams(song_id);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO sync_state(key,value,updated_at)
VALUES('schema_version','1',datetime('now'));
