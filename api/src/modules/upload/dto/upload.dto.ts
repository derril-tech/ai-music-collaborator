import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AudioFormat {
  WAV = 'wav',
  MP3 = 'mp3',
  FLAC = 'flac',
  M4A = 'm4a',
  OGG = 'ogg',
}

export enum MidiConversionMode {
  MELODY = 'melody',
  HARMONY = 'harmony',
  RHYTHM = 'rhythm',
  FULL = 'full',
}

export class UploadAudioDto {
  @ApiProperty({ description: 'Project ID to associate with the upload' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Audio format', enum: AudioFormat })
  @IsEnum(AudioFormat)
  format: AudioFormat;

  @ApiProperty({ description: 'Sample rate', default: 44100 })
  @IsNumber()
  @IsOptional()
  sampleRate?: number = 44100;

  @ApiProperty({ description: 'Convert to MIDI after upload', default: true })
  @IsBoolean()
  @IsOptional()
  convertToMidi?: boolean = true;

  @ApiProperty({ description: 'MIDI conversion mode', enum: MidiConversionMode })
  @IsEnum(MidiConversionMode)
  @IsOptional()
  midiMode?: MidiConversionMode = MidiConversionMode.FULL;

  @ApiProperty({ description: 'Minimum pitch confidence threshold', default: 0.7 })
  @IsNumber()
  @IsOptional()
  pitchConfidence?: number = 0.7;

  @ApiProperty({ description: 'Include timing quantization', default: true })
  @IsBoolean()
  @IsOptional()
  quantize?: boolean = true;
}

export class UploadResponseDto {
  @ApiProperty({ description: 'Upload ID' })
  uploadId: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Upload status' })
  status: string;

  @ApiProperty({ description: 'Audio file URL' })
  audioUrl: string;

  @ApiProperty({ description: 'MIDI file URL (if converted)' })
  midiUrl?: string;

  @ApiProperty({ description: 'Upload progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Estimated time remaining (seconds)' })
  estimatedTimeRemaining?: number;

  @ApiProperty({ description: 'Conversion results' })
  conversionResults?: {
    detectedKey?: string;
    detectedTempo?: number;
    noteCount?: number;
    confidence?: number;
  };
}

export class GetSignedUrlDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File type' })
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Expiration time in seconds', default: 3600 })
  @IsNumber()
  @IsOptional()
  expiresIn?: number = 3600;
}

export class SignedUrlResponseDto {
  @ApiProperty({ description: 'Signed upload URL' })
  uploadUrl: string;

  @ApiProperty({ description: 'File key for storage' })
  fileKey: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  expiresAt: string;
}
