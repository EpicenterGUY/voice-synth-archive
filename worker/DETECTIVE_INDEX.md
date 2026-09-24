# Detective index backend

The detective can run without D1, but the "almost immediate" search path needs a local index.

## One-time setup

1. Create a Cloudflare D1 database named `voice-synth-detective`.
2. Bind it to the Worker as `DB`.
3. Execute `schema.sql` on that database.
4. Deploy the updated `niconico-worker.js`.
5. Optionally add a scheduled trigger. The example `wrangler.toml.example` indexes 50 VocaDB Original songs every 15 minutes.

The browser keeps the old Niconico + VocaDB live search as a fallback. When D1 is ready, the new search route is tried first.

## Endpoints

- `GET /detective/status` — index availability / song count
- `POST /detective/search` — local indexed candidate search; warms from VocaDB if the result pool is small
- `POST /detective/warm` — warm the index from provided clues
- `GET /health` — also reports D1 state

## Search layers

1. title/alias character n-grams for short CJK fragments
2. FTS5 across title, aliases, artists, vocals, tags and lyrics
3. structured year/vocal/producer fallback
4. VocaDB on-demand warming when the local index has too few candidates
5. existing client-side reranking, image evidence, BPM and humming evidence

The schema already reserves `visual_json`, `melody_json`, and `audio_fingerprint` for later visual/melody indexing.
