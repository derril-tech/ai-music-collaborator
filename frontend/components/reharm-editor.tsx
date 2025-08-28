'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Music, Guitar, Settings, RotateCcw, RotateCw, Play, Pause,
  AlertTriangle, CheckCircle, Lightbulb, Zap, Clock
} from 'lucide-react';

interface Chord {
  id: string;
  root: string;
  quality: string;
  extensions: string[];
  function: string;
  roman: string;
  nashville: string;
  duration: number;
  position: number;
}

interface ReharmSuggestion {
  id: string;
  description: string;
  chords: Chord[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  style: string;
  confidence: number;
}

interface GrooveSettings {
  swing: number; // 0-100
  shuffle: number; // 0-100
  groove: string;
  velocity: number; // 0-127
  humanize: number; // 0-100
}

interface ReharmEditorProps {
  originalChords: Chord[];
  key: string;
  onChordsChange: (chords: Chord[]) => void;
  onGrooveChange: (groove: GrooveSettings) => void;
  className?: string;
}

const CHORD_QUALITIES = {
  major: ['', 'maj7', 'maj9', 'maj13'],
  minor: ['m', 'm7', 'm9', 'm11'],
  dominant: ['7', '9', '11', '13'],
  diminished: ['dim', 'dim7', 'm7b5'],
  augmented: ['aug', 'aug7']
};

const SECONDARY_DOMINANTS = {
  'V/V': { root: 'D', quality: '7', function: 'Secondary dominant to V' },
  'V/IV': { root: 'C', quality: '7', function: 'Secondary dominant to IV' },
  'V/vi': { root: 'E', quality: '7', function: 'Secondary dominant to vi' },
  'V/ii': { root: 'A', quality: '7', function: 'Secondary dominant to ii' },
  'V/iii': { root: 'B', quality: '7', function: 'Secondary dominant to iii' },
};

const MODAL_INTERCHANGE = {
  'bVII': { root: 'Bb', quality: '7', function: 'Modal interchange from parallel minor' },
  'bVI': { root: 'Ab', quality: 'maj7', function: 'Modal interchange from parallel minor' },
  'bIII': { root: 'Eb', quality: 'maj7', function: 'Modal interchange from parallel minor' },
  'bII': { root: 'Db', quality: 'maj7', function: 'Modal interchange from parallel minor' },
  'iv': { root: 'Fm', quality: 'm7', function: 'Modal interchange from parallel minor' },
};

const GROOVE_PRESETS = {
  'straight': { name: 'Straight', swing: 0, shuffle: 0 },
  'light_swing': { name: 'Light Swing', swing: 30, shuffle: 0 },
  'medium_swing': { name: 'Medium Swing', swing: 60, shuffle: 0 },
  'heavy_swing': { name: 'Heavy Swing', swing: 80, shuffle: 0 },
  'shuffle': { name: 'Shuffle', swing: 0, shuffle: 60 },
  'latin': { name: 'Latin', swing: 20, shuffle: 40 },
  'funk': { name: 'Funk', swing: 40, shuffle: 20 },
};

export function ReharmEditor({ 
  originalChords, 
  key, 
  onChordsChange, 
  onGrooveChange,
  className 
}: ReharmEditorProps) {
  const [chords, setChords] = useState<Chord[]>(originalChords);
  const [suggestions, setSuggestions] = useState<ReharmSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [grooveSettings, setGrooveSettings] = useState<GrooveSettings>({
    swing: 0,
    shuffle: 0,
    groove: 'straight',
    velocity: 80,
    humanize: 20,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<Chord[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    generateSuggestions();
    addToHistory(chords);
  }, [chords]);

  const addToHistory = (newChords: Chord[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newChords]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousChords = history[newIndex];
      setChords(previousChords);
      onChordsChange(previousChords);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextChords = history[newIndex];
      setChords(nextChords);
      onChordsChange(nextChords);
    }
  };

  const generateSuggestions = () => {
    const newSuggestions: ReharmSuggestion[] = [];

    // Secondary dominant suggestions
    Object.entries(SECONDARY_DOMINANTS).forEach(([function_, chord]) => {
      newSuggestions.push({
        id: `secondary_${function_}`,
        description: `Add ${function_} (${chord.root}${chord.quality})`,
        chords: generateSecondaryDominantProgression(chords, function_),
        complexity: 'intermediate',
        style: 'Jazz',
        confidence: 0.8,
      });
    });

    // Modal interchange suggestions
    Object.entries(MODAL_INTERCHANGE).forEach(([function_, chord]) => {
      newSuggestions.push({
        id: `modal_${function_}`,
        description: `Add ${function_} (${chord.root}${chord.quality})`,
        chords: generateModalInterchangeProgression(chords, function_),
        complexity: 'advanced',
        style: 'Rock/Pop',
        confidence: 0.7,
      });
    });

    // Tritone substitution
    newSuggestions.push({
      id: 'tritone_sub',
      description: 'Tritone substitution for dominant chords',
      chords: generateTritoneSubstitution(chords),
      complexity: 'advanced',
      style: 'Jazz',
      confidence: 0.6,
    });

    // Extended harmony
    newSuggestions.push({
      id: 'extended_harmony',
      description: 'Add extended harmonies (9ths, 11ths, 13ths)',
      chords: generateExtendedHarmony(chords),
      complexity: 'intermediate',
      style: 'Jazz/Fusion',
      confidence: 0.9,
    });

    setSuggestions(newSuggestions);
  };

  const generateSecondaryDominantProgression = (originalChords: Chord[], function_: string): Chord[] => {
    const newChords = [...originalChords];
    
    // Find target chord based on function
    const targetIndex = findTargetChordIndex(originalChords, function_);
    if (targetIndex !== -1) {
      const secondaryDominant = SECONDARY_DOMINANTS[function_ as keyof typeof SECONDARY_DOMINANTS];
      const newChord: Chord = {
        id: `secondary_${Date.now()}`,
        root: secondaryDominant.root,
        quality: secondaryDominant.quality,
        extensions: [],
        function: function_,
        roman: getRomanNumeral(secondaryDominant.root, secondaryDominant.quality, key),
        nashville: getNashvilleNumber(secondaryDominant.root, key),
        duration: originalChords[targetIndex].duration,
        position: originalChords[targetIndex].position - 0.5,
      };
      
      newChords.splice(targetIndex, 0, newChord);
    }
    
    return newChords;
  };

  const generateModalInterchangeProgression = (originalChords: Chord[], function_: string): Chord[] => {
    const newChords = [...originalChords];
    
    const modalChord = MODAL_INTERCHANGE[function_ as keyof typeof MODAL_INTERCHANGE];
    const targetIndex = findModalInterchangeTarget(originalChords, function_);
    
    if (targetIndex !== -1) {
      const newChord: Chord = {
        id: `modal_${Date.now()}`,
        root: modalChord.root,
        quality: modalChord.quality,
        extensions: [],
        function: function_,
        roman: getRomanNumeral(modalChord.root, modalChord.quality, key),
        nashville: getNashvilleNumber(modalChord.root, key),
        duration: originalChords[targetIndex].duration,
        position: originalChords[targetIndex].position,
      };
      
      newChords[targetIndex] = newChord;
    }
    
    return newChords;
  };

  const generateTritoneSubstitution = (originalChords: Chord[]): Chord[] => {
    return originalChords.map(chord => {
      if (chord.quality.includes('7') && !chord.quality.includes('maj7')) {
        // Find tritone substitution
        const tritoneRoot = getTritoneSubstitution(chord.root);
        return {
          ...chord,
          id: `tritone_${Date.now()}`,
          root: tritoneRoot,
          roman: getRomanNumeral(tritoneRoot, chord.quality, key),
          nashville: getNashvilleNumber(tritoneRoot, key),
        };
      }
      return chord;
    });
  };

  const generateExtendedHarmony = (originalChords: Chord[]): Chord[] => {
    return originalChords.map(chord => {
      const extensions = getExtendedHarmony(chord.quality);
      return {
        ...chord,
        extensions,
      };
    });
  };

  const findTargetChordIndex = (chords: Chord[], function_: string): number => {
    // Simple logic to find target chord for secondary dominant
    const targetMap: { [key: string]: string } = {
      'V/V': 'V',
      'V/IV': 'IV',
      'V/vi': 'vi',
      'V/ii': 'ii',
      'V/iii': 'iii',
    };
    
    const target = targetMap[function_];
    return chords.findIndex(chord => chord.function === target);
  };

  const findModalInterchangeTarget = (chords: Chord[], function_: string): number => {
    // Find appropriate chord to replace with modal interchange
    const targetMap: { [key: string]: string } = {
      'bVII': 'VII',
      'bVI': 'VI',
      'bIII': 'III',
      'bII': 'II',
      'iv': 'IV',
    };
    
    const target = targetMap[function_];
    return chords.findIndex(chord => chord.function === target);
  };

  const getTritoneSubstitution = (root: string): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(root);
    const tritoneIndex = (rootIndex + 6) % 12;
    return notes[tritoneIndex];
  };

  const getExtendedHarmony = (quality: string): string[] => {
    if (quality.includes('maj7')) return ['9', '13'];
    if (quality.includes('m7')) return ['9', '11'];
    if (quality.includes('7')) return ['9', '11', '13'];
    return [];
  };

  const getRomanNumeral = (root: string, quality: string, key: string): string => {
    // Simplified roman numeral generation
    const scale = getScale(key);
    const rootIndex = scale.indexOf(root);
    
    if (rootIndex === -1) return root;
    
    const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    let numeral = numerals[rootIndex];
    
    if (quality.includes('maj7')) {
      numeral = numeral.toUpperCase() + 'maj7';
    } else if (quality.includes('7') && !quality.includes('maj7')) {
      numeral = numeral.toUpperCase() + '7';
    } else if (quality.includes('m')) {
      numeral = numeral.toLowerCase();
    }
    
    return numeral;
  };

  const getNashvilleNumber = (root: string, key: string): string => {
    const scale = getScale(key);
    const rootIndex = scale.indexOf(root);
    return rootIndex !== -1 ? (rootIndex + 1).toString() : root;
  };

  const getScale = (key: string): string[] => {
    const majorScales: { [key: string]: string[] } = {
      'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
      'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
      'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
      'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
      'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
      'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
      'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    };
    
    return majorScales[key] || majorScales['C'];
  };

  const applySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      setChords(suggestion.chords);
      onChordsChange(suggestion.chords);
      setSelectedSuggestion(suggestionId);
    }
  };

  const handleGrooveChange = (newGroove: Partial<GrooveSettings>) => {
    const updatedGroove = { ...grooveSettings, ...newGroove };
    setGrooveSettings(updatedGroove);
    onGrooveChange(updatedGroove);
  };

  const applyGroovePreset = (presetKey: string) => {
    const preset = GROOVE_PRESETS[presetKey as keyof typeof GROOVE_PRESETS];
    if (preset) {
      const updatedGroove = {
        ...grooveSettings,
        swing: preset.swing,
        shuffle: preset.shuffle,
        groove: presetKey,
      };
      setGrooveSettings(updatedGroove);
      onGrooveChange(updatedGroove);
    }
  };

  const checkProsodyClashes = (): string[] => {
    const warnings: string[] = [];
    
    // Check for non-diatonic chords
    const scale = getScale(key);
    chords.forEach(chord => {
      if (!scale.includes(chord.root) && !chord.function.startsWith('b')) {
        warnings.push(`Non-diatonic chord: ${chord.root}${chord.quality}`);
      }
    });
    
    // Check for voice leading issues
    for (let i = 1; i < chords.length; i++) {
      const prev = chords[i - 1];
      const curr = chords[i];
      
      // Check for parallel fifths/octaves (simplified)
      if (prev.root === curr.root && prev.quality === curr.quality) {
        warnings.push(`Repeated chord: ${prev.root}${prev.quality}`);
      }
    }
    
    return warnings;
  };

  const warnings = checkProsodyClashes();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Guitar className="h-5 w-5" />
            Reharmonization Editor
            <Badge variant="outline">{key}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Redo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Current Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {chords.map((chord, index) => (
              <div
                key={chord.id}
                className="border rounded-lg p-3 min-w-[80px] text-center"
              >
                <div className="font-bold text-lg">{chord.root}{chord.quality}</div>
                <div className="text-sm text-gray-600">{chord.roman}</div>
                <div className="text-xs text-gray-500">{chord.nashville}</div>
                <div className="text-xs text-blue-600">{chord.function}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Prosody Warnings</span>
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-600">
                  • {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Reharmonization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Reharmonization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSuggestion === suggestion.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => applySuggestion(suggestion.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {suggestion.complexity}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.style}
                  </Badge>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {suggestion.description}
                </h3>
                <div className="flex flex-wrap gap-1 mb-2">
                  {suggestion.chords.slice(0, 4).map((chord, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {chord.root}{chord.quality}
                    </span>
                  ))}
                  {suggestion.chords.length > 4 && (
                    <span className="text-xs text-gray-500">+{suggestion.chords.length - 4}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Groove Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Groove & Swing Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Groove Presets */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Groove Presets</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GROOVE_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={grooveSettings.groove === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyGroovePreset(key)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Swing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Swing Amount: {grooveSettings.swing}%
              </label>
              <Slider
                value={[grooveSettings.swing]}
                onValueChange={([value]) => handleGrooveChange({ swing: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shuffle Amount: {grooveSettings.shuffle}%
              </label>
              <Slider
                value={[grooveSettings.shuffle]}
                onValueChange={([value]) => handleGrooveChange({ shuffle: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Advanced Groove Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velocity: {grooveSettings.velocity}
                </label>
                <Slider
                  value={[grooveSettings.velocity]}
                  onValueChange={([value]) => handleGrooveChange({ velocity: value })}
                  max={127}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humanize: {grooveSettings.humanize}%
                </label>
                <Slider
                  value={[grooveSettings.humanize]}
                  onValueChange={([value]) => handleGrooveChange({ humanize: value })}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
