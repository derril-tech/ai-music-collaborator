import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../../entities/project.entity';
import { MidiPart } from '../../../entities/midi-part.entity';
import { Chord } from '../../../entities/chord.entity';

export interface ProsodyWarning {
  type: 'prosody_clash' | 'non_diatonic' | 'voice_leading' | 'rhythm_conflict';
  severity: 'low' | 'medium' | 'high';
  message: string;
  position: number;
  suggestion?: string;
}

export interface VersionInfo {
  id: string;
  name: string;
  timestamp: Date;
  description: string;
  changes: string[];
}

@Injectable()
export class ProsodyGuard {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(MidiPart)
    private midiPartRepository: Repository<MidiPart>,
    @InjectRepository(Chord)
    private chordRepository: Repository<Chord>,
  ) {}

  /**
   * Check for prosody clashes between lyrics and melody
   */
  async checkProsodyClashes(
    projectId: string,
    lyrics: string,
    melodyNotes: any[]
  ): Promise<ProsodyWarning[]> {
    const warnings: ProsodyWarning[] = [];
    
    // Get project details
    const project = await this.projectRepository.findOne({ 
      where: { id: projectId },
      relations: ['lyrics', 'sections']
    });
    
    if (!project) {
      return warnings;
    }

    // Analyze syllable stress patterns
    const syllableAnalysis = this.analyzeSyllables(lyrics);
    
    // Check melody against syllable stress
    melodyNotes.forEach((note, index) => {
      const syllable = syllableAnalysis.find(s => s.position === index);
      if (syllable) {
        // Check if stressed syllables align with strong beats
        if (syllable.stress === 'primary' && !this.isOnStrongBeat(note.time)) {
          warnings.push({
            type: 'prosody_clash',
            severity: 'medium',
            message: `Stressed syllable "${syllable.word}" not on strong beat`,
            position: index,
            suggestion: 'Consider moving the note to align with the beat'
          });
        }
        
        // Check if unstressed syllables are on strong beats
        if (syllable.stress === 'unstressed' && this.isOnStrongBeat(note.time)) {
          warnings.push({
            type: 'prosody_clash',
            severity: 'low',
            message: `Unstressed syllable "${syllable.word}" on strong beat`,
            position: index,
            suggestion: 'Consider using a weaker note or moving the syllable'
          });
        }
      }
    });

    return warnings;
  }

  /**
   * Check for non-diatonic chords and provide warnings
   */
  async checkNonDiatonicWarnings(
    projectId: string,
    chords: any[]
  ): Promise<ProsodyWarning[]> {
    const warnings: ProsodyWarning[] = [];
    
    const project = await this.projectRepository.findOne({ 
      where: { id: projectId }
    });
    
    if (!project || !project.key) {
      return warnings;
    }

    const key = project.key;
    const scale = this.getScale(key);
    
    chords.forEach((chord, index) => {
      // Check if chord root is in the scale
      if (!scale.includes(chord.root)) {
        warnings.push({
          type: 'non_diatonic',
          severity: 'medium',
          message: `Non-diatonic chord: ${chord.root}${chord.quality}`,
          position: index,
          suggestion: `Consider using a diatonic chord from ${key} major scale`
        });
      }
      
      // Check for common non-diatonic patterns that might be intentional
      if (this.isSecondaryDominant(chord, chords, index)) {
        warnings.push({
          type: 'non_diatonic',
          severity: 'low',
          message: `Secondary dominant detected: ${chord.root}${chord.quality}`,
          position: index,
          suggestion: 'This is a common jazz technique - verify intentional use'
        });
      }
      
      if (this.isModalInterchange(chord, key)) {
        warnings.push({
          type: 'non_diatonic',
          severity: 'low',
          message: `Modal interchange detected: ${chord.root}${chord.quality}`,
          position: index,
          suggestion: 'This borrows from parallel minor - verify intentional use'
        });
      }
    });

    return warnings;
  }

  /**
   * Check for voice leading issues
   */
  async checkVoiceLeading(
    projectId: string,
    chords: any[]
  ): Promise<ProsodyWarning[]> {
    const warnings: ProsodyWarning[] = [];
    
    for (let i = 1; i < chords.length; i++) {
      const prevChord = chords[i - 1];
      const currChord = chords[i];
      
      // Check for parallel fifths
      if (this.hasParallelFifths(prevChord, currChord)) {
        warnings.push({
          type: 'voice_leading',
          severity: 'high',
          message: 'Parallel fifths detected between consecutive chords',
          position: i,
          suggestion: 'Consider using contrary motion or oblique motion'
        });
      }
      
      // Check for parallel octaves
      if (this.hasParallelOctaves(prevChord, currChord)) {
        warnings.push({
          type: 'voice_leading',
          severity: 'high',
          message: 'Parallel octaves detected between consecutive chords',
          position: i,
          suggestion: 'Consider using contrary motion or oblique motion'
        });
      }
      
      // Check for large leaps
      if (this.hasLargeLeaps(prevChord, currChord)) {
        warnings.push({
          type: 'voice_leading',
          severity: 'medium',
          message: 'Large melodic leaps detected',
          position: i,
          suggestion: 'Consider using stepwise motion or arpeggiation'
        });
      }
    }

    return warnings;
  }

  /**
   * Check for rhythm conflicts
   */
  async checkRhythmConflicts(
    projectId: string,
    melodyNotes: any[],
    rhythmPattern: any[]
  ): Promise<ProsodyWarning[]> {
    const warnings: ProsodyWarning[] = [];
    
    // Check if melody notes align with rhythm pattern
    melodyNotes.forEach((note, index) => {
      const rhythmBeat = rhythmPattern.find(r => 
        Math.abs(r.time - note.time) < 0.1
      );
      
      if (!rhythmBeat) {
        warnings.push({
          type: 'rhythm_conflict',
          severity: 'medium',
          message: `Melody note not aligned with rhythm pattern`,
          position: index,
          suggestion: 'Consider quantizing or adjusting timing'
        });
      }
    });

    return warnings;
  }

  /**
   * Save a version of the current state
   */
  async saveVersion(
    projectId: string,
    versionName: string,
    description: string,
    changes: string[]
  ): Promise<VersionInfo> {
    const version: VersionInfo = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: versionName,
      timestamp: new Date(),
      description,
      changes
    };

    // In a real implementation, you would save this to a versions table
    // For now, we'll just return the version info
    console.log(`Saving version: ${versionName} for project ${projectId}`);
    
    return version;
  }

  /**
   * Get version history for a project
   */
  async getVersionHistory(projectId: string): Promise<VersionInfo[]> {
    // Mock version history - in real implementation, fetch from database
    return [
      {
        id: 'version_1',
        name: 'Initial version',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        description: 'First draft of the song',
        changes: ['Added basic chord progression', 'Created melody line']
      },
      {
        id: 'version_2',
        name: 'Reharmonized version',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        description: 'Added secondary dominants and extended harmonies',
        changes: ['Added V/V chord', 'Extended harmonies to 9ths and 13ths']
      }
    ];
  }

  /**
   * Analyze syllables in lyrics
   */
  private analyzeSyllables(text: string): Array<{
    word: string;
    syllables: number;
    stress: 'primary' | 'secondary' | 'unstressed';
    position: number;
  }> {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.map((word, index) => ({
      word,
      syllables: this.countSyllables(word),
      stress: this.determineStress(word, index),
      position: index
    }));
  }

  /**
   * Count syllables in a word
   */
  private countSyllables(word: string): number {
    const vowels = word.match(/[aeiouy]/gi);
    if (!vowels) return 1;
    
    let count = vowels.length;
    
    // Adjust for common patterns
    if (word.endsWith('e') && count > 1) count--;
    if (word.match(/[aeiou]{2,}/)) count--;
    
    return Math.max(1, count);
  }

  /**
   * Determine stress pattern of a word
   */
  private determineStress(word: string, position: number): 'primary' | 'secondary' | 'unstressed' {
    if (word.length <= 3) return 'unstressed';
    if (position % 2 === 0) return 'primary';
    return 'secondary';
  }

  /**
   * Check if a note is on a strong beat
   */
  private isOnStrongBeat(time: number): boolean {
    // Assuming 4/4 time, strong beats are on 1 and 3
    const beatPosition = (time * 120 / 60) % 4; // Assuming 120 BPM
    return beatPosition < 0.1 || Math.abs(beatPosition - 2) < 0.1;
  }

  /**
   * Get scale for a given key
   */
  private getScale(key: string): string[] {
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
  }

  /**
   * Check if a chord is a secondary dominant
   */
  private isSecondaryDominant(chord: any, allChords: any[], index: number): boolean {
    if (!chord.quality.includes('7') || chord.quality.includes('maj7')) {
      return false;
    }
    
    // Look ahead to see if this resolves to a diatonic chord
    const nextChord = allChords[index + 1];
    if (nextChord) {
      const resolution = this.getSecondaryDominantResolution(chord.root);
      return resolution === nextChord.root;
    }
    
    return false;
  }

  /**
   * Get the resolution chord for a secondary dominant
   */
  private getSecondaryDominantResolution(dominantRoot: string): string {
    const resolutions: { [key: string]: string } = {
      'D': 'G',  // V/V -> V
      'A': 'D',  // V/ii -> ii
      'E': 'A',  // V/vi -> vi
      'B': 'E',  // V/iii -> iii
    };
    
    return resolutions[dominantRoot] || dominantRoot;
  }

  /**
   * Check if a chord is modal interchange
   */
  private isModalInterchange(chord: any, key: string): boolean {
    const modalChords: { [key: string]: string[] } = {
      'C': ['Bb', 'Ab', 'Eb', 'Db', 'Fm'],
      'G': ['F', 'Eb', 'Bb', 'Ab', 'Cm'],
      'D': ['C', 'Bb', 'F', 'Eb', 'Gm'],
      'A': ['G', 'F', 'C', 'Bb', 'Dm'],
      'E': ['D', 'C', 'G', 'F', 'Am'],
      'B': ['A', 'G', 'D', 'C', 'Em'],
    };
    
    const keyModalChords = modalChords[key] || [];
    return keyModalChords.includes(chord.root);
  }

  /**
   * Check for parallel fifths
   */
  private hasParallelFifths(chord1: any, chord2: any): boolean {
    // Simplified check - in real implementation, analyze actual voice leading
    return false;
  }

  /**
   * Check for parallel octaves
   */
  private hasParallelOctaves(chord1: any, chord2: any): boolean {
    // Simplified check - in real implementation, analyze actual voice leading
    return false;
  }

  /**
   * Check for large leaps
   */
  private hasLargeLeaps(chord1: any, chord2: any): boolean {
    // Simplified check - in real implementation, analyze actual voice leading
    return false;
  }
}
