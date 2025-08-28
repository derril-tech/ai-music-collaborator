# AI Music Collaborator — Architecture (V1)

## 1) System Overview
**Frontend/BFF:** Next.js 14 (Vercel) — Server Actions for signed uploads/exports; SSR for project/editor pages; ISR for share links.  
**API Gateway:** NestJS (Node 20) — REST **/v1** with OpenAPI 3.1, Zod validation, Problem+JSON, RBAC (Casbin), RLS, Idempotency‑Key + Request‑ID.  
**Orchestration:** **LangGraph** (Python 3.11) with FastAPI controller; nodes: LyricsNode, StructurePlanner, MelodyGen, HarmonyGen, RhythmGen, ArrangeNode, SynthesizeNode, MixMasterNode, QAValidator, Exporter.  
**Workers/Queues:** NATS subjects (`lyrics.check`, `melody.make`, `chords.make`, `rhythm.make`, `arrange.make`, `synth.render`, `mix.master`, `qa.check`, `export.make`) + Redis Streams DLQ; Celery/RQ workers.  
**Datastores:** Postgres 16 (projects, versions, presets, rights), S3/R2 (MIDI/stems/mixes/presets), Redis (caches, progress), optional ClickHouse (analytics).  
**DSP Stack:** ffmpeg/sox, librosa/essentia, fluidsynth/SFZ, optional VST bridge (headless), optional DDSP timbre.  
**Observability:** OpenTelemetry + Prometheus/Grafana; Sentry.  
**Security:** TLS/HSTS/CSP, KMS, signed URLs, Postgres RLS; audit logs & rights metadata.

## 2) Data Model (summary)
- **Tenancy:** orgs, users, projects; RLS on project_id.  
- **Lyrics/Structure:** lyrics (text/meter/language/version), sections (name/order/bars/meta).  
- **MIDI/Harmony:** midi_parts (role, s3_midi, range, version), chords (progression, numerals, voicings, version).  
- **Audio/Mix:** stems (role, s3_wav, sr/bitdepth/duration, version), mixes (s3_wav, LUFS, true_peak, preset).  
- **Settings/Rights:** presets (genre/mix/master payloads), rights (license, samples, notes).  
- **Exports:** exports (kind, s3_key, meta).  
- **Audit:** audit_log (renders/edits).

**Invariants**
- Audio artifacts are immutable; new version per render.  
- Mix/master requires QA pass (or explicit override).  
- Exports embed rights/provenance.

## 3) Key Flows

### 3.1 Lyrics → Melody
1. **LyricsNode** analyzes meter/rhyme/stress; syllable map built by section.  
2. **MelodyGen** produces phrases aligned to syllables; contour and range constraints; optional seed MIDI or audio→MIDI.  
3. Editor (PianoRoll) allows quantize/swing, octave shifts.

### 3.2 Harmony & Rhythm
1. **HarmonyGen** outputs chord progressions with Roman/Nashville forms; supports reharmonization.  
2. **RhythmGen** creates drums/bass grooves; can extract groove from reference loop and transfer.

### 3.3 Arrangement & Orchestration
1. **StructurePlanner/ArrangeNode** maps sections (Verse/Chorus/Bridge etc.), instrument roles, transitions/fills; orchestration by genre & density.  
2. Reharm editor and groove controls apply non-destructively.

### 3.4 Synthesis, Mix & Master
1. **SynthesizeNode** renders MIDI to audio (SFZ/VST/DDSP) routing stems in parallel, producing WAV/FLAC and MIDI mirrors.  
2. **MixMasterNode** applies chain (gain/EQ/comp/reverb), stereo field; loudness metering; mastering presets (stream/radio).

### 3.5 QA & Exports
1. **QAValidator** checks key/scale, timing drift, tessitura, LUFS/true-peak; warns or blocks render.  
2. **Exporter** emits stems, full mix, MIDI packs, chord charts, lyric sheets, presets, JSON bundle; rights metadata included.

## 4) API Surface (/v1)
- **Auth/Users:** login/refresh/me/usage.  
- **Projects:** `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`.  
- **Lyrics:** `POST /lyrics`, `GET /lyrics/:id`.  
- **Generate:** `POST /generate/melody`, `POST /generate/chords`, `POST /generate/rhythm`, `POST /arrange`.  
- **Render:** `POST /render/stems`, `POST /render/mixmaster`.  
- **QA:** `POST /qa/check`.  
- **Export:** `POST /export/bundle`.  

**Conventions:** Idempotency‑Key on mutations; SSE for long renders; Problem+JSON errors; cursor pagination.

## 5) Observability & SLOs
- **Spans:** lyrics.analyze, melody.gen, chords.gen, arrange.run, synth.render, mix.master, qa.check, export.bundle.  
- **Metrics:** render p95, LUFS deviation, true-peak margin, key stability, timing drift, stem peak headroom.  
- **Targets:** 16‑bar melody <4s p95; full render (3‑min, 8 stems) <90s CPU SFZ / <45s neural cached; master <10s; preview start <250ms.

## 6) Security & Governance
- RLS tenant isolation; RBAC via Casbin.  
- KMS‑wrapped secrets; signed URLs; region‑pinned storage with lifecycle rules.  
- Rights registry for samples/plugins; provenance tags on outputs.  
- Audit trail; export/delete APIs.

## 7) Performance & Scaling
- Warm instrument instances; parallel stem rendering; job fan‑out by section/stem.  
- Motif/embedding caches; chunked transfers; CDN previews.  
- DLQ + retries with jitter; worker pools for DSP vs orchestration.  
- Optional GPU for neural timbre; CPU pools for SFZ/VST.

## 8) Accessibility & i18n
- Keyboard‑first DAW controls; ARIA on timeline/mixer; color‑blind friendly meters.  
- next‑intl localization; Nashville/roman numeral display options; transposition & capo in song sheets.