# AI Music Collaborator — TODO (V1, Phased)

> Owner tags: **[FE]**, **[BE]**, **[MLE]**, **[DSP]**, **[SRE]**, **[QA]**, **[PM]**  
> Max **5** phases; grouped into big execution blocks.

---

## Phase 1: Foundations, Infra & Prosody Tools
- [x] [PM][SRE] Monorepo setup (`/frontend`, `/api`, `/workers`, `/infra`, `/docs`); CODEOWNERS.
- [x] [SRE] CI/CD (lint/typecheck/tests, Docker build, scan/sign, deploy dev/staging).
- [x] [SRE] Infra: Postgres 16, Redis, NATS, S3/R2, optional ClickHouse; KMS for secrets; CDN for previews.
- [x] [BE] Base API (NestJS): OpenAPI 3.1, Zod, Problem+JSON, RBAC (Casbin), RLS; Request‑ID & Idempotency‑Key.
- [x] [BE] DB migrations: orgs/users/projects/lyrics/sections/midi_parts/chords/stems/mixes/presets/rights/exports/audit_log.
- [x] [FE] LyricsEditor (meter/rhyme/stress, syllable counter, rhyme suggestions).
- [x] [DSP][BE] Audio→MIDI seed (pitch tracking via librosa/essentia); upload endpoints; signed URLs.
- [x] [QA] Unit tests: meter alignment, rhyme detection, audio→MIDI accuracy; RLS coverage.

---

## Phase 2: LangGraph Core (Melody/Harmony/Rhythm) ✅
- [x] [BE][MLE] LangGraph scaffold + nodes: LyricsNode, StructurePlanner, MelodyGen, HarmonyGen, RhythmGen.
- [x] [MLE] MelodyGen: syllable-to-note mapping, contour constraints, melisma control; key/tempo aware.
- [x] [MLE] HarmonyGen: progressions, cadences, Roman/Nashville output; reharmonization options.
- [x] [MLE][DSP] RhythmGen: drums/bass patterns; groove extraction/transfer from reference loop.
- [x] [BE] APIs: `POST /generate/melody`, `POST /generate/chords`, `POST /generate/rhythm` (SSE for progress).
- [x] [FE] PianoRoll, ChordLane, DrumGrid editors; timeline skeleton.
- [x] [QA] Integration: lyrics→melody→chords→rhythm; prosody & key checks.

---

## Phase 3: Arrangement, Orchestration & Editors ✅
- [x] [BE][MLE] ArrangeNode: sections (Verse/Chorus/Bridge, AABA), instrument roles, transitions/fills.
- [x] [FE] Timeline with sections, region editing, automation lanes; PresetPicker for genre/arrangement templates.
- [x] [FE] Reharm editor (secondary dominants, modal interchange); groove/swing controls.
- [x] [BE] Guards: prosody clashes, non‑diatonic warnings; save versions for takes.
- [x] [QA] Authoring E2E: lyrics→gen→arrange; diff between takes; undo/redo flows.

---

## Phase 4: Synthesis, Mix/Master & QA ✅
- [x] [DSP] SynthesizeNode: SFZ/SF2 via fluidsynth; optional VST bridge; optional neural timbre (DDSP) with licensing check.
- [x] [DSP] Parallel stem rendering; click track; MIDI mirrors; stem routing & bounces.
- [x] [DSP] MixMasterNode: gain staging, EQ/comp/reverb sends, stereo field; mastering presets (streaming/radio), LUFS & true‑peak metering.
- [x] [MLE] QAValidator: key/scale stability, timing/quantize drift, vocal range/tessitura, LUFS targets; override workflow.
- [x] [FE] Mixer UI (meters, sends, FX chains) + Render page with live meters via WS; audio preview player.
- [x] [QA] Audio QA: LUFS ±0.5, true‑peak ≤ −1.0 dBTP, no clipping; timing drift < 5 ms.

---

## Phase 5: Exports, Governance, Observability & Security ✅
### Exports ✅
- [x] [BE] Exporter: stems (WAV/FLAC), full mix, MIDI packs, chord charts (Nashville/roman), lyric sheets, mixer presets, JSON bundle for DAW; signed URLs.
- [x] [FE] ExportWizard: select stems/formats; include rights metadata; create share links.

### Governance & Policy ✅
- [x] [BE] Rights registry: license notes, sample usage attestations; provenance tags.
- [x] [BE] Content policy filters (no hateful/explicit lyrics if enabled); "style descriptors only."
- [x] [BE] Versioning model: immutable audio artifacts; audit logs.

### Observability & SRE ✅
- [x] [SRE] OTel spans: lyrics.analyze, melody.gen, chords.gen, arrange.run, synth.render, mix.master, qa.check, export.bundle.
- [x] [SRE] Dashboards (Prometheus/Grafana), Sentry alerts; DLQ runbooks; render node health checks.
- [x] [SRE] Load/chaos: render timeouts, VST crashes, missing soundfonts; retries/backoff.

### Security & Perf ✅
- [x] [BE] Rate limits per org/IP; RLS enforcement tests; KMS‑wrapped secrets; signed URLs.
- [x] [DSP] Warm instrument instances; cache motifs/embeddings; CDN previews; chunked transfers.

### Testing ✅
- [x] [QA] Integration: lyrics→melody→chords→arrange→render→master→export.
- [x] [QA] E2E (Playwright): create project → paste lyrics → generate → render stems → download bundle.
- [x] [QA] Property tests: reharm cadence validity; voice‑leading constraints.

---

## Definition of Done ✅
- [x] Delivered with API spec + tests; FE states (loading/empty/error); SLOs met; accessibility pass; exports reproducible with rights metadata.