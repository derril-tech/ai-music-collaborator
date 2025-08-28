import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RenderFormat {
  WAV = 'wav',
  FLAC = 'flac',
  MP3 = 'mp3',
}

export enum MasterPreset {
  STREAMING = 'streaming',
  RADIO = 'radio',
  CD = 'cd',
  VINYL = 'vinyl',
}

export class RenderStemsDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Output format', enum: RenderFormat })
  @IsEnum(RenderFormat)
  format: RenderFormat = RenderFormat.WAV;

  @ApiProperty({ description: 'Sample rate', default: 44100 })
  @IsNumber()
  @IsOptional()
  sampleRate?: number = 44100;

  @ApiProperty({ description: 'Bit depth', default: 24 })
  @IsNumber()
  @IsOptional()
  bitDepth?: number = 24;

  @ApiProperty({ description: 'Include click track', default: false })
  @IsBoolean()
  @IsOptional()
  includeClickTrack?: boolean = false;

  @ApiProperty({ description: 'Soundfont path (optional)' })
  @IsString()
  @IsOptional()
  soundfontPath?: string;

  @ApiProperty({ description: 'Parallel rendering', default: true })
  @IsBoolean()
  @IsOptional()
  parallel?: boolean = true;
}

export class RenderMixMasterDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Stem IDs to include in mix' })
  @IsArray()
  @IsString({ each: true })
  stemIds: string[];

  @ApiProperty({ description: 'Mastering preset', enum: MasterPreset })
  @IsEnum(MasterPreset)
  @IsOptional()
  masterPreset?: MasterPreset = MasterPreset.STREAMING;

  @ApiProperty({ description: 'Target LUFS', default: -14.0 })
  @IsNumber()
  @IsOptional()
  targetLufs?: number = -14.0;

  @ApiProperty({ description: 'True peak limit', default: -1.0 })
  @IsNumber()
  @IsOptional()
  truePeakLimit?: number = -1.0;

  @ApiProperty({ description: 'Apply compression', default: true })
  @IsBoolean()
  @IsOptional()
  applyCompression?: boolean = true;

  @ApiProperty({ description: 'Apply EQ', default: true })
  @IsBoolean()
  @IsOptional()
  applyEQ?: boolean = true;

  @ApiProperty({ description: 'Apply reverb', default: false })
  @IsBoolean()
  @IsOptional()
  applyReverb?: boolean = false;

  @ApiProperty({ description: 'Output format', enum: RenderFormat })
  @IsEnum(RenderFormat)
  format: RenderFormat = RenderFormat.WAV;
}

export class RenderResponseDto {
  @ApiProperty({ description: 'Render job ID' })
  jobId: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Render status' })
  status: string;

  @ApiProperty({ description: 'Progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Estimated time remaining (seconds)' })
  estimatedTimeRemaining?: number;

  @ApiProperty({ description: 'Output file URLs' })
  outputs?: string[];
}
