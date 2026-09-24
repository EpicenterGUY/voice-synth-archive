# Detective index backend v18

The fast detective path is now a hybrid local search engine:

1. **D1 lexical index**
   - title / alias 2–3 character n-grams
   - FTS5 across title, aliases, artists, vocals, tags and lyrics
2. **Workers AI multilingual semantic embedding**
   - model: `@cf/baai/bge-m3`
   - Korean fuzzy memories can retrieve Japanese song metadata semantically
3. **MV visual-semantic search**
   - candidate thumbnails are captioned with `@cf/meta/llama-3.2-11b-vision-instruct`
   - captions are embedded with `bge-m3` into a separate Vectorize index
   - uploaded screenshots/drawings are captioned with the same vision model and queried against that visual index
4. **Vectorize nearest-neighbor search**
   - 1024 dimensions
   - cosine metric
5. **Existing client reranker**
   - exact words / lyrics
   - vocal / year / producer
   - where-heard context
   - MV visual fingerprint
   - BPM / humming evidence
   - rejection feedback
6. **Live Niconico + VocaDB fallback**
   - used when the local index is still young or low-confidence

## One-time Cloudflare setup

### 1. D1

Create a D1 database called `voice-synth-detective`, bind it to the Worker as `DB`, then run:

```bash
npx wrangler d1 execute voice-synth-detective --remote --file=./schema.sql
```

### 2. Vectorize

Create a 1024-dimensional cosine index:

```bash
npx wrangler@latest vectorize create voice-synth-semantic --dimensions=1024 --metric=cosine
```

Bind it as `VECTORIZE`.

### 3. Workers AI

Add the Workers AI binding as `AI`.

The MV semantic layer currently uses Meta Llama 3.2 11B Vision. Cloudflare requires a one-time acceptance of Meta's license before first use of that model. Run the model once with `{"prompt":"agree"}` from the Workers AI API or Playground.

### 4. Visual Vectorize

Create a second 1024-dimensional cosine index:

```bash
npx wrangler@latest vectorize create voice-synth-visual --dimensions=1024 --metric=cosine
```

Bind it as `VISUALIZE`.

This index stores semantic vectors derived from MV/thumbnail captions, separate from the title/lyrics semantic index.

### 5. Cron

A 15-minute cron is recommended. Each run processes up to 200 VocaDB Original-song rows, stores them in D1, batches semantic embeddings into Vectorize, enriches Niconico-linked songs with current Snapshot metadata, backfills semantic vectors for older D1 rows, and captions a small batch of unprocessed thumbnails for the MV visual index.

### 6. Deploy

Deploy the updated `niconico-worker.js`.

## Optional faster initial population

The worker supports an authenticated manual sync endpoint:

```
POST /detective/sync
Authorization: Bearer <SYNC_TOKEN>
Content-Type: application/json

{"pages":8}
```

Set `SYNC_TOKEN` as a Cloudflare Worker secret. Up to 8 × 50 songs are processed per sync call.

If D1 already contains songs before Vectorize is enabled, backfill their embeddings with:

```text
POST /detective/reindex
Authorization: Bearer <SYNC_TOKEN>
Content-Type: application/json

{"limit":300}
```

Repeated calls advance a stored semantic cursor.

## Endpoints

- `GET /health`
- `GET /detective/status`
- `POST /detective/search`
- `POST /detective/warm`
- `POST /detective/sync` — requires `SYNC_TOKEN`
- `POST /detective/reindex` — semantic backfill for existing D1 rows; requires `SYNC_TOKEN`
- `POST /detective/reindex-visual` — captions unprocessed thumbnails and fills the MV visual index; requires `SYNC_TOKEN`
- `POST /detective/visual-query` — visual-memory search used by the browser

## Search behavior

`/detective/search` runs lexical D1 search and semantic Vectorize search in parallel. If both are sparse, the Worker warms the index from VocaDB using the user's current clues and reruns the search.

The browser still handles the final evidence-based reranking, so semantic similarity cannot override a strong contradictory clue by itself.

## Future reserved fields

The D1 schema already contains:

- `visual_json`
- `melody_json`
- `audio_fingerprint`

These are intended for precomputed MV/image embeddings and melody/audio fingerprints.


## Faster MV visual backfill

After the Meta vision-model license has been accepted and `VISUALIZE` is bound, you can accelerate thumbnail indexing:

```text
POST /detective/reindex-visual
Authorization: Bearer <SYNC_TOKEN>
Content-Type: application/json

{"limit":30}
```

Repeat as needed. Normal cron runs also caption a small batch automatically.

The visual layer is deliberately semantic rather than identity-based: it searches visible properties such as red/blue palettes, monochrome illustration, face close-ups, text-heavy frames, 3D/MMD-like visuals, backgrounds and objects.
