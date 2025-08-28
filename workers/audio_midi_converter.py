"""
Audio to MIDI conversion using librosa and essentia for pitch tracking.
"""

import os
import numpy as np
import librosa
import essentia
import essentia.standard as es
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class NoteEvent:
    """Represents a MIDI note event."""
    pitch: int  # MIDI pitch (0-127)
    velocity: int  # MIDI velocity (0-127)
    start_time: float  # Start time in seconds
    end_time: float  # End time in seconds
    confidence: float  # Detection confidence (0-1)

@dataclass
class ConversionResult:
    """Result of audio to MIDI conversion."""
    notes: List[NoteEvent]
    detected_key: str
    detected_tempo: float
    confidence: float
    note_count: int
    duration: float

class AudioMidiConverter:
    """Converts audio files to MIDI using pitch tracking."""
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.min_confidence = 0.7
        self.min_note_duration = 0.05  # Minimum note duration in seconds
        
    def convert_audio_to_midi(
        self, 
        audio_path: str, 
        mode: str = 'full',
        confidence_threshold: float = 0.7,
        quantize: bool = True
    ) -> ConversionResult:
        """
        Convert audio file to MIDI.
        
        Args:
            audio_path: Path to audio file
            mode: Conversion mode ('melody', 'harmony', 'rhythm', 'full')
            confidence_threshold: Minimum confidence for note detection
            quantize: Whether to quantize timing
            
        Returns:
            ConversionResult with notes and metadata
        """
        logger.info(f"Converting {audio_path} to MIDI (mode: {mode})")
        
        # Load audio
        y, sr = librosa.load(audio_path, sr=self.sample_rate)
        duration = len(y) / sr
        
        # Extract pitch using essentia
        pitch_contours = self._extract_pitch_contours(y)
        
        # Detect notes from pitch contours
        notes = self._detect_notes(pitch_contours, confidence_threshold)
        
        # Apply mode-specific filtering
        if mode == 'melody':
            notes = self._filter_melody_notes(notes)
        elif mode == 'harmony':
            notes = self._filter_harmony_notes(notes)
        elif mode == 'rhythm':
            notes = self._filter_rhythm_notes(notes)
        
        # Quantize if requested
        if quantize:
            notes = self._quantize_notes(notes)
        
        # Detect key and tempo
        detected_key = self._detect_key(y)
        detected_tempo = self._detect_tempo(y)
        
        # Calculate overall confidence
        confidence = np.mean([note.confidence for note in notes]) if notes else 0.0
        
        return ConversionResult(
            notes=notes,
            detected_key=detected_key,
            detected_tempo=detected_tempo,
            confidence=confidence,
            note_count=len(notes),
            duration=duration
        )
    
    def _extract_pitch_contours(self, audio: np.ndarray) -> List[Dict[str, Any]]:
        """Extract pitch contours using essentia."""
        logger.info("Extracting pitch contours...")
        
        # Use essentia's PredominantPitchMelodia for robust pitch extraction
        pitch_extractor = es.PredominantPitchMelodia(
            sampleRate=self.sample_rate,
            minFrequency=80.0,
            maxFrequency=800.0,
            frameSize=2048,
            hopSize=128
        )
        
        pitch_values, pitch_confidence = pitch_extractor(audio)
        
        # Convert to time series
        frame_times = librosa.frames_to_time(
            np.arange(len(pitch_values)), 
            sr=self.sample_rate, 
            hop_length=128
        )
        
        contours = []
        for i, (time, pitch, conf) in enumerate(zip(frame_times, pitch_values, pitch_confidence)):
            if pitch > 0 and conf > 0.1:  # Filter out silence and low confidence
                contours.append({
                    'time': time,
                    'pitch': pitch,
                    'confidence': conf,
                    'midi_pitch': int(round(12 * np.log2(pitch / 440.0) + 69))
                })
        
        logger.info(f"Extracted {len(contours)} pitch points")
        return contours
    
    def _detect_notes(
        self, 
        pitch_contours: List[Dict[str, Any]], 
        confidence_threshold: float
    ) -> List[NoteEvent]:
        """Detect note events from pitch contours."""
        logger.info("Detecting notes from pitch contours...")
        
        if not pitch_contours:
            return []
        
        notes = []
        current_note = None
        
        for contour in pitch_contours:
            if contour['confidence'] < confidence_threshold:
                # End current note if confidence drops
                if current_note:
                    current_note.end_time = contour['time']
                    if current_note.end_time - current_note.start_time >= self.min_note_duration:
                        notes.append(current_note)
                    current_note = None
                continue
            
            midi_pitch = contour['midi_pitch']
            
            if current_note is None:
                # Start new note
                current_note = NoteEvent(
                    pitch=midi_pitch,
                    velocity=80,  # Default velocity
                    start_time=contour['time'],
                    end_time=contour['time'],
                    confidence=contour['confidence']
                )
            elif midi_pitch == current_note.pitch:
                # Extend current note
                current_note.end_time = contour['time']
                current_note.confidence = max(current_note.confidence, contour['confidence'])
            else:
                # Pitch changed, end current note and start new one
                if current_note.end_time - current_note.start_time >= self.min_note_duration:
                    notes.append(current_note)
                
                current_note = NoteEvent(
                    pitch=midi_pitch,
                    velocity=80,
                    start_time=contour['time'],
                    end_time=contour['time'],
                    confidence=contour['confidence']
                )
        
        # Handle final note
        if current_note and current_note.end_time - current_note.start_time >= self.min_note_duration:
            notes.append(current_note)
        
        logger.info(f"Detected {len(notes)} notes")
        return notes
    
    def _filter_melody_notes(self, notes: List[NoteEvent]) -> List[NoteEvent]:
        """Filter notes to keep only melody (highest notes at each time)."""
        if not notes:
            return []
        
        # Sort notes by start time
        notes.sort(key=lambda x: x.start_time)
        
        filtered_notes = []
        current_time = 0.0
        time_window = 0.1  # 100ms window
        
        for note in notes:
            if note.start_time >= current_time + time_window:
                # Find highest note in current window
                window_notes = [n for n in notes if 
                              n.start_time >= current_time and 
                              n.start_time < current_time + time_window]
                
                if window_notes:
                    highest_note = max(window_notes, key=lambda x: x.pitch)
                    filtered_notes.append(highest_note)
                
                current_time = note.start_time
        
        return filtered_notes
    
    def _filter_harmony_notes(self, notes: List[NoteEvent]) -> List[NoteEvent]:
        """Filter notes to keep harmony (chord tones)."""
        if not notes:
            return []
        
        # Simple harmony detection: keep notes that form common chord patterns
        harmony_notes = []
        
        for note in notes:
            # Check if note is part of common chord progressions
            pitch_class = note.pitch % 12
            
            # Common chord tones (major scale: 0, 2, 4, 5, 7, 9, 11)
            if pitch_class in [0, 2, 4, 5, 7, 9, 11]:
                harmony_notes.append(note)
        
        return harmony_notes
    
    def _filter_rhythm_notes(self, notes: List[NoteEvent]) -> List[NoteEvent]:
        """Filter notes to keep rhythm (strong beats)."""
        if not notes:
            return []
        
        # Simple rhythm detection: keep notes on strong beats
        rhythm_notes = []
        
        for note in notes:
            # Check if note starts on a strong beat (assuming 4/4 time)
            beat_position = (note.start_time * 120 / 60) % 4  # Assuming 120 BPM
            if beat_position < 0.1 or abs(beat_position - 2) < 0.1:  # On beat 1 or 3
                rhythm_notes.append(note)
        
        return rhythm_notes
    
    def _quantize_notes(self, notes: List[NoteEvent]) -> List[NoteEvent]:
        """Quantize note timing to grid."""
        if not notes:
            return []
        
        # Detect tempo for quantization
        tempo = self._detect_tempo_from_notes(notes)
        if tempo <= 0:
            return notes
        
        # Calculate grid size (16th notes)
        grid_size = 60.0 / tempo / 4
        
        quantized_notes = []
        for note in notes:
            # Quantize start and end times
            quantized_start = round(note.start_time / grid_size) * grid_size
            quantized_end = round(note.end_time / grid_size) * grid_size
            
            # Ensure minimum duration
            if quantized_end - quantized_start < self.min_note_duration:
                quantized_end = quantized_start + self.min_note_duration
            
            quantized_note = NoteEvent(
                pitch=note.pitch,
                velocity=note.velocity,
                start_time=quantized_start,
                end_time=quantized_end,
                confidence=note.confidence
            )
            quantized_notes.append(quantized_note)
        
        return quantized_notes
    
    def _detect_tempo_from_notes(self, notes: List[NoteEvent]) -> float:
        """Detect tempo from note timing patterns."""
        if len(notes) < 2:
            return 120.0  # Default tempo
        
        # Calculate intervals between note starts
        intervals = []
        for i in range(1, len(notes)):
            interval = notes[i].start_time - notes[i-1].start_time
            if interval > 0.1:  # Ignore very short intervals
                intervals.append(interval)
        
        if not intervals:
            return 120.0
        
        # Find most common interval (approximate beat)
        hist, bins = np.histogram(intervals, bins=20)
        beat_interval = bins[np.argmax(hist)]
        
        # Convert to BPM
        tempo = 60.0 / beat_interval if beat_interval > 0 else 120.0
        
        # Constrain to reasonable range
        return max(60, min(200, tempo))
    
    def _detect_key(self, audio: np.ndarray) -> str:
        """Detect musical key from audio."""
        try:
            # Use essentia's KeyExtractor
            key_extractor = es.KeyExtractor(sampleRate=self.sample_rate)
            key, scale, strength = key_extractor(audio)
            
            return f"{key} {scale}"
        except Exception as e:
            logger.warning(f"Key detection failed: {e}")
            return "C major"  # Default key
    
    def _detect_tempo(self, audio: np.ndarray) -> float:
        """Detect tempo from audio."""
        try:
            # Use librosa's tempo detection
            tempo, _ = librosa.beat.beat_track(y=audio, sr=self.sample_rate)
            return float(tempo)
        except Exception as e:
            logger.warning(f"Tempo detection failed: {e}")
            return 120.0  # Default tempo
    
    def save_midi(self, result: ConversionResult, output_path: str) -> bool:
        """Save conversion result as MIDI file."""
        try:
            import midiutil
            
            # Create MIDI file
            midi = midiutil.MidiFile.MIDIFile(1)  # 1 track
            midi.addTempo(0, 0, result.detected_tempo)
            
            # Add notes
            for note in result.notes:
                start_beat = note.start_time * result.detected_tempo / 60.0
                duration_beat = (note.end_time - note.start_time) * result.detected_tempo / 60.0
                
                midi.addNote(
                    track=0,
                    channel=0,
                    pitch=note.pitch,
                    time=start_beat,
                    duration=duration_beat,
                    volume=note.velocity
                )
            
            # Write file
            with open(output_path, 'wb') as f:
                midi.writeFile(f)
            
            logger.info(f"MIDI file saved to {output_path}")
            return True
            
        except ImportError:
            logger.error("midiutil not available, cannot save MIDI file")
            return False
        except Exception as e:
            logger.error(f"Failed to save MIDI file: {e}")
            return False
    
    def save_json(self, result: ConversionResult, output_path: str) -> bool:
        """Save conversion result as JSON."""
        try:
            data = {
                'detected_key': result.detected_key,
                'detected_tempo': result.detected_tempo,
                'confidence': result.confidence,
                'note_count': result.note_count,
                'duration': result.duration,
                'notes': [
                    {
                        'pitch': note.pitch,
                        'velocity': note.velocity,
                        'start_time': note.start_time,
                        'end_time': note.end_time,
                        'confidence': note.confidence
                    }
                    for note in result.notes
                ]
            }
            
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"JSON file saved to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save JSON file: {e}")
            return False

def main():
    """Example usage."""
    converter = AudioMidiConverter()
    
    # Example conversion
    audio_path = "example.wav"
    if os.path.exists(audio_path):
        result = converter.convert_audio_to_midi(
            audio_path,
            mode='full',
            confidence_threshold=0.7,
            quantize=True
        )
        
        print(f"Conversion complete:")
        print(f"  Key: {result.detected_key}")
        print(f"  Tempo: {result.detected_tempo:.1f} BPM")
        print(f"  Notes: {result.note_count}")
        print(f"  Confidence: {result.confidence:.2f}")
        
        # Save results
        converter.save_midi(result, "output.mid")
        converter.save_json(result, "output.json")

if __name__ == "__main__":
    main()
