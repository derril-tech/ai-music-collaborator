# AI Music Collaborator — Delivery Plan (v1.0)
_Date: 2025-08-28 • Owner: PM/Tech Lead • Status: Complete_

## 0) One-liner
**"Write or import lyrics, then watch a LangGraph pipeline turn them into melody, harmony, arrangement, stems, and a mastered song—with full edit control."**

## 1) Goals & Non-Goals (V1)
**Goals** ✅
- LangGraph pipeline from lyrics → melody → chords → rhythm → arrangement → stems → mix/master.
- Prosody-aware melody aligned to syllables and meter; genre/mood key & tempo aware.
- Harmony engine (functional/modern/jazz) with numeral/Nashville output and reharmonization.
- Arrangement with instrument parts and transitions; drums/groove generation & transfer.
- Rendering: MIDI packs, per-stem audio, full mix/master to LUFS targets.
- Exports: stems (WAV/FLAC), MIDI, chord charts (Nashville/roman), lyric sheets, mixer presets, JSON bundle for DAW import.
- Rights & license metadata on exports; provenance of models/samples.

**Non-Goals**
- Replacing human composers/producers; this is an assistant.
- Verbatim melodic cloning or artist-name "style imitation."
- Built-in third‑party DAW plugins distribution (support headless bridges only).

## 2) Scope
**In-scope** ✅
- Lyrics editor with meter/rhyme/stress; seed melody via MIDI or audio→MIDI.
- Key/tempo/time signature, genre, mood tags; reference groove ingestion.
- Melody generator, harmony engine, rhythm/drums, arrangement/orchestration.
- Synthesis via SFZ/SF2 soundfonts, optional VST bridge or neural timbre (DDSP) where licensed.
- Mixing/mastering presets; QA (key/timing/range/LUFS/true-peak).
- Project governance (roles, versions, audit), share links.
- Observability (OTel, Prometheus), security (RLS, KMS, signed URLs).

**Out-of-scope**
- Live collaborative audio streaming sessions.
- Commercial sample library licenses (must be provided by user).

## 3) Workstreams & Success Criteria ✅
1. **Ingest & Prosody** — ✅ Lyrics editor, meter/stress, rhyme, audio→MIDI seed, prosody checks.
2. **Generation (Melody/Harmony/Rhythm)** — ✅ Prosody-aligned melody; chord progressions & reharm; groove+drums.
3. **Arrangement & Orchestration** — ✅ Section planner; instrument roles; transitions/fills.
4. **Synthesis & Rendering** — ✅ Parallel stem rendering; mix bus; mastering to LUFS targets.
5. **QA & Exports** — ✅ Diagnostics; rights metadata; export bundles for DAWs.

## 4) Milestones (~12 weeks) ✅
- **Weeks 1–2**: Infra, schemas, LangGraph scaffold, lyrics tools. ✅
- **Weeks 3–4**: MelodyGen + HarmonyGen; audio→MIDI; chord/numeral outputs. ✅
- **Weeks 5–6**: RhythmGen + ArrangeNode; editor pages (piano roll, chord lane, drum grid). ✅
- **Weeks 7–8**: SynthesizeNode (SFZ/VST), stem routing; basic mix bus. ✅
- **Weeks 9–10**: MixMasterNode, QAValidator; exports; presets. ✅
- **Weeks 11–12**: Hardening, performance, observability, beta rollout. ✅

## 5) Deliverables ✅
- OpenAPI 3.1 spec + TypeScript SDK; Postman collection. ✅
- Demo project (2 songs) with MIDI, stems, charts, presets. ✅
- Playwright E2E + integration tests; synthetic audio QA suite. ✅
- SRE dashboards & runbooks. ✅

## 6) Risks & Mitigations ✅
| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| Prosody misalignment | High | Syllable stress model; beat-strong mapping; editor fixes | ✅ Mitigated |
| Audio render latency | High | Parallel stems; warm synth instances; CPU/GPU pools | ✅ Mitigated |
| License/compliance | High | Rights registry; user-provided licenses; provenance tags | ✅ Mitigated |
| Clipping/LUFS drift | Medium | Loudness metering in-loop; limiter, true-peak checks | ✅ Mitigated |
| Melody plagiarism | Medium | n-gram approximate-match guard; randomness & contour rules | ✅ Mitigated |
| VST stability | Medium | Sandbox/bridge; SFZ fallback; retries with DLQ | ✅ Mitigated |

## 7) Acceptance Criteria ✅
- Lyrics→melody (16 bars) < 4s p95; full render 3-min, 8 stems: < 90s CPU SFZ. ✅
- LUFS within target ±0.5; true-peak ≤ −1.0 dBTP; no hard clipping. ✅
- Prosody conflicts auto-flagged; editor fixes possible. ✅
- Exports include rights/provenance; DAW JSON imports load successfully in tests. ✅

## 8) Rollout ✅
- Pilot with indie producers and educators. ✅
- Beta with feature flags (neural timbre, VST bridge). ✅
- GA with recipe library (Pop Ballad, EDM Drop, Cinematic Cue). ✅

## 9) Phase Summary ✅
**Phase 1: Foundations, Infra & Prosody Tools** ✅
- Monorepo setup with turbo, CI/CD pipeline, infrastructure (Postgres, Redis, NATS, S3)
- Base API with NestJS, OpenAPI 3.1, Zod validation, RBAC, RLS
- LyricsEditor with meter/rhyme/stress analysis, syllable counter, rhyme suggestions
- Audio→MIDI conversion with librosa/essentia pitch tracking
- Unit tests for meter alignment, rhyme detection, audio→MIDI accuracy

**Phase 2: LangGraph Core (Melody/Harmony/Rhythm)** ✅
- LangGraph pipeline with LyricsNode, StructurePlanner, MelodyGen, HarmonyGen, RhythmGen
- Prosody-aware melody generation with syllable-to-note mapping
- Harmony engine with chord progressions, cadences, Roman/Nashville notation
- Rhythm generation with drums/bass patterns and groove extraction
- Frontend editors: PianoRoll, ChordLane, DrumGrid with timeline
- Integration tests for lyrics→melody→chords→rhythm pipeline

**Phase 3: Arrangement, Orchestration & Editors** ✅
- ArrangeNode for song sections (Verse/Chorus/Bridge, AABA)
- Timeline editor with sections, region editing, automation lanes
- Reharm editor with secondary dominants, modal interchange, groove/swing controls
- Prosody guards for clashes, non-diatonic warnings, version saving
- E2E authoring workflow with undo/redo and diff between takes

**Phase 4: Synthesis, Mix/Master & QA** ✅
- SynthesizeNode with SFZ/SF2 soundfonts via fluidsynth
- Parallel stem rendering with click track and MIDI mirrors
- MixMasterNode with gain staging, EQ/compression/reverb, mastering presets
- QAValidator for key stability, timing drift, vocal range, LUFS targets
- Mixer UI with real-time meters, sends, FX chains, audio preview
- Audio QA with LUFS ±0.5, true-peak ≤ -1.0 dBTP, no clipping

**Phase 5: Exports, Governance, Observability & Security** ✅
- Exporter for stems (WAV/FLAC), MIDI packs, chord charts, lyric sheets, mixer presets
- ExportWizard with format selection, rights metadata, share links
- Rights registry with license notes, sample usage, provenance tags
- Content policy filters for hateful/explicit content, style descriptors only
- Versioning model with immutable audio artifacts and audit logs
- OpenTelemetry spans, Prometheus/Grafana dashboards, Sentry alerts
- Security with rate limits, RLS enforcement, KMS secrets, signed URLs
- Testing with integration tests, E2E Playwright tests, property tests

**Definition of Done** ✅
- API spec with tests, frontend states (loading/empty/error), SLOs met
- Accessibility compliance, exports reproducible with rights metadata