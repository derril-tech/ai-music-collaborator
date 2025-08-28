"""
Unit tests for audio to MIDI conversion functionality.
"""

import unittest
import numpy as np
import tempfile
import os
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path to import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_midi_converter import AudioMidiConverter, NoteEvent, ConversionResult

class TestAudioMidiConverter(unittest.TestCase):
    """Test cases for AudioMidiConverter class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = AudioMidiConverter()
        
        # Create mock audio data
        self.sample_rate = 44100
        self.duration = 2.0  # 2 seconds
        self.t = np.linspace(0, self.duration, int(self.sample_rate * self.duration))
        
        # Create a simple sine wave (440 Hz)
        self.mock_audio = np.sin(2 * np.pi * 440 * self.t)
        
        # Create mock pitch contours
        self.mock_pitch_contours = [
            {'time': 0.0, 'pitch': 440.0, 'confidence': 0.9, 'midi_pitch': 69},
            {'time': 0.1, 'pitch': 440.0, 'confidence': 0.9, 'midi_pitch': 69},
            {'time': 0.2, 'pitch': 440.0, 'confidence': 0.9, 'midi_pitch': 69},
            {'time': 0.3, 'pitch': 0.0, 'confidence': 0.1, 'midi_pitch': 0},  # Silence
            {'time': 0.4, 'pitch': 523.25, 'confidence': 0.8, 'midi_pitch': 72},  # C5
            {'time': 0.5, 'pitch': 523.25, 'confidence': 0.8, 'midi_pitch': 72},
            {'time': 0.6, 'pitch': 523.25, 'confidence': 0.8, 'midi_pitch': 72},
        ]
    
    def test_note_event_creation(self):
        """Test NoteEvent dataclass creation."""
        note = NoteEvent(
            pitch=69,
            velocity=80,
            start_time=0.0,
            end_time=0.5,
            confidence=0.9
        )
        
        self.assertEqual(note.pitch, 69)
        self.assertEqual(note.velocity, 80)
        self.assertEqual(note.start_time, 0.0)
        self.assertEqual(note.end_time, 0.5)
        self.assertEqual(note.confidence, 0.9)
    
    def test_conversion_result_creation(self):
        """Test ConversionResult dataclass creation."""
        notes = [
            NoteEvent(pitch=69, velocity=80, start_time=0.0, end_time=0.5, confidence=0.9),
            NoteEvent(pitch=72, velocity=80, start_time=0.5, end_time=1.0, confidence=0.8),
        ]
        
        result = ConversionResult(
            notes=notes,
            detected_key="C major",
            detected_tempo=120.0,
            confidence=0.85,
            note_count=2,
            duration=2.0
        )
        
        self.assertEqual(len(result.notes), 2)
        self.assertEqual(result.detected_key, "C major")
        self.assertEqual(result.detected_tempo, 120.0)
        self.assertEqual(result.confidence, 0.85)
        self.assertEqual(result.note_count, 2)
        self.assertEqual(result.duration, 2.0)
    
    @patch('audio_midi_converter.librosa.load')
    @patch('audio_midi_converter.es.PredominantPitchMelodia')
    @patch('audio_midi_converter.es.KeyExtractor')
    @patch('audio_midi_converter.librosa.beat.beat_track')
    def test_convert_audio_to_midi_full_mode(self, mock_beat_track, mock_key_extractor, mock_pitch_extractor, mock_load):
        """Test full mode audio to MIDI conversion."""
        # Mock librosa.load
        mock_load.return_value = (self.mock_audio, self.sample_rate)
        
        # Mock pitch extraction
        mock_pitch_extractor_instance = MagicMock()
        mock_pitch_extractor_instance.return_value = (
            np.array([440.0, 440.0, 440.0, 0.0, 523.25, 523.25, 523.25]),
            np.array([0.9, 0.9, 0.9, 0.1, 0.8, 0.8, 0.8])
        )
        mock_pitch_extractor.return_value = mock_pitch_extractor_instance
        
        # Mock key detection
        mock_key_extractor_instance = MagicMock()
        mock_key_extractor_instance.return_value = ("C", "major", 0.8)
        mock_key_extractor.return_value = mock_key_extractor_instance
        
        # Mock tempo detection
        mock_beat_track.return_value = (120.0, np.array([0, 0.5, 1.0, 1.5]))
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(b'mock audio data')
            temp_file_path = temp_file.name
        
        try:
            result = self.converter.convert_audio_to_midi(
                temp_file_path,
                mode='full',
                confidence_threshold=0.7,
                quantize=True
            )
            
            # Verify result structure
            self.assertIsInstance(result, ConversionResult)
            self.assertIsInstance(result.notes, list)
            self.assertIsInstance(result.detected_key, str)
            self.assertIsInstance(result.detected_tempo, float)
            self.assertIsInstance(result.confidence, float)
            self.assertIsInstance(result.note_count, int)
            self.assertIsInstance(result.duration, float)
            
            # Verify note detection
            self.assertGreater(len(result.notes), 0)
            for note in result.notes:
                self.assertIsInstance(note, NoteEvent)
                self.assertGreaterEqual(note.pitch, 0)
                self.assertLessEqual(note.pitch, 127)
                self.assertGreaterEqual(note.velocity, 0)
                self.assertLessEqual(note.velocity, 127)
                self.assertGreaterEqual(note.confidence, 0.0)
                self.assertLessEqual(note.confidence, 1.0)
                self.assertGreaterEqual(note.end_time, note.start_time)
            
        finally:
            os.unlink(temp_file_path)
    
    def test_detect_notes_from_pitch_contours(self):
        """Test note detection from pitch contours."""
        notes = self.converter._detect_notes(self.mock_pitch_contours, confidence_threshold=0.7)
        
        # Should detect 2 notes (A4 and C5)
        self.assertEqual(len(notes), 2)
        
        # First note should be A4 (MIDI pitch 69)
        self.assertEqual(notes[0].pitch, 69)
        self.assertEqual(notes[0].start_time, 0.0)
        self.assertEqual(notes[0].end_time, 0.2)
        self.assertGreaterEqual(notes[0].confidence, 0.9)
        
        # Second note should be C5 (MIDI pitch 72)
        self.assertEqual(notes[1].pitch, 72)
        self.assertEqual(notes[1].start_time, 0.4)
        self.assertEqual(notes[1].end_time, 0.6)
        self.assertGreaterEqual(notes[1].confidence, 0.8)
    
    def test_filter_melody_notes(self):
        """Test melody note filtering."""
        notes = [
            NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.5, confidence=0.8),  # C4
            NoteEvent(pitch=64, velocity=80, start_time=0.1, end_time=0.6, confidence=0.9),  # E4
            NoteEvent(pitch=67, velocity=80, start_time=0.2, end_time=0.7, confidence=0.7),  # G4
            NoteEvent(pitch=72, velocity=80, start_time=0.5, end_time=1.0, confidence=0.9),  # C5
        ]
        
        melody_notes = self.converter._filter_melody_notes(notes)
        
        # Should keep highest notes in each time window
        self.assertLessEqual(len(melody_notes), len(notes))
        
        # Verify that filtered notes are indeed the highest in their time windows
        for note in melody_notes:
            overlapping_notes = [n for n in notes if 
                               n.start_time < note.end_time and 
                               n.end_time > note.start_time]
            highest_pitch = max(n.pitch for n in overlapping_notes)
            self.assertEqual(note.pitch, highest_pitch)
    
    def test_filter_harmony_notes(self):
        """Test harmony note filtering."""
        notes = [
            NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.5, confidence=0.8),  # C (chord tone)
            NoteEvent(pitch=61, velocity=80, start_time=0.1, end_time=0.6, confidence=0.9),  # C# (not chord tone)
            NoteEvent(pitch=64, velocity=80, start_time=0.2, end_time=0.7, confidence=0.7),  # E (chord tone)
            NoteEvent(pitch=67, velocity=80, start_time=0.3, end_time=0.8, confidence=0.9),  # G (chord tone)
        ]
        
        harmony_notes = self.converter._filter_harmony_notes(notes)
        
        # Should keep only chord tones (C, E, G)
        expected_pitches = {60, 64, 67}  # C, E, G
        actual_pitches = {note.pitch for note in harmony_notes}
        self.assertEqual(actual_pitches, expected_pitches)
    
    def test_quantize_notes(self):
        """Test note quantization."""
        notes = [
            NoteEvent(pitch=60, velocity=80, start_time=0.12, end_time=0.48, confidence=0.8),
            NoteEvent(pitch=64, velocity=80, start_time=0.53, end_time=0.87, confidence=0.9),
        ]
        
        quantized_notes = self.converter._quantize_notes(notes)
        
        # Should have same number of notes
        self.assertEqual(len(quantized_notes), len(notes))
        
        # Times should be quantized to grid
        for note in quantized_notes:
            # Check that start and end times are reasonable
            self.assertGreaterEqual(note.start_time, 0.0)
            self.assertGreaterEqual(note.end_time, note.start_time)
            self.assertGreaterEqual(note.end_time - note.start_time, self.converter.min_note_duration)
    
    def test_detect_tempo_from_notes(self):
        """Test tempo detection from note timing."""
        notes = [
            NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.5, confidence=0.8),
            NoteEvent(pitch=64, velocity=80, start_time=0.5, end_time=1.0, confidence=0.9),
            NoteEvent(pitch=67, velocity=80, start_time=1.0, end_time=1.5, confidence=0.7),
            NoteEvent(pitch=72, velocity=80, start_time=1.5, end_time=2.0, confidence=0.9),
        ]
        
        tempo = self.converter._detect_tempo_from_notes(notes)
        
        # Should detect 120 BPM (0.5 second intervals)
        self.assertAlmostEqual(tempo, 120.0, delta=10.0)
    
    @patch('audio_midi_converter.es.KeyExtractor')
    def test_detect_key(self, mock_key_extractor):
        """Test key detection."""
        mock_key_extractor_instance = MagicMock()
        mock_key_extractor_instance.return_value = ("C", "major", 0.8)
        mock_key_extractor.return_value = mock_key_extractor_instance
        
        key = self.converter._detect_key(self.mock_audio)
        
        self.assertEqual(key, "C major")
    
    @patch('audio_midi_converter.librosa.beat.beat_track')
    def test_detect_tempo(self, mock_beat_track):
        """Test tempo detection."""
        mock_beat_track.return_value = (120.0, np.array([0, 0.5, 1.0, 1.5]))
        
        tempo = self.converter._detect_tempo(self.mock_audio)
        
        self.assertEqual(tempo, 120.0)
    
    def test_save_json(self):
        """Test JSON export functionality."""
        notes = [
            NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.5, confidence=0.8),
            NoteEvent(pitch=64, velocity=80, start_time=0.5, end_time=1.0, confidence=0.9),
        ]
        
        result = ConversionResult(
            notes=notes,
            detected_key="C major",
            detected_tempo=120.0,
            confidence=0.85,
            note_count=2,
            duration=2.0
        )
        
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_file:
            temp_file_path = temp_file.name
        
        try:
            success = self.converter.save_json(result, temp_file_path)
            
            self.assertTrue(success)
            self.assertTrue(os.path.exists(temp_file_path))
            
            # Verify file content
            with open(temp_file_path, 'r') as f:
                import json
                data = json.load(f)
                
                self.assertEqual(data['detected_key'], "C major")
                self.assertEqual(data['detected_tempo'], 120.0)
                self.assertEqual(data['confidence'], 0.85)
                self.assertEqual(data['note_count'], 2)
                self.assertEqual(data['duration'], 2.0)
                self.assertEqual(len(data['notes']), 2)
                
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

class TestMeterAlignment(unittest.TestCase):
    """Test cases for meter alignment functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = AudioMidiConverter()
    
    def test_meter_regularity_calculation(self):
        """Test meter regularity calculation."""
        # Perfect meter (all same length)
        perfect_feet = ['˘¯', '˘¯', '˘¯', '˘¯']
        regularity = self.converter._calculate_regularity(perfect_feet)
        self.assertAlmostEqual(regularity, 1.0, places=2)
        
        # Irregular meter
        irregular_feet = ['˘¯', '˘¯¯', '˘¯', '˘¯¯¯']
        regularity = self.converter._calculate_regularity(irregular_feet)
        self.assertLess(regularity, 0.8)
    
    def test_meter_suggestions(self):
        """Test meter suggestion generation."""
        # Irregular meter should generate suggestions
        irregular_feet = ['˘¯', '˘¯¯', '˘¯']
        regularity = 0.5
        suggestions = self.converter._generate_meter_suggestions(irregular_feet, regularity)
        
        self.assertGreater(len(suggestions), 0)
        self.assertIn('consistent', suggestions[0].lower())
        
        # Regular meter should not generate suggestions
        regular_feet = ['˘¯', '˘¯', '˘¯', '˘¯']
        regularity = 0.9
        suggestions = self.converter._generate_meter_suggestions(regular_feet, regularity)
        
        self.assertEqual(len(suggestions), 0)

class TestRhymeDetection(unittest.TestCase):
    """Test cases for rhyme detection functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = AudioMidiConverter()
    
    def test_rhyme_pattern_detection(self):
        """Test rhyme pattern detection."""
        # Test perfect rhymes
        self.assertEqual(self.converter._get_rhyme_pattern("cat"), "at")
        self.assertEqual(self.converter._get_rhyme_pattern("hat"), "at")
        self.assertEqual(self.converter._get_rhyme_pattern("bat"), "at")
        
        # Test different patterns
        self.assertEqual(self.converter._get_rhyme_pattern("sing"), "ng")
        self.assertEqual(self.converter._get_rhyme_pattern("ring"), "ng")
        
        # Test short words
        self.assertEqual(self.converter._get_rhyme_pattern("a"), "a")
        self.assertEqual(self.converter._get_rhyme_pattern("be"), "be")
    
    def test_rhyme_group_formation(self):
        """Test rhyme group formation."""
        text = "The cat sat on the mat\nA hat was found\nThe bat flew around"
        
        rhyme_groups = self.converter._analyze_rhymes(text)
        
        # Should find rhyme groups
        self.assertGreater(len(rhyme_groups), 0)
        
        # Check that rhyming words are grouped together
        for group in rhyme_groups:
            self.assertGreater(len(group.words), 1)
            # All words in a group should have the same pattern
            pattern = self.converter._get_rhyme_pattern(group.words[0])
            for word in group.words:
                self.assertEqual(self.converter._get_rhyme_pattern(word), pattern)

class TestAudioToMidiAccuracy(unittest.TestCase):
    """Test cases for audio to MIDI conversion accuracy."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = AudioMidiConverter()
    
    def test_pitch_to_midi_conversion(self):
        """Test pitch frequency to MIDI pitch conversion."""
        # Test A4 (440 Hz) = MIDI pitch 69
        pitch_contour = {'time': 0.0, 'pitch': 440.0, 'confidence': 0.9}
        midi_pitch = self.converter._pitch_to_midi(pitch_contour['pitch'])
        self.assertEqual(midi_pitch, 69)
        
        # Test C5 (523.25 Hz) = MIDI pitch 72
        pitch_contour = {'time': 0.0, 'pitch': 523.25, 'confidence': 0.9}
        midi_pitch = self.converter._pitch_to_midi(pitch_contour['pitch'])
        self.assertEqual(midi_pitch, 72)
        
        # Test edge cases
        self.assertEqual(self.converter._pitch_to_midi(20.0), 9)   # Very low
        self.assertEqual(self.converter._pitch_to_midi(8000.0), 108)  # Very high
    
    def test_note_duration_validation(self):
        """Test note duration validation."""
        # Valid note duration
        note = NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.5, confidence=0.8)
        self.assertGreaterEqual(note.end_time - note.start_time, self.converter.min_note_duration)
        
        # Invalid note duration (too short)
        short_note = NoteEvent(pitch=60, velocity=80, start_time=0.0, end_time=0.01, confidence=0.8)
        self.assertLess(short_note.end_time - short_note.start_time, self.converter.min_note_duration)
    
    def test_confidence_threshold_filtering(self):
        """Test confidence threshold filtering."""
        pitch_contours = [
            {'time': 0.0, 'pitch': 440.0, 'confidence': 0.9, 'midi_pitch': 69},  # High confidence
            {'time': 0.1, 'pitch': 440.0, 'confidence': 0.3, 'midi_pitch': 69},  # Low confidence
            {'time': 0.2, 'pitch': 440.0, 'confidence': 0.8, 'midi_pitch': 69},  # High confidence
        ]
        
        notes = self.converter._detect_notes(pitch_contours, confidence_threshold=0.7)
        
        # Should only include notes with confidence >= 0.7
        for note in notes:
            self.assertGreaterEqual(note.confidence, 0.7)

if __name__ == '__main__':
    unittest.main()
