import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../../entities/project.entity';
import { Stem } from '../../entities/stem.entity';
import { Mix } from '../../entities/mix.entity';
import { RenderStemsDto, RenderMixMasterDto, RenderResponseDto } from './dto/render.dto';
import { ProgressUpdateDto } from '../generate/dto/generate.dto';

@Injectable()
export class RenderService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Stem)
    private stemRepository: Repository<Stem>,
    @InjectRepository(Mix)
    private mixRepository: Repository<Mix>,
  ) {}

  async renderStems(renderStemsDto: RenderStemsDto, res: Response): Promise<void> {
    const { projectId, format, sampleRate, bitDepth, includeClickTrack, soundfontPath, parallel } = renderStemsDto;

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

    // Generate job ID
    const jobId = `render_${projectId}_${Date.now()}`;

    // Send initial response
    const initialResponse: RenderResponseDto = {
      jobId,
      projectId,
      status: 'starting',
      progress: 0,
    };

    res.write(`data: ${JSON.stringify(initialResponse)}\n\n`);

    try {
      // Simulate stem rendering process
      await this.simulateStemRendering(projectId, res, {
        format,
        sampleRate,
        bitDepth,
        includeClickTrack,
        soundfontPath,
        parallel,
      });

      // Send completion response
      const completionResponse: RenderResponseDto = {
        jobId,
        projectId,
        status: 'completed',
        progress: 100,
        outputs: [`/api/v1/stems/${projectId}`],
      };

      res.write(`data: ${JSON.stringify(completionResponse)}\n\n`);
      res.end();

    } catch (error) {
      const errorResponse: RenderResponseDto = {
        jobId,
        projectId,
        status: 'failed',
        progress: 0,
      };

      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  }

  async renderMixMaster(renderMixMasterDto: RenderMixMasterDto, res: Response): Promise<void> {
    const { projectId, stemIds, masterPreset, targetLufs, truePeakLimit, applyCompression, applyEQ, applyReverb, format } = renderMixMasterDto;

    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify stems exist
    const stems = await this.stemRepository.findByIds(stemIds);
    if (stems.length !== stemIds.length) {
      throw new NotFoundException('Some stems not found');
    }

    // Set up SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const jobId = `mixmaster_${projectId}_${Date.now()}`;

    // Send initial response
    const initialResponse: RenderResponseDto = {
      jobId,
      projectId,
      status: 'starting',
      progress: 0,
    };

    res.write(`data: ${JSON.stringify(initialResponse)}\n\n`);

    try {
      // Simulate mix/master process
      await this.simulateMixMaster(projectId, res, {
        stemIds,
        masterPreset,
        targetLufs,
        truePeakLimit,
        applyCompression,
        applyEQ,
        applyReverb,
        format,
      });

      // Send completion response
      const completionResponse: RenderResponseDto = {
        jobId,
        projectId,
        status: 'completed',
        progress: 100,
        outputs: [`/api/v1/mixes/${projectId}`],
      };

      res.write(`data: ${JSON.stringify(completionResponse)}\n\n`);
      res.end();

    } catch (error) {
      const errorResponse: RenderResponseDto = {
        jobId,
        projectId,
        status: 'failed',
        progress: 0,
      };

      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  }

  getProgress(projectId: string): Observable<ProgressUpdateDto> {
    return interval(1000).pipe(
      map(() => ({
        projectId,
        status: 'rendering',
        progress: Math.floor(Math.random() * 100),
        message: 'Processing audio...',
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private async simulateStemRendering(
    projectId: string,
    res: Response,
    options: any,
  ): Promise<void> {
    const steps = [
      { progress: 10, message: 'Initializing synthesis engine...' },
      { progress: 25, message: 'Loading soundfonts...' },
      { progress: 40, message: 'Rendering melody stem...' },
      { progress: 55, message: 'Rendering harmony stem...' },
      { progress: 70, message: 'Rendering rhythm stem...' },
      { progress: 85, message: 'Generating click track...' },
      { progress: 95, message: 'Finalizing stems...' },
    ];

    for (const step of steps) {
      await this.delay(1000); // Simulate processing time
      
      const update: RenderResponseDto = {
        jobId: `render_${projectId}_${Date.now()}`,
        projectId,
        status: 'processing',
        progress: step.progress,
        estimatedTimeRemaining: (100 - step.progress) * 0.5,
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  }

  private async simulateMixMaster(
    projectId: string,
    res: Response,
    options: any,
  ): Promise<void> {
    const steps = [
      { progress: 15, message: 'Loading stems...' },
      { progress: 30, message: 'Applying gain staging...' },
      { progress: 45, message: 'Processing EQ...' },
      { progress: 60, message: 'Applying compression...' },
      { progress: 75, message: 'Creating stereo mix...' },
      { progress: 90, message: 'Applying mastering...' },
      { progress: 95, message: 'Calculating LUFS and true-peak...' },
    ];

    for (const step of steps) {
      await this.delay(800); // Simulate processing time
      
      const update: RenderResponseDto = {
        jobId: `mixmaster_${projectId}_${Date.now()}`,
        projectId,
        status: 'processing',
        progress: step.progress,
        estimatedTimeRemaining: (100 - step.progress) * 0.4,
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
