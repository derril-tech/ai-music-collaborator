import { Controller, Post, Body, Param, UseGuards, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { UploadService } from './upload.service';
import { UploadAudioDto, GetSignedUrlDto, SignedUrlResponseDto, UploadResponseDto } from './dto/upload.dto';

@ApiTags('upload')
@Controller('upload')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('signed-url')
  @ApiOperation({ summary: 'Get signed URL for file upload' })
  @ApiResponse({ status: 200, description: 'Signed URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async getSignedUrl(@Body() getSignedUrlDto: GetSignedUrlDto): Promise<SignedUrlResponseDto> {
    return this.uploadService.getSignedUrl(getSignedUrlDto);
  }

  @Post('audio')
  @ApiOperation({ summary: 'Upload audio file and optionally convert to MIDI' })
  @ApiResponse({ status: 200, description: 'Audio uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async uploadAudio(
    @Body() uploadAudioDto: UploadAudioDto,
    @Res() res: Response,
  ) {
    return this.uploadService.uploadAudio(uploadAudioDto, res);
  }

  @Post('audio/:uploadId/convert-midi')
  @ApiOperation({ summary: 'Convert uploaded audio to MIDI' })
  @ApiResponse({ status: 200, description: 'MIDI conversion started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  async convertToMidi(
    @Param('uploadId') uploadId: string,
    @Body() options: { mode?: string; confidence?: number; quantize?: boolean },
    @Res() res: Response,
  ) {
    return this.uploadService.convertToMidi(uploadId, options, res);
  }

  @Sse('progress/:uploadId')
  @ApiOperation({ summary: 'Get upload and conversion progress updates' })
  @ApiResponse({ status: 200, description: 'Progress stream' })
  async getProgress(@Param('uploadId') uploadId: string) {
    return this.uploadService.getProgress(uploadId);
  }
}
