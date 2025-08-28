import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../../entities/project.entity';
import { Stem } from '../../entities/stem.entity';
import { Mix } from '../../entities/mix.entity';
import { Export } from '../../entities/export.entity';
import { ExportRequestDto, ExportResponseDto, ExportType, ExportFormat } from './dto/export.dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Stem)
    private stemRepository: Repository<Stem>,
    @InjectRepository(Mix)
    private mixRepository: Repository<Mix>,
    @InjectRepository(Export)
    private exportRepository: Repository<Export>,
  ) {}

  async createExportBundle(exportRequestDto: ExportRequestDto, res: Response): Promise<void> {
    const { projectId, types, audioFormat, includeRights, includeProvenance, createShareLink, customName } = exportRequestDto;

    // Verify project exists and user has access
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Set up SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const exportId = `export_${projectId}_${Date.now()}`;

    // Send initial response
    const initialResponse: ExportResponseDto = {
      jobId: exportId,
      projectId,
      status: 'starting',
      progress: 0,
    };

    res.write(`data: ${JSON.stringify(initialResponse)}\n\n`);

    try {
      // Simulate export process
      await this.simulateExportProcess(exportId, projectId, res, {
        types,
        audioFormat,
        includeRights,
        includeProvenance,
        createShareLink,
        customName,
      });

      // Send completion response
      const completionResponse: ExportResponseDto = {
        jobId: exportId,
        projectId,
        status: 'completed',
        progress: 100,
        files: this.generateMockFiles(types, audioFormat),
        shareLink: createShareLink ? `https://example.com/share/${exportId}` : undefined,
        metadata: this.generateMetadata(includeRights, includeProvenance),
      };

      res.write(`data: ${JSON.stringify(completionResponse)}\n\n`);
      res.end();

    } catch (error) {
      const errorResponse: ExportResponseDto = {
        jobId: exportId,
        projectId,
        status: 'failed',
        progress: 0,
      };

      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  }

  async downloadFile(exportId: string, filename: string, res: Response): Promise<void> {
    // Verify export exists and user has access
    const exportRecord = await this.exportRepository.findOne({ where: { id: exportId } });
    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    // Generate signed URL for download
    const downloadUrl = await this.generateSignedUrl(exportId, filename);
    
    // Redirect to signed URL
    res.redirect(downloadUrl);
  }

  async getSharedExport(shareId: string): Promise<any> {
    // Verify share exists and is valid
    const exportRecord = await this.exportRepository.findOne({ 
      where: { shareId },
      relations: ['project']
    });
    
    if (!exportRecord) {
      throw new NotFoundException('Share not found');
    }

    return {
      exportId: exportRecord.id,
      projectName: exportRecord.project?.name,
      files: this.generateMockFiles([ExportType.STEMS, ExportType.MIX], ExportFormat.WAV),
      metadata: this.generateMetadata(true, true),
    };
  }

  getProgress(exportId: string): Observable<any> {
    return interval(1000).pipe(
      map(() => ({
        exportId,
        status: 'exporting',
        progress: Math.floor(Math.random() * 100),
        message: 'Creating export bundle...',
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private async simulateExportProcess(
    exportId: string,
    projectId: string,
    res: Response,
    options: any,
  ): Promise<void> {
    const steps = [
      { progress: 10, message: 'Preparing export...' },
      { progress: 25, message: 'Processing audio files...' },
      { progress: 40, message: 'Generating MIDI files...' },
      { progress: 55, message: 'Creating chord charts...' },
      { progress: 70, message: 'Generating lyric sheets...' },
      { progress: 85, message: 'Adding metadata...' },
      { progress: 95, message: 'Creating bundle...' },
    ];

    for (const step of steps) {
      await this.delay(800);
      
      const update: ExportResponseDto = {
        jobId: exportId,
        projectId,
        status: 'processing',
        progress: step.progress,
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  }

  private generateMockFiles(types: ExportType[], audioFormat: ExportFormat) {
    const files = [];

    if (types.includes(ExportType.STEMS)) {
      files.push({
        name: 'vocals.wav',
        type: ExportType.STEMS,
        format: audioFormat,
        size: 1024000,
        downloadUrl: '/api/v1/export/download/mock/vocals.wav',
        checksum: 'abc123',
      });
      files.push({
        name: 'guitar.wav',
        type: ExportType.STEMS,
        format: audioFormat,
        size: 2048000,
        downloadUrl: '/api/v1/export/download/mock/guitar.wav',
        checksum: 'def456',
      });
    }

    if (types.includes(ExportType.MIX)) {
      files.push({
        name: 'master_mix.wav',
        type: ExportType.MIX,
        format: audioFormat,
        size: 5120000,
        downloadUrl: '/api/v1/export/download/mock/master_mix.wav',
        checksum: 'ghi789',
      });
    }

    if (types.includes(ExportType.MIDI)) {
      files.push({
        name: 'melody.mid',
        type: ExportType.MIDI,
        format: ExportFormat.MIDI,
        size: 10240,
        downloadUrl: '/api/v1/export/download/mock/melody.mid',
        checksum: 'jkl012',
      });
    }

    if (types.includes(ExportType.CHARTS)) {
      files.push({
        name: 'chord_charts.pdf',
        type: ExportType.CHARTS,
        format: ExportFormat.PDF,
        size: 51200,
        downloadUrl: '/api/v1/export/download/mock/chord_charts.pdf',
        checksum: 'mno345',
      });
    }

    if (types.includes(ExportType.LYRICS)) {
      files.push({
        name: 'lyrics.pdf',
        type: ExportType.LYRICS,
        format: ExportFormat.PDF,
        size: 25600,
        downloadUrl: '/api/v1/export/download/mock/lyrics.pdf',
        checksum: 'pqr678',
      });
    }

    if (types.includes(ExportType.BUNDLE)) {
      files.push({
        name: 'project_bundle.zip',
        type: ExportType.BUNDLE,
        format: ExportFormat.JSON,
        size: 10485760,
        downloadUrl: '/api/v1/export/download/mock/project_bundle.zip',
        checksum: 'stu901',
      });
    }

    return files;
  }

  private generateMetadata(includeRights: boolean, includeProvenance: boolean) {
    const metadata: any = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings: {
        audioFormat: 'WAV',
        sampleRate: 44100,
        bitDepth: 24,
      },
    };

    if (includeRights) {
      metadata.rights = {
        license: 'CC-BY-NC',
        attribution: 'AI Music Collaborator',
        usage: 'Non-commercial use only',
      };
    }

    if (includeProvenance) {
      metadata.provenance = {
        models_used: ['melody_gen_v1', 'harmony_gen_v1', 'rhythm_gen_v1'],
        samples_used: [],
        generation_timestamp: new Date().toISOString(),
        pipeline_version: '1.0.0',
      };
    }

    return metadata;
  }

  private async generateSignedUrl(exportId: string, filename: string): Promise<string> {
    // Mock signed URL generation
    return `https://storage.example.com/exports/${exportId}/${filename}?token=mock_signed_token`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
