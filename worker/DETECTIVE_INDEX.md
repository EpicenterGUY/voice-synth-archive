# Detective index backend v17

The fast detective path is now a hybrid local search engine:

1. **D1 lexical index**
   - title / alias 2–3 character n-grams
   - FTS5 across title, aliases, artists, vocals, tags and lyrics
2. **Workers AI multilingual semantic embedding**
   - model: `@cf/baai/bge-m3`
   - Korean fuzzy memories can retrieve Japanese song metadata semantically
3. **Vectorize nearest-neighbor search**
   - 1024 dimensions
   - cosine metric
4. **Existing client reranker**
   - exact words / lyrics
   - vocal / year / producer
   - where-heard context
   - MV visual fingerprint
   - BPM / humming evidence
   - rejection feedback
5. **Live Niconico + VocaDB fallback**
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

### 4. Cron

A 15-minute cron is recommended. Each run processes up to 200 VocaDB Original-song rows, stores them in D1, and batches semantic embeddings into Vectorize.

### 5. Deploy

Deploy the updated `niconico-worker.js`.

## Optional faster initial population

The worker supports an authenticated manual sync endpoint:

```
POST /detective/sync
Authorization: Bearer <SYNC_TOKEN>
Content-Type: application/json

{"pages":8}
```

Set `SYNC_TOKEN` as a Cloudflare Worker secret. Up to 8 × 50 songs are processed per call.

## Endpoints

- `GET /health`
- `GET /detective/status`
- `POST /detective/search`
- `POST /detective/warm`
- `POST /detective/sync` — requires `SYNC_TOKEN`

## Search behavior

`/detective/search` runs lexical D1 search and semantic Vectorize search in parallel. If both are sparse, the Worker warms the index from VocaDB using the user's current clues and reruns the search.

The browser still handles the final evidence-based reranking, so semantic similarity cannot override a strong contradictory clue by itself.

## Future reserved fields

The D1 schema already contains:

- `visual_json`
- `melody_json`
- `audio_fingerprint`

These are intended for precomputed MV/image embeddings and melody/audio fingerprints.
