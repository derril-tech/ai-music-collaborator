import { IsString, IsArray, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  WAV = 'wav',
  FLAC = 'flac',
  MP3 = 'mp3',
  MIDI = 'midi',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ExportType {
  STEMS = 'stems',
  MIX = 'mix',
  MIDI = 'midi',
  CHARTS = 'charts',
  LYRICS = 'lyrics',
  BUNDLE = 'bundle',
}

export class ExportRequestDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Export types', enum: ExportType, isArray: true })
  @IsArray()
  @IsEnum(ExportType, { each: true })
  types: ExportType[];

  @ApiProperty({ description: 'Audio format for stems/mix', enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsOptional()
  audioFormat?: ExportFormat = ExportFormat.WAV;

  @ApiProperty({ description: 'Include rights metadata', default: true })
  @IsBoolean()
  @IsOptional()
  includeRights?: boolean = true;

  @ApiProperty({ description: 'Include provenance information', default: true })
  @IsBoolean()
  @IsOptional()
  includeProvenance?: boolean = true;

  @ApiProperty({ description: 'Create share link', default: false })
  @IsBoolean()
  @IsOptional()
  createShareLink?: boolean = false;

  @ApiProperty({ description: 'Custom export name' })
  @IsString()
  @IsOptional()
  customName?: string;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export job ID' })
  jobId: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Export status' })
  status: string;

  @ApiProperty({ description: 'Progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Export files' })
  files?: ExportFileDto[];

  @ApiProperty({ description: 'Share link (if requested)' })
  shareLink?: string;

  @ApiProperty({ description: 'Export metadata' })
  metadata?: ExportMetadataDto;
}

export class ExportFileDto {
  @ApiProperty({ description: 'File name' })
  name: string;

  @ApiProperty({ description: 'File type' })
  type: ExportType;

  @ApiProperty({ description: 'File format' })
  format: ExportFormat;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Download URL' })
  downloadUrl: string;

  @ApiProperty({ description: 'File checksum' })
  checksum: string;
}

export class ExportMetadataDto {
  @ApiProperty({ description: 'Export timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Export version' })
  version: string;

  @ApiProperty({ description: 'Rights information' })
  rights?: any;

  @ApiProperty({ description: 'Provenance information' })
  provenance?: any;

  @ApiProperty({ description: 'Export settings used' })
  settings: any;
}
