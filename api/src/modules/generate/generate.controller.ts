import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { GenerateService } from './generate.service';
import {
  GenerateMelodyDto,
  GenerateChordsDto,
  GenerateRhythmDto,
  GenerateResponseDto,
} from './dto/generate.dto';

@ApiTags('generate')
@Controller('generate')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('melody')
  @ApiOperation({ summary: 'Generate melody from lyrics' })
  @ApiResponse({ status: 200, description: 'Melody generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: GenerateMelodyDto })
  async generateMelody(
    @Body() dto: GenerateMelodyDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const projectId = dto.project_id;
    const userId = req.user.id;

    // Set headers for Server-Sent Events
    res.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      const result = await this.generateService.generateMelody(
        projectId,
        userId,
        dto,
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        },
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('chords')
  @ApiOperation({ summary: 'Generate chord progression' })
  @ApiResponse({ status: 200, description: 'Chords generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: GenerateChordsDto })
  async generateChords(
    @Body() dto: GenerateChordsDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const projectId = dto.project_id;
    const userId = req.user.id;

    // Set headers for Server-Sent Events
    res.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      const result = await this.generateService.generateChords(
        projectId,
        userId,
        dto,
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        },
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('rhythm')
  @ApiOperation({ summary: 'Generate rhythm patterns' })
  @ApiResponse({ status: 200, description: 'Rhythm generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: GenerateRhythmDto })
  async generateRhythm(
    @Body() dto: GenerateRhythmDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const projectId = dto.project_id;
    const userId = req.user.id;

    // Set headers for Server-Sent Events
    res.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      const result = await this.generateService.generateRhythm(
        projectId,
        userId,
        dto,
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        },
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('full-song')
  @ApiOperation({ summary: 'Generate complete song from lyrics' })
  @ApiResponse({ status: 200, description: 'Song generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateFullSong(
    @Body() dto: GenerateMelodyDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const projectId = dto.project_id;
    const userId = req.user.id;

    // Set headers for Server-Sent Events
    res.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      const result = await this.generateService.generateFullSong(
        projectId,
        userId,
        dto,
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        },
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
}
