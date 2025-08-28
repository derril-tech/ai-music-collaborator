import os
import numpy as np
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MusicState:
    """State object for the music generation pipeline."""
    project_id: str
    lyrics: str = ""
    genre: str = "pop"
    key: str = "C"
    tempo: int = 120
    time_signature: str = "4/4"
    mood: str = "happy"
    
    # Analysis results
    lyrics_analysis: Optional[Dict[str, Any]] = None
    structure: Optional[Any] = None
    
    # Generated content
    melody_data: Optional[Dict[str, Any]] = None
    chord_data: Optional[Dict[str, Any]] = None
    rhythm_data: Optional[Dict[str, Any]] = None
    arrangement_data: Optional[Dict[str, Any]] = None
    
    # MIDI parts
    midi_parts: List[Any] = None
    
    # Audio
    stems: List[Any] = None
    click_track: Optional[np.ndarray] = None
    midi_mirrors: List[Any] = None
    mix: Optional[Dict[str, Any]] = None
    
    # Processing flags
    synthesis_complete: bool = False
    mix_master_complete: bool = False
    qa_complete: bool = False
    export_complete: bool = False
    
    # QA and export
    qa_report: Optional[Dict[str, Any]] = None
    export_bundle: Optional[Dict[str, Any]] = None
    
    # Rights
    rights: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.midi_parts is None:
            self.midi_parts = []
        if self.stems is None:
            self.stems = []
        if self.midi_mirrors is None:
            self.midi_mirrors = []


@dataclass
class MidiPart:
    """MIDI part data."""
    role: str
    notes: List[Any]
    duration: float
    version: str
    timing_adjustments: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.timing_adjustments is None:
            self.timing_adjustments = {}


@dataclass
class Stem:
    """Audio stem data."""
    role: str
    audio_data: np.ndarray
    sample_rate: int
    bit_depth: int
    duration: float
    version: str


@dataclass
class SongStructure:
    """Song structure data."""
    sections: List[Dict[str, Any]]
    tempo: int
    key: str
    time_signature: str
    total_duration: float = 0.0
    
    def __post_init__(self):
        # Calculate total duration
        total_bars = sum(section.get('bars', 0) for section in self.sections)
        self.total_duration = total_bars * 4 / self.tempo * 60  # 4 beats per bar


class LyricsNode:
    """Analyzes lyrics for meter, rhyme, and stress patterns."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[LyricsNode] Analyzing lyrics for meter and rhyme patterns")
        
        # Analyze meter and stress patterns
        analysis = {
            "meter": "iambic pentameter",
            "rhyme_scheme": "ABAB CDCD",
            "stress_pattern": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            "syllable_count": 10
        }
        
        state.lyrics_analysis = analysis
        print(f"[LyricsNode] Analysis complete: {analysis['meter']}, {analysis['rhyme_scheme']}")
        return state


class StructurePlanner:
    """Plans song structure and sections."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[StructurePlanner] Planning song structure")
        
        # Create song structure
        structure = SongStructure(
            sections=[
                {"name": "Verse", "bars": 8, "order": 1},
                {"name": "Chorus", "bars": 8, "order": 2},
                {"name": "Verse", "bars": 8, "order": 3},
                {"name": "Chorus", "bars": 8, "order": 4},
                {"name": "Bridge", "bars": 4, "order": 5},
                {"name": "Chorus", "bars": 8, "order": 6}
            ],
            tempo=120,
            key="C",
            time_signature="4/4"
        )
        
        state.structure = structure
        print(f"[StructurePlanner] Structure planned: {len(structure.sections)} sections")
        return state


class MelodyGen:
    """Generates melody based on lyrics and structure."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[MelodyGen] Generating melody from lyrics")
        
        # Generate melody notes based on lyrics analysis
        melody_data = {
            "notes": [60, 62, 64, 65, 67, 69, 71, 72],  # C major scale
            "rhythm": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
            "contour": "ascending",
            "range": {"min": 60, "max": 72}
        }
        
        # Create MIDI part for melody
        melody_part = MidiPart(
            role="melody",
            notes=melody_data["notes"],
            duration=32.0,  # 8 bars at 120 BPM
            version="1.0"
        )
        
        state.midi_parts.append(melody_part)
        state.melody_data = melody_data
        print(f"[MelodyGen] Melody generated: {len(melody_data['notes'])} notes")
        return state


class HarmonyGen:
    """Generates chord progressions and harmony."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[HarmonyGen] Generating chord progressions")
        
        # Generate chord progression
        chord_data = {
            "progression": ["C", "Am", "F", "G"],
            "numerals": ["I", "vi", "IV", "V"],
            "voicings": [
                [60, 64, 67],  # C major
                [57, 60, 64],  # A minor
                [53, 57, 60],  # F major
                [55, 59, 62]   # G major
            ]
        }
        
        # Create MIDI part for harmony
        harmony_part = MidiPart(
            role="harmony",
            notes=chord_data["voicings"],
            duration=32.0,
            version="1.0"
        )
        
        state.midi_parts.append(harmony_part)
        state.chord_data = chord_data
        print(f"[HarmonyGen] Harmony generated: {len(chord_data['progression'])} chords")
        return state


class RhythmGen:
    """Generates rhythm patterns and drums."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[RhythmGen] Generating rhythm patterns")
        
        # Generate drum pattern
        rhythm_data = {
            "kick": [1, 0, 0, 0, 1, 0, 0, 0],
            "snare": [0, 0, 1, 0, 0, 0, 1, 0],
            "hihat": [1, 1, 1, 1, 1, 1, 1, 1],
            "groove": "standard_rock"
        }
        
        # Create MIDI part for drums
        drum_part = MidiPart(
            role="drums",
            notes=rhythm_data,
            duration=32.0,
            version="1.0"
        )
        
        state.midi_parts.append(drum_part)
        state.rhythm_data = rhythm_data
        print(f"[RhythmGen] Rhythm generated: {rhythm_data['groove']} pattern")
        return state


class ArrangeNode:
    """Arranges and orchestrates the complete song."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[ArrangeNode] Arranging complete song")
        
        # Arrange all parts together
        arrangement_data = {
            "instruments": ["vocals", "piano", "bass", "drums", "strings"],
            "dynamics": {"verse": "p", "chorus": "f", "bridge": "mp"},
            "transitions": ["verse_to_chorus", "chorus_to_bridge"],
            "fills": ["drum_fill_1", "bass_fill_1"]
        }
        
        # Create arrangement MIDI part
        arrangement_part = MidiPart(
            role="arrangement",
            notes=arrangement_data,
            duration=state.structure.total_duration,
            version="1.0"
        )
        
        state.midi_parts.append(arrangement_part)
        state.arrangement_data = arrangement_data
        print(f"[ArrangeNode] Arrangement complete: {len(arrangement_data['instruments'])} instruments")
        return state


class SynthesizeNode:
    """Renders MIDI to audio using SFZ/SF2 soundfonts via fluidsynth."""
    
    def __init__(self):
        self.synth = None
        self.soundfont_path = None
        self.sample_rate = 44100
        self.bit_depth = 24
        
    def __call__(self, state: MusicState) -> MusicState:
        """Render MIDI parts to audio stems."""
        print(f"[SynthesizeNode] Starting synthesis for {len(state.midi_parts)} parts")
        
        # Initialize fluidsynth if not already done
        if not self.synth:
            self._init_synth()
        
        # Render each stem in parallel
        stems = []
        for part in state.midi_parts:
            stem = self._render_stem(part)
            stems.append(stem)
        
        # Generate click track
        click_track = self._generate_click_track(state.structure)
        
        # Create MIDI mirrors (copy of original MIDI with timing adjustments)
        midi_mirrors = self._create_midi_mirrors(state.midi_parts)
        
        # Update state
        state.stems = stems
        state.click_track = click_track
        state.midi_mirrors = midi_mirrors
        state.synthesis_complete = True
        
        print(f"[SynthesizeNode] Synthesis complete: {len(stems)} stems, click track, {len(midi_mirrors)} MIDI mirrors")
        return state
    
    def _init_synth(self):
        """Initialize fluidsynth with default soundfont."""
        try:
            import fluidsynth
            self.synth = fluidsynth.Synth()
            self.synth.start()
            
            # Load default soundfont (user can override)
            self.soundfont_path = os.getenv('SOUNDFONT_PATH', '/usr/share/sounds/sf2/FluidR3_GM.sf2')
            if os.path.exists(self.soundfont_path):
                self.synth.sfload(self.soundfont_path)
                print(f"[SynthesizeNode] Loaded soundfont: {self.soundfont_path}")
            else:
                print(f"[SynthesizeNode] Warning: Soundfont not found at {self.soundfont_path}")
                
        except ImportError:
            print("[SynthesizeNode] Warning: fluidsynth not available, using mock synthesis")
            self.synth = None
    
    def _render_stem(self, midi_part: MidiPart) -> Stem:
        """Render a single MIDI part to audio stem."""
        if not self.synth:
            # Mock rendering for development
            duration = midi_part.duration or 180.0  # 3 minutes default
            sample_count = int(duration * self.sample_rate)
            audio_data = np.random.randn(sample_count) * 0.1  # Mock audio
        else:
            # Real fluidsynth rendering
            audio_data = self._render_with_fluidsynth(midi_part)
        
        # Create stem object
        stem = Stem(
            role=midi_part.role,
            audio_data=audio_data,
            sample_rate=self.sample_rate,
            bit_depth=self.bit_depth,
            duration=len(audio_data) / self.sample_rate,
            version=midi_part.version
        )
        
        return stem
    
    def _render_with_fluidsynth(self, midi_part: MidiPart) -> np.ndarray:
        """Render MIDI using fluidsynth."""
        # This would contain the actual fluidsynth rendering logic
        # For now, return mock audio data
        duration = midi_part.duration or 180.0
        sample_count = int(duration * self.sample_rate)
        return np.random.randn(sample_count) * 0.1
    
    def _generate_click_track(self, structure: SongStructure) -> np.ndarray:
        """Generate click track based on song structure."""
        # Calculate total duration from structure
        total_bars = sum(section.bars for section in structure.sections)
        duration = total_bars * 4 / structure.tempo * 60  # 4 beats per bar
        
        sample_count = int(duration * self.sample_rate)
        click_track = np.zeros(sample_count)
        
        # Generate click pattern (quarter notes)
        beat_samples = int(self.sample_rate * 60 / structure.tempo)
        for i in range(0, sample_count, beat_samples):
            if i < len(click_track):
                click_track[i] = 0.5  # Click sound
        
        return click_track
    
    def _create_midi_mirrors(self, midi_parts: List[MidiPart]) -> List[MidiPart]:
        """Create timing-adjusted copies of MIDI parts."""
        mirrors = []
        for part in midi_parts:
            # Create a copy with potential timing adjustments
            mirror = MidiPart(
                role=f"{part.role}_mirror",
                notes=part.notes.copy(),
                duration=part.duration,
                version=part.version,
                timing_adjustments={}  # Could contain quantization info
            )
            mirrors.append(mirror)
        
        return mirrors


class MixMasterNode:
    """Applies mixing and mastering to audio stems."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[MixMasterNode] Starting mix and master process")
        
        # Apply gain staging
        mixed_stems = self._apply_gain_staging(state.stems)
        
        # Apply EQ and compression
        processed_stems = self._apply_processing(mixed_stems)
        
        # Create stereo mix
        stereo_mix = self._create_stereo_mix(processed_stems)
        
        # Apply mastering
        mastered_mix = self._apply_mastering(stereo_mix)
        
        # Calculate LUFS and true-peak
        lufs = self._calculate_lufs(mastered_mix)
        true_peak = self._calculate_true_peak(mastered_mix)
        
        # Create mix object
        mix = {
            "audio_data": mastered_mix,
            "lufs": lufs,
            "true_peak": true_peak,
            "sample_rate": state.stems[0].sample_rate if state.stems else 44100,
            "bit_depth": state.stems[0].bit_depth if state.stems else 24,
            "version": "1.0"
        }
        
        state.mix = mix
        state.mix_master_complete = True
        
        print(f"[MixMasterNode] Mix/master complete: LUFS={lufs:.1f}, True Peak={true_peak:.1f}")
        return state
    
    def _apply_gain_staging(self, stems: List[Stem]) -> List[Stem]:
        """Apply gain staging to stems."""
        # Mock gain staging
        return stems
    
    def _apply_processing(self, stems: List[Stem]) -> List[Stem]:
        """Apply EQ and compression."""
        # Mock processing
        return stems
    
    def _create_stereo_mix(self, stems: List[Stem]) -> np.ndarray:
        """Create stereo mix from stems."""
        if not stems:
            return np.zeros((2, 44100))  # 1 second of silence
        
        # Mock stereo mix
        max_length = max(len(stem.audio_data) for stem in stems)
        stereo_mix = np.zeros((2, max_length))
        
        for stem in stems:
            # Add stem to mix (simplified)
            if len(stem.audio_data) <= max_length:
                stereo_mix[0, :len(stem.audio_data)] += stem.audio_data * 0.1
                stereo_mix[1, :len(stem.audio_data)] += stem.audio_data * 0.1
        
        return stereo_mix
    
    def _apply_mastering(self, stereo_mix: np.ndarray) -> np.ndarray:
        """Apply mastering chain."""
        # Mock mastering
        return stereo_mix
    
    def _calculate_lufs(self, audio: np.ndarray) -> float:
        """Calculate LUFS (Loudness Units Full Scale)."""
        # Mock LUFS calculation
        return -14.0
    
    def _calculate_true_peak(self, audio: np.ndarray) -> float:
        """Calculate true peak level."""
        # Mock true peak calculation
        return -1.0


class QAValidator:
    """Validates quality and technical requirements."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[QAValidator] Starting quality validation")
        
        # Check key stability
        key_stable = self._check_key_stability(state)
        
        # Check timing drift
        timing_ok = self._check_timing_drift(state)
        
        # Check vocal range
        range_ok = self._check_vocal_range(state)
        
        # Check LUFS targets
        lufs_ok = self._check_lufs_targets(state)
        
        # Create QA report
        qa_report = {
            "key_stable": key_stable,
            "timing_ok": timing_ok,
            "range_ok": range_ok,
            "lufs_ok": lufs_ok,
            "overall_pass": all([key_stable, timing_ok, range_ok, lufs_ok]),
            "warnings": [],
            "errors": []
        }
        
        state.qa_report = qa_report
        state.qa_complete = True
        
        print(f"[QAValidator] QA complete: {'PASS' if qa_report['overall_pass'] else 'FAIL'}")
        return state
    
    def _check_key_stability(self, state: MusicState) -> bool:
        """Check if key remains stable throughout the song."""
        # Mock key stability check
        return True
    
    def _check_timing_drift(self, state: MusicState) -> bool:
        """Check for timing drift issues."""
        # Mock timing drift check
        return True
    
    def _check_vocal_range(self, state: MusicState) -> bool:
        """Check if melody is within vocal range."""
        # Mock vocal range check
        return True
    
    def _check_lufs_targets(self, state: MusicState) -> bool:
        """Check if LUFS meets targets."""
        if not state.mix:
            return True
        
        lufs = state.mix.get("lufs", -14.0)
        return -16.0 <= lufs <= -12.0  # Streaming target range


class Exporter:
    """Exports final audio and metadata."""
    
    def __call__(self, state: MusicState) -> MusicState:
        print("[Exporter] Starting export process")
        
        # Export stems
        stem_exports = self._export_stems(state.stems)
        
        # Export full mix
        mix_export = self._export_mix(state.mix)
        
        # Export MIDI
        midi_export = self._export_midi(state.midi_parts)
        
        # Export chord charts
        chord_export = self._export_chord_charts(state.chord_data)
        
        # Export lyric sheets
        lyric_export = self._export_lyric_sheets(state.lyrics)
        
        # Create export bundle
        export_bundle = {
            "stems": stem_exports,
            "mix": mix_export,
            "midi": midi_export,
            "chord_charts": chord_export,
            "lyric_sheets": lyric_export,
            "metadata": {
                "version": "1.0",
                "created_at": "2024-01-01T00:00:00Z",
                "rights": state.rights,
                "provenance": {
                    "models_used": ["melody_gen_v1", "harmony_gen_v1"],
                    "samples_used": [],
                    "license": "CC-BY-NC"
                }
            }
        }
        
        state.export_bundle = export_bundle
        state.export_complete = True
        
        print(f"[Exporter] Export complete: {len(stem_exports)} stems, mix, MIDI, charts, lyrics")
        return state
    
    def _export_stems(self, stems: List[Stem]) -> List[dict]:
        """Export individual stems."""
        exports = []
        for stem in stems:
            export = {
                "role": stem.role,
                "format": "WAV",
                "sample_rate": stem.sample_rate,
                "bit_depth": stem.bit_depth,
                "duration": stem.duration,
                "file_size": len(stem.audio_data) * 4  # Mock file size
            }
            exports.append(export)
        return exports
    
    def _export_mix(self, mix: dict) -> dict:
        """Export full mix."""
        if not mix:
            return {}
        
        return {
            "format": "WAV",
            "sample_rate": mix.get("sample_rate", 44100),
            "bit_depth": mix.get("bit_depth", 24),
            "lufs": mix.get("lufs", -14.0),
            "true_peak": mix.get("true_peak", -1.0),
            "file_size": len(mix.get("audio_data", [])) * 8  # Mock file size
        }
    
    def _export_midi(self, midi_parts: List[MidiPart]) -> List[dict]:
        """Export MIDI files."""
        exports = []
        for part in midi_parts:
            export = {
                "role": part.role,
                "format": "MIDI",
                "duration": part.duration,
                "note_count": len(part.notes) if isinstance(part.notes, list) else 0,
                "file_size": 1024  # Mock file size
            }
            exports.append(export)
        return exports
    
    def _export_chord_charts(self, chord_data: dict) -> dict:
        """Export chord charts in Nashville and Roman numeral formats."""
        if not chord_data:
            return {}
        
        return {
            "nashville": chord_data.get("numerals", []),
            "roman": chord_data.get("numerals", []),
            "chords": chord_data.get("progression", []),
            "format": "PDF"
        }
    
    def _export_lyric_sheets(self, lyrics: str) -> dict:
        """Export lyric sheets."""
        if not lyrics:
            return {}
        
        return {
            "text": lyrics,
            "format": "PDF",
            "page_count": 1
        }



