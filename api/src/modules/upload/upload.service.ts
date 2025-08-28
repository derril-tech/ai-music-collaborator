import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../../entities/project.entity';
import { MidiPart } from '../../entities/midi-part.entity';
import { UploadAudioDto, GetSignedUrlDto, SignedUrlResponseDto, UploadResponseDto, MidiConversionMode } from './dto/upload.dto';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(MidiPart)
    private midiPartRepository: Repository<MidiPart>,
  ) {}

  async getSignedUrl(getSignedUrlDto: GetSignedUrlDto): Promise<SignedUrlResponseDto> {
    const { fileName, contentType, projectId, expiresIn = 3600 } = getSignedUrlDto;
    
    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `uploads/${projectId}/${timestamp}-${fileName}`;
    
    // Generate signed URL (mock implementation)
    const uploadUrl = `https://storage.example.com/upload?key=${fileKey}&expires=${Date.now() + expiresIn * 1000}`;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      uploadUrl,
      fileKey,
      expiresAt,
    };
  }

  async uploadAudio(uploadAudioDto: UploadAudioDto, res: Response): Promise<void> {
    const { projectId, format, convertToMidi = true, midiMode = MidiConversionMode.FULL } = uploadAudioDto;
    
    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Generate upload ID
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set up SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Simulate upload and conversion process
    await this.simulateUploadProcess(uploadId, projectId, format, convertToMidi, midiMode, res);
  }

  async convertToMidi(
    uploadId: string, 
    options: { mode?: string; confidence?: number; quantize?: boolean },
    res: Response
  ): Promise<void> {
    // Verify upload exists (mock)
    if (!uploadId.startsWith('upload_')) {
      throw new NotFoundException('Upload not found');
    }

    const { mode = 'full', confidence = 0.7, quantize = true } = options;

    // Set up SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Simulate MIDI conversion process
    await this.simulateMidiConversion(uploadId, mode, confidence, quantize, res);
  }

  getProgress(uploadId: string): Observable<any> {
    // Simulate progress updates
    return interval(1000).pipe(
      map(() => ({
        uploadId,
        progress: Math.min(100, Math.random() * 100),
        status: 'processing',
        estimatedTimeRemaining: Math.floor(Math.random() * 30),
        timestamp: new Date().toISOString(),
      }))
    );
  }

  private async simulateUploadProcess(
    uploadId: string,
    projectId: string,
    format: string,
    convertToMidi: boolean,
    midiMode: MidiConversionMode,
    res: Response
  ): Promise<void> {
    const steps = [
      { name: 'Validating file', duration: 1000 },
      { name: 'Uploading to storage', duration: 2000 },
      { name: 'Processing audio', duration: 1500 },
    ];

    if (convertToMidi) {
      steps.push(
        { name: 'Extracting pitch data', duration: 2000 },
        { name: 'Converting to MIDI', duration: 2500 },
        { name: 'Applying quantization', duration: 1000 }
      );
    }

    steps.push({ name: 'Finalizing', duration: 500 });

    let currentStep = 0;
    let totalProgress = 0;

    for (const step of steps) {
      const stepProgress = 100 / steps.length;
      
      // Send step start
      res.write(`data: ${JSON.stringify({
        uploadId,
        step: step.name,
        progress: totalProgress,
        status: 'processing',
        timestamp: new Date().toISOString(),
      })}\n\n`);

      // Simulate step progress
      for (let i = 0; i < 10; i++) {
        await this.delay(step.duration / 10);
        totalProgress += stepProgress / 10;
        
        res.write(`data: ${JSON.stringify({
          uploadId,
          step: step.name,
          progress: Math.min(100, totalProgress),
          status: 'processing',
          timestamp: new Date().toISOString(),
        })}\n\n`);
      }

      currentStep++;
    }

    // Send completion
    const audioUrl = `https://storage.example.com/audio/${uploadId}.${format}`;
    const midiUrl = convertToMidi ? `https://storage.example.com/midi/${uploadId}.mid` : undefined;

    res.write(`data: ${JSON.stringify({
      uploadId,
      step: 'Completed',
      progress: 100,
      status: 'completed',
      audioUrl,
      midiUrl,
      conversionResults: convertToMidi ? {
        detectedKey: 'C major',
        detectedTempo: 120,
        noteCount: Math.floor(Math.random() * 100) + 50,
        confidence: 0.85,
      } : undefined,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    res.end();
  }

  private async simulateMidiConversion(
    uploadId: string,
    mode: string,
    confidence: number,
    quantize: boolean,
    res: Response
  ): Promise<void> {
    const steps = [
      { name: 'Loading audio file', duration: 1000 },
      { name: 'Extracting pitch contours', duration: 2000 },
      { name: 'Detecting note boundaries', duration: 1500 },
      { name: 'Applying confidence filtering', duration: 1000 },
    ];

    if (quantize) {
      steps.push({ name: 'Quantizing timing', duration: 1000 });
    }

    steps.push({ name: 'Generating MIDI file', duration: 1500 });

    let currentStep = 0;
    let totalProgress = 0;

    for (const step of steps) {
      const stepProgress = 100 / steps.length;
      
      // Send step start
      res.write(`data: ${JSON.stringify({
        uploadId,
        step: step.name,
        progress: totalProgress,
        status: 'converting',
        timestamp: new Date().toISOString(),
      })}\n\n`);

      // Simulate step progress
      for (let i = 0; i < 10; i++) {
        await this.delay(step.duration / 10);
        totalProgress += stepProgress / 10;
        
        res.write(`data: ${JSON.stringify({
          uploadId,
          step: step.name,
          progress: Math.min(100, totalProgress),
          status: 'converting',
          timestamp: new Date().toISOString(),
        })}\n\n`);
      }

      currentStep++;
    }

    // Send completion
    const midiUrl = `https://storage.example.com/midi/${uploadId}_converted.mid`;

    res.write(`data: ${JSON.stringify({
      uploadId,
      step: 'MIDI conversion completed',
      progress: 100,
      status: 'completed',
      midiUrl,
      conversionResults: {
        detectedKey: 'C major',
        detectedTempo: 120,
        noteCount: Math.floor(Math.random() * 100) + 50,
        confidence: confidence,
        mode: mode,
        quantized: quantize,
      },
      timestamp: new Date().toISOString(),
    })}\n\n`);

    res.end();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
