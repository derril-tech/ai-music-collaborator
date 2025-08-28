import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { ContentPolicyDto, ContentPolicy } from '../governance/dto/governance.dto';

export interface ContentFilterResult {
  valid: boolean;
  issues: string[];
  filteredContent?: string;
  suggestions?: string[];
}

export interface StyleDescriptor {
  genre: string;
  mood: string;
  tempo: string;
  instrumentation: string[];
  era: string;
}

@Injectable()
export class ContentPolicyService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Validate content against policy filters
   */
  async validateContent(
    content: string,
    policy: ContentPolicyDto
  ): Promise<ContentFilterResult> {
    const issues: string[] = [];
    let filteredContent = content;

    // Check for hateful/explicit content if enabled
    if (policy.level === ContentPolicy.STRICT) {
      const hatefulCheck = this.checkHatefulContent(content);
      if (!hatefulCheck.valid) {
        issues.push(...hatefulCheck.issues);
        filteredContent = hatefulCheck.filteredContent || content;
      }

      const explicitCheck = this.checkExplicitContent(content);
      if (!explicitCheck.valid) {
        issues.push(...explicitCheck.issues);
        filteredContent = explicitCheck.filteredContent || content;
      }
    }

    // Check for style descriptors only if enabled
    if (policy.styleDescriptorsOnly) {
      const styleCheck = this.validateStyleDescriptors(content);
      if (!styleCheck.valid) {
        issues.push(...styleCheck.issues);
        filteredContent = styleCheck.filteredContent || content;
      }
    }

    // Check for prohibited keywords
    const keywordCheck = this.checkProhibitedKeywords(content, policy.keywords);
    if (!keywordCheck.valid) {
      issues.push(...keywordCheck.issues);
      filteredContent = keywordCheck.filteredContent || content;
    }

    return {
      valid: issues.length === 0,
      issues,
      filteredContent,
      suggestions: this.generateSuggestions(issues)
    };
  }

  /**
   * Enforce content policy on project
   */
  async enforceContentPolicy(
    projectId: string,
    policyLevel: ContentPolicy
  ): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['lyrics', 'sections']
    });

    if (!project) {
      return false;
    }

    // Get all text content from project
    const content = this.extractProjectContent(project);
    
    // Get default policy for the level
    const policy = this.getDefaultPolicy(policyLevel);
    
    // Validate content
    const result = await this.validateContent(content, policy);
    
    if (!result.valid) {
      // Log policy violations
      console.log(`Content policy violation for project ${projectId}:`, result.issues);
      
      // In a real implementation, you might:
      // - Flag the project for review
      // - Send notification to moderators
      // - Apply automatic filtering
      // - Require manual approval
    }

    return result.valid;
  }

  /**
   * Check for hateful content
   */
  private checkHatefulContent(content: string): ContentFilterResult {
    const hatefulPatterns = [
      /\b(hate|hatred|hateful)\b/gi,
      /\b(racist|racism)\b/gi,
      /\b(sexist|sexism)\b/gi,
      /\b(homophobic|homophobia)\b/gi,
      /\b(transphobic|transphobia)\b/gi,
      /\b(antisemitic|antisemitism)\b/gi,
      /\b(islamophobic|islamophobia)\b/gi,
      /\b(discriminat(e|ion|ory))\b/gi,
      /\b(bigot(ed|ry)?)\b/gi,
      /\b(prejudice|prejudiced)\b/gi,
    ];

    const issues: string[] = [];
    let filteredContent = content;

    hatefulPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Hateful content detected: ${matches.join(', ')}`);
        // Replace with neutral alternatives
        filteredContent = filteredContent.replace(pattern, '[content removed]');
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      filteredContent: issues.length > 0 ? filteredContent : undefined
    };
  }

  /**
   * Check for explicit content
   */
  private checkExplicitContent(content: string): ContentFilterResult {
    const explicitPatterns = [
      /\b(fuck|fucking|fucker)\b/gi,
      /\b(shit|shitting|shitter)\b/gi,
      /\b(ass|asshole)\b/gi,
      /\b(bitch|bitching)\b/gi,
      /\b(damn|damned|damning)\b/gi,
      /\b(hell|hellish)\b/gi,
      /\b(god\s*damn|goddamn)\b/gi,
      /\b(bloody|bloodier|bloodiest)\b/gi,
      /\b(bastard|bastards)\b/gi,
      /\b(piss|pissing|pissed)\b/gi,
    ];

    const issues: string[] = [];
    let filteredContent = content;

    explicitPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Explicit content detected: ${matches.join(', ')}`);
        // Replace with censored version
        filteredContent = filteredContent.replace(pattern, '[censored]');
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      filteredContent: issues.length > 0 ? filteredContent : undefined
    };
  }

  /**
   * Validate style descriptors only
   */
  private validateStyleDescriptors(content: string): ContentFilterResult {
    const styleDescriptors = this.extractStyleDescriptors(content);
    const nonStyleContent = this.extractNonStyleContent(content);

    const issues: string[] = [];
    let filteredContent = content;

    if (nonStyleContent.length > 0) {
      issues.push(`Non-style content detected: ${nonStyleContent.join(', ')}`);
      // Keep only style descriptors
      filteredContent = styleDescriptors.join(' ');
    }

    return {
      valid: issues.length === 0,
      issues,
      filteredContent: issues.length > 0 ? filteredContent : undefined
    };
  }

  /**
   * Check for prohibited keywords
   */
  private checkProhibitedKeywords(
    content: string,
    prohibitedKeywords: string[]
  ): ContentFilterResult {
    const issues: string[] = [];
    let filteredContent = content;

    prohibitedKeywords.forEach(keyword => {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Prohibited keyword detected: ${keyword}`);
        filteredContent = filteredContent.replace(pattern, '[prohibited]');
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      filteredContent: issues.length > 0 ? filteredContent : undefined
    };
  }

  /**
   * Extract style descriptors from content
   */
  private extractStyleDescriptors(content: string): string[] {
    const stylePatterns = [
      // Genres
      /\b(jazz|blues|rock|pop|country|folk|classical|electronic|hip.?hop|r&b|reggae|punk|metal|indie|alternative)\b/gi,
      // Moods
      /\b(happy|sad|melancholy|energetic|calm|aggressive|peaceful|romantic|mysterious|dark|bright|somber|joyful|angry|serene)\b/gi,
      // Tempo descriptors
      /\b(fast|slow|upbeat|downtempo|lively|relaxed|brisk|leisurely|urgent|laid.?back|driving|gentle|intense|soft|powerful)\b/gi,
      // Instrumentation
      /\b(piano|guitar|drums|bass|violin|trumpet|saxophone|flute|clarinet|organ|synth|strings|brass|woodwinds|percussion)\b/gi,
      // Eras
      /\b(50s|60s|70s|80s|90s|2000s|2010s|2020s|vintage|modern|contemporary|retro|classic|new.?wave|disco|funk|grunge)\b/gi,
    ];

    const descriptors: string[] = [];
    
    stylePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        descriptors.push(...matches);
      }
    });

    return descriptors;
  }

  /**
   * Extract non-style content
   */
  private extractNonStyleContent(content: string): string[] {
    const styleDescriptors = this.extractStyleDescriptors(content);
    const allWords = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    return allWords.filter(word => 
      !styleDescriptors.some(desc => 
        desc.toLowerCase().includes(word)
      )
    );
  }

  /**
   * Extract all text content from project
   */
  private extractProjectContent(project: any): string {
    let content = '';

    // Add project title and description
    if (project.title) content += ` ${project.title}`;
    if (project.description) content += ` ${project.description}`;

    // Add lyrics content
    if (project.lyrics) {
      project.lyrics.forEach((lyric: any) => {
        if (lyric.text) content += ` ${lyric.text}`;
      });
    }

    // Add section descriptions
    if (project.sections) {
      project.sections.forEach((section: any) => {
        if (section.description) content += ` ${section.description}`;
        if (section.name) content += ` ${section.name}`;
      });
    }

    return content.trim();
  }

  /**
   * Get default policy for a given level
   */
  private getDefaultPolicy(level: ContentPolicy): ContentPolicyDto {
    const policies: { [key in ContentPolicy]: ContentPolicyDto } = {
      [ContentPolicy.NONE]: {
        level: ContentPolicy.NONE,
        keywords: [],
        styleDescriptorsOnly: false,
        filters: []
      },
      [ContentPolicy.MODERATE]: {
        level: ContentPolicy.MODERATE,
        keywords: ['explicit', 'hateful', 'violent'],
        styleDescriptorsOnly: false,
        filters: ['explicit', 'hateful']
      },
      [ContentPolicy.STRICT]: {
        level: ContentPolicy.STRICT,
        keywords: ['explicit', 'hateful', 'violent', 'offensive', 'inappropriate'],
        styleDescriptorsOnly: true,
        filters: ['explicit', 'hateful', 'violent', 'offensive']
      }
    };

    return policies[level] || policies[ContentPolicy.NONE];
  }

  /**
   * Generate suggestions for content issues
   */
  private generateSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];

    if (issues.some(issue => issue.includes('Hateful content'))) {
      suggestions.push('Consider using neutral language that promotes inclusivity');
    }

    if (issues.some(issue => issue.includes('Explicit content'))) {
      suggestions.push('Use family-friendly language suitable for all audiences');
    }

    if (issues.some(issue => issue.includes('Non-style content'))) {
      suggestions.push('Focus on musical style descriptors like genre, mood, tempo, and instrumentation');
    }

    if (issues.some(issue => issue.includes('Prohibited keyword'))) {
      suggestions.push('Review and replace prohibited keywords with appropriate alternatives');
    }

    return suggestions;
  }

  /**
   * Get style descriptors for a project
   */
  async getStyleDescriptors(projectId: string): Promise<StyleDescriptor> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      return {
        genre: 'unknown',
        mood: 'neutral',
        tempo: 'medium',
        instrumentation: [],
        era: 'contemporary'
      };
    }

    // Extract style information from project metadata
    const content = this.extractProjectContent(project);
    const descriptors = this.extractStyleDescriptors(content);

    return {
      genre: this.extractGenre(descriptors),
      mood: this.extractMood(descriptors),
      tempo: this.extractTempo(descriptors),
      instrumentation: this.extractInstrumentation(descriptors),
      era: this.extractEra(descriptors)
    };
  }

  private extractGenre(descriptors: string[]): string {
    const genres = descriptors.filter(desc => 
      /jazz|blues|rock|pop|country|folk|classical|electronic|hip.?hop|r&b|reggae|punk|metal|indie|alternative/i.test(desc)
    );
    return genres[0]?.toLowerCase() || 'unknown';
  }

  private extractMood(descriptors: string[]): string {
    const moods = descriptors.filter(desc => 
      /happy|sad|melancholy|energetic|calm|aggressive|peaceful|romantic|mysterious|dark|bright|somber|joyful|angry|serene/i.test(desc)
    );
    return moods[0]?.toLowerCase() || 'neutral';
  }

  private extractTempo(descriptors: string[]): string {
    const tempos = descriptors.filter(desc => 
      /fast|slow|upbeat|downtempo|lively|relaxed|brisk|leisurely|urgent|laid.?back|driving|gentle|intense|soft|powerful/i.test(desc)
    );
    return tempos[0]?.toLowerCase() || 'medium';
  }

  private extractInstrumentation(descriptors: string[]): string[] {
    return descriptors.filter(desc => 
      /piano|guitar|drums|bass|violin|trumpet|saxophone|flute|clarinet|organ|synth|strings|brass|woodwinds|percussion/i.test(desc)
    ).map(desc => desc.toLowerCase());
  }

  private extractEra(descriptors: string[]): string {
    const eras = descriptors.filter(desc => 
      /50s|60s|70s|80s|90s|2000s|2010s|2020s|vintage|modern|contemporary|retro|classic|new.?wave|disco|funk|grunge/i.test(desc)
    );
    return eras[0]?.toLowerCase() || 'contemporary';
  }
}
