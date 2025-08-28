'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Music, Mic, Hash, Lightbulb, AlertCircle, CheckCircle, 
  Play, Pause, Volume2, Settings, Download, Upload
} from 'lucide-react';

interface SyllableAnalysis {
  word: string;
  syllables: number;
  stress: 'primary' | 'secondary' | 'unstressed';
  position: number;
}

interface RhymeGroup {
  pattern: string;
  words: string[];
  strength: 'perfect' | 'slant' | 'assonance';
}

interface MeterAnalysis {
  pattern: string;
  feet: string[];
  regularity: number; // 0-1
  suggestions: string[];
}

interface LyricsEditorProps {
  initialLyrics?: string;
  onLyricsChange: (lyrics: string, analysis: any) => void;
  onGenerate?: () => void;
  className?: string;
}

export function LyricsEditor({ 
  initialLyrics = '', 
  onLyricsChange, 
  onGenerate,
  className 
}: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [syllableAnalysis, setSyllableAnalysis] = useState<SyllableAnalysis[]>([]);
  const [rhymeGroups, setRhymeGroups] = useState<RhymeGroup[]>([]);
  const [meterAnalysis, setMeterAnalysis] = useState<MeterAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Analyze lyrics when they change
  useEffect(() => {
    if (lyrics.trim()) {
      analyzeLyrics();
    }
  }, [lyrics]);

  const analyzeLyrics = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const analysis = {
      syllables: analyzeSyllables(lyrics),
      rhymes: analyzeRhymes(lyrics),
      meter: analyzeMeter(lyrics)
    };
    
    setSyllableAnalysis(analysis.syllables);
    setRhymeGroups(analysis.rhymes);
    setMeterAnalysis(analysis.meter);
    setIsAnalyzing(false);
    
    onLyricsChange(lyrics, analysis);
  };

  const analyzeSyllables = (text: string): SyllableAnalysis[] => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.map((word, index) => ({
      word,
      syllables: countSyllables(word),
      stress: determineStress(word, index),
      position: index
    }));
  };

  const countSyllables = (word: string): number => {
    // Simple syllable counting algorithm
    const vowels = word.match(/[aeiouy]/gi);
    if (!vowels) return 1;
    
    let count = vowels.length;
    
    // Adjust for common patterns
    if (word.endsWith('e') && count > 1) count--;
    if (word.match(/[aeiou]{2,}/)) count--;
    
    return Math.max(1, count);
  };

  const determineStress = (word: string, position: number): 'primary' | 'secondary' | 'unstressed' => {
    // Simple stress determination based on position and word length
    if (word.length <= 3) return 'unstressed';
    if (position % 2 === 0) return 'primary';
    return 'secondary';
  };

  const analyzeRhymes = (text: string): RhymeGroup[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const endWords = lines.map(line => {
      const words = line.trim().split(' ');
      return words[words.length - 1].toLowerCase().replace(/[^\w]/g, '');
    });
    
    const groups: RhymeGroup[] = [];
    const patterns: string[] = [];
    
    endWords.forEach((word, index) => {
      const pattern = getRhymePattern(word);
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
        groups.push({
          pattern,
          words: [word],
          strength: 'perfect'
        });
      } else {
        const group = groups.find(g => g.pattern === pattern);
        if (group) {
          group.words.push(word);
        }
      }
    });
    
    return groups.filter(group => group.words.length > 1);
  };

  const getRhymePattern = (word: string): string => {
    // Simple rhyme pattern detection
    if (word.length <= 2) return word;
    return word.slice(-2);
  };

  const analyzeMeter = (text: string): MeterAnalysis => {
    const lines = text.split('\n').filter(line => line.trim());
    const feet: string[] = [];
    
    lines.forEach(line => {
      const words = line.trim().split(' ');
      let foot = '';
      words.forEach((word, index) => {
        const syllables = countSyllables(word);
        foot += syllables === 1 ? '˘' : syllables === 2 ? '˘¯' : '˘¯¯';
        if (index % 2 === 1) {
          feet.push(foot);
          foot = '';
        }
      });
      if (foot) feet.push(foot);
    });
    
    const pattern = feet.join(' ');
    const regularity = calculateRegularity(feet);
    
    return {
      pattern,
      feet,
      regularity,
      suggestions: generateMeterSuggestions(feet, regularity)
    };
  };

  const calculateRegularity = (feet: string[]): number => {
    if (feet.length <= 1) return 1;
    
    const patterns = feet.map(foot => foot.length);
    const avgLength = patterns.reduce((a, b) => a + b, 0) / patterns.length;
    const variance = patterns.reduce((sum, length) => sum + Math.pow(length - avgLength, 2), 0) / patterns.length;
    
    return Math.max(0, 1 - variance / avgLength);
  };

  const generateMeterSuggestions = (feet: string[], regularity: number): string[] => {
    const suggestions: string[] = [];
    
    if (regularity < 0.7) {
      suggestions.push('Consider more consistent syllable patterns');
      suggestions.push('Try alternating stressed and unstressed syllables');
    }
    
    if (feet.length < 4) {
      suggestions.push('Add more lines for better structure');
    }
    
    return suggestions;
  };

  const getRhymeSuggestions = (word: string): string[] => {
    // Simple rhyme suggestions
    const endings = ['ing', 'ed', 'er', 'ly', 'tion', 'sion', 'ment', 'ness'];
    const suggestions: string[] = [];
    
    endings.forEach(ending => {
      if (word.endsWith(ending)) {
        const base = word.slice(0, -ending.length);
        suggestions.push(`${base}ing`);
        suggestions.push(`${base}ed`);
        suggestions.push(`${base}er`);
      }
    });
    
    return suggestions.slice(0, 5);
  };

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setShowSuggestions(true);
  };

  const insertSuggestion = (suggestion: string) => {
    if (selectedWord && textareaRef.current) {
      const newLyrics = lyrics.replace(
        new RegExp(`\\b${selectedWord}\\b`, 'gi'),
        suggestion
      );
      setLyrics(newLyrics);
      setShowSuggestions(false);
      setSelectedWord(null);
    }
  };

  const formatLyricsWithAnalysis = () => {
    if (!syllableAnalysis.length) return lyrics;
    
    const words = lyrics.split(/\b/);
    return words.map(word => {
      const analysis = syllableAnalysis.find(a => 
        a.word.toLowerCase() === word.toLowerCase()
      );
      
      if (!analysis) return word;
      
      const stressClass = analysis.stress === 'primary' ? 'text-red-600 font-bold' :
                         analysis.stress === 'secondary' ? 'text-orange-500 font-semibold' :
                         'text-gray-500';
      
      return (
        <span
          key={`${word}-${analysis.position}`}
          className={`cursor-pointer hover:bg-yellow-100 px-1 rounded ${stressClass}`}
          onClick={() => handleWordClick(word)}
          title={`${analysis.syllables} syllable(s), ${analysis.stress} stress`}
        >
          {word}
          <span className="text-xs text-gray-400 ml-1">
            {analysis.syllables}
          </span>
        </span>
      );
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Lyrics Editor
            {isAnalyzing && <Badge variant="secondary">Analyzing...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter your lyrics here...\n\nEach line will be analyzed for meter, rhyme, and stress patterns."
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                Suggestions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeLyrics}
                disabled={isAnalyzing}
              >
                <Hash className="h-4 w-4 mr-1" />
                Re-analyze
              </Button>
            </div>
            
            {onGenerate && (
              <Button onClick={onGenerate} disabled={!lyrics.trim()}>
                <Music className="h-4 w-4 mr-1" />
                Generate Music
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Display */}
      {syllableAnalysis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Syllable Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Syllable Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Total syllables: {syllableAnalysis.reduce((sum, a) => sum + a.syllables, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Average per word: {(syllableAnalysis.reduce((sum, a) => sum + a.syllables, 0) / syllableAnalysis.length).toFixed(1)}
                </div>
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 mb-2">Word stress visualization:</div>
                  <div className="font-mono text-sm leading-relaxed">
                    {formatLyricsWithAnalysis()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rhyme Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Rhyme Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rhymeGroups.length > 0 ? (
                <div className="space-y-3">
                  {rhymeGroups.map((group, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="text-sm font-semibold text-gray-700">
                        Pattern: {group.pattern}
                      </div>
                      <div className="text-sm text-gray-600">
                        Words: {group.words.join(', ')}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {group.strength}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No clear rhyme patterns detected
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Meter Analysis */}
      {meterAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Meter Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Pattern</div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {meterAnalysis.pattern}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Regularity</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${meterAnalysis.regularity * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {(meterAnalysis.regularity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Status</div>
                  <Badge variant={meterAnalysis.regularity > 0.7 ? "default" : "destructive"}>
                    {meterAnalysis.regularity > 0.7 ? "Regular" : "Irregular"}
                  </Badge>
                </div>
              </div>
              
              {meterAnalysis.suggestions.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Suggestions</div>
                  <ul className="space-y-1">
                    {meterAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rhyme Suggestions */}
      {showSuggestions && selectedWord && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Rhyme Suggestions for "{selectedWord}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getRhymeSuggestions(selectedWord).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
