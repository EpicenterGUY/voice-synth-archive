# Detective backend v19 — free-first mode

The project now defaults to **free mode**. No Workers AI or Vectorize binding is needed.

## What the free detective uses

1. **Cloudflare D1**
   - canonical song records
   - title / alias / producer / vocal / tag / lyric metadata
2. **2–3 character n-gram search**
   - good for short Japanese/CJK title fragments
   - capped to reduce D1 writes
3. **D1 FTS5**
   - title, aliases, artists, vocals, tags and lyrics
4. **Korean → Japanese concept expansion**
   - examples: 어두움 → ダーク / 鬱 / 絶望
   - 흑백 → 白黒 / モノクロ
   - 손그림 → 手描き / 手書き
   - 미쿠 → 初音ミク
5. **Structured reranking**
   - year / vocal / producer / duration / BPM / where heard
6. **Existing browser evidence**
   - low-level image fingerprint
   - BPM / humming contour
   - rejection feedback
7. **Niconico + VocaDB live fallback**
   - used when the local D1 candidate pool is insufficient

This gives a much stronger detector than the old live-search-only version without requiring AI billing.

## Free setup

### 1. Create D1

```bash
npx wrangler d1 create voice-synth-detective
```

Copy the returned database ID into `wrangler.toml` under:

```toml
[[d1_databases]]
binding = "DB"
database_name = "voice-synth-detective"
database_id = "..."
```

### 2. Create the schema

```bash
npx wrangler d1 execute voice-synth-detective --remote --file=./schema.sql
```

### 3. Create the sync secret

```bash
npx wrangler secret put SYNC_TOKEN
```

Use any long random string and keep it private.

### 4. Deploy

```bash
npx wrangler deploy
```

### 5. Check

Open:

```
https://YOUR-WORKER.workers.dev/health
```

Free mode should report the detective index and should **not** report semantic/MV AI indexes as enabled.

## Free automatic indexing

The example cron is intentionally conservative:

```toml
[triggers]
crons = ["0 */6 * * *"]
```

It indexes one VocaDB page (up to 50 songs) every six hours and enriches Niconico-linked songs.

The title/alias n-gram list is capped so the database does not explode with write operations.

## Optional manual initial fill

You can populate a few pages manually:

```text
POST /detective/sync
Authorization: Bearer <SYNC_TOKEN>
Content-Type: application/json

{"pages":2}
```

In free mode the endpoint caps one request to a small number of pages. Repeat later if desired instead of trying to import everything at once.

## Future upgrade

The AI code has **not been deleted**. Later, if you choose a paid/AI configuration:

1. set `ENABLE_AI = "1"`
2. add Workers AI binding `AI`
3. add text Vectorize binding `VECTORIZE`
4. add visual Vectorize binding `VISUALIZE`

Then the same Worker automatically enables:

- multilingual semantic text search
- MV/thumbnail semantic search
- semantic backfill endpoints

No database migration or front-end rewrite is required.

## Endpoints

- `GET /health`
- `GET /detective/status`
- `POST /detective/search`
- `POST /detective/warm`
- `POST /detective/sync` — requires `SYNC_TOKEN`

AI-only endpoints remain in the code but stay disabled while `ENABLE_AI=0`.
