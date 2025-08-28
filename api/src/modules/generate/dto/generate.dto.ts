import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsUUID } from 'class-validator';

export class GenerateMelodyDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Lyrics text', required: false })
  @IsOptional()
  @IsString()
  lyrics?: string;

  @ApiProperty({ description: 'Musical key', example: 'C', required: false })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ description: 'Tempo in BPM', example: 120, required: false })
  @IsOptional()
  @IsNumber()
  tempo?: number;

  @ApiProperty({ description: 'Time signature', example: '4/4', required: false })
  @IsOptional()
  @IsString()
  time_signature?: string;

  @ApiProperty({ description: 'Genre', example: 'pop', required: false })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({ description: 'Mood', example: 'happy', required: false })
  @IsOptional()
  @IsString()
  mood?: string;

  @ApiProperty({ description: 'Seed MIDI data', required: false })
  @IsOptional()
  @IsString()
  seed_midi?: string;
}

export class GenerateChordsDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Melody data', required: false })
  @IsOptional()
  melody_data?: any;

  @ApiProperty({ description: 'Musical key', example: 'C', required: false })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ description: 'Genre', example: 'pop', required: false })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({ description: 'Chord progression style', example: 'functional', required: false })
  @IsOptional()
  @IsEnum(['functional', 'modal', 'jazz'])
  style?: string;

  @ApiProperty({ description: 'Number of chords', example: 4, required: false })
  @IsOptional()
  @IsNumber()
  chord_count?: number;
}

export class GenerateRhythmDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Tempo in BPM', example: 120 })
  @IsNumber()
  tempo: number;

  @ApiProperty({ description: 'Time signature', example: '4/4' })
  @IsString()
  time_signature: string;

  @ApiProperty({ description: 'Genre', example: 'pop' })
  @IsString()
  genre: string;

  @ApiProperty({ description: 'Reference groove audio URL', required: false })
  @IsOptional()
  @IsString()
  reference_groove?: string;

  @ApiProperty({ description: 'Swing amount', example: 0.0, required: false })
  @IsOptional()
  @IsNumber()
  swing?: number;

  @ApiProperty({ description: 'Quantization grid', example: 0.25, required: false })
  @IsOptional()
  @IsNumber()
  quantize?: number;
}

export class GenerateResponseDto {
  @ApiProperty({ description: 'Generation status' })
  status: string;

  @ApiProperty({ description: 'Generated data' })
  data: any;

  @ApiProperty({ description: 'Processing time in seconds' })
  processing_time: number;

  @ApiProperty({ description: 'Any warnings' })
  warnings: string[];

  @ApiProperty({ description: 'Any errors' })
  errors: string[];
}

export class ProgressUpdateDto {
  @ApiProperty({ description: 'Progress type' })
  type: 'progress' | 'complete' | 'error';

  @ApiProperty({ description: 'Current step' })
  step: string;

  @ApiProperty({ description: 'Progress percentage', example: 50 })
  percentage: number;

  @ApiProperty({ description: 'Step description' })
  description: string;

  @ApiProperty({ description: 'Generated data so far', required: false })
  data?: any;
}
