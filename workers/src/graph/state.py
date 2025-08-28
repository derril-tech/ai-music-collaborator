"""State management for the music generation pipeline."""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from dataclasses import dataclass


@dataclass
class MusicState:
    """State object for the music generation pipeline."""
    
    # Project metadata
    project_id: str
    lyrics: str = ""
    genre: str = "pop"
    key: str = "C"
    tempo: int = 120
    time_signature: str = "4/4"
    mood: str = "happy"
    
    # Analysis results
    meter_analysis: Optional[Dict[str, Any]] = None
    rhyme_scheme: Optional[Dict[str, Any]] = None
    stress_pattern: Optional[Dict[str, Any]] = None
    
    # Structure
    sections: Optional[List[Dict[str, Any]]] = None
    structure_plan: Optional[Dict[str, Any]] = None
    
    # Generated content
    melody: Optional[Dict[str, Any]] = None
    harmony: Optional[Dict[str, Any]] = None
    rhythm: Optional[Dict[str, Any]] = None
    arrangement: Optional[Dict[str, Any]] = None
    
    # Audio
    stems: Optional[Dict[str, str]] = None  # role -> s3_key
    mix: Optional[Dict[str, Any]] = None
    master: Optional[Dict[str, Any]] = None
    
    # QA results
    qa_results: Optional[Dict[str, Any]] = None
    
    # Export
    exports: Optional[Dict[str, str]] = None  # type -> s3_key
    
    # Metadata
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    processing_time: Optional[float] = None


class LyricsAnalysis(BaseModel):
    """Results from lyrics analysis."""
    meter: Dict[str, Any]
    rhyme_scheme: Dict[str, Any]
    stress_pattern: Dict[str, Any]
    syllable_count: int
    word_count: int
    line_count: int


class MelodyData(BaseModel):
    """Melody generation data."""
    notes: List[Dict[str, Any]]
    contour: List[int]
    range_low: int
    range_high: int
    duration: float
    midi_data: Optional[bytes] = None


class HarmonyData(BaseModel):
    """Harmony generation data."""
    progression: List[str]
    numerals: List[str]
    voicings: List[List[int]]
    cadences: List[str]


class RhythmData(BaseModel):
    """Rhythm generation data."""
    pattern: List[Dict[str, Any]]
    groove: Dict[str, Any]
    velocity_map: Dict[str, int]
    swing: float = 0.0


class ArrangementData(BaseModel):
    """Arrangement data."""
    sections: List[Dict[str, Any]]
    instruments: Dict[str, Dict[str, Any]]
    transitions: List[Dict[str, Any]]
    dynamics: Dict[str, float]


class AudioStem(BaseModel):
    """Audio stem data."""
    role: str
    s3_key: str
    sample_rate: int = 44100
    bit_depth: int = 24
    duration: float
    format: str = "wav"


class MixData(BaseModel):
    """Mix data."""
    stems: Dict[str, AudioStem]
    levels: Dict[str, float]
    pan: Dict[str, float]
    effects: Dict[str, Dict[str, Any]]


class MasterData(BaseModel):
    """Master data."""
    lufs: float
    true_peak: float
    dynamic_range: float
    preset: str
    settings: Dict[str, Any]


class QAResults(BaseModel):
    """QA validation results."""
    key_stability: bool
    timing_accuracy: bool
    range_check: bool
    loudness_compliance: bool
    issues: List[str]
    warnings: List[str]


class ExportData(BaseModel):
    """Export data."""
    stems: Optional[str] = None
    mix: Optional[str] = None
    midi: Optional[str] = None
    charts: Optional[str] = None
    bundle: Optional[str] = None
