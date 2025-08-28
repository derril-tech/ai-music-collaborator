import { Controller, Post, Body, Param, UseGuards, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { RenderService } from './render.service';
import { RenderStemsDto, RenderMixMasterDto } from './dto/render.dto';
import { ProgressUpdateDto } from '../generate/dto/generate.dto';

@ApiTags('render')
@Controller('render')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Post('stems')
  @ApiOperation({ summary: 'Render MIDI parts to audio stems' })
  @ApiResponse({ status: 200, description: 'Stems rendered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async renderStems(
    @Body() renderStemsDto: RenderStemsDto,
    @Res() res: Response,
  ) {
    return this.renderService.renderStems(renderStemsDto, res);
  }

  @Post('mixmaster')
  @ApiOperation({ summary: 'Apply mixing and mastering to stems' })
  @ApiResponse({ status: 200, description: 'Mix/master completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Project or stems not found' })
  async renderMixMaster(
    @Body() renderMixMasterDto: RenderMixMasterDto,
    @Res() res: Response,
  ) {
    return this.renderService.renderMixMaster(renderMixMasterDto, res);
  }

  @Sse('progress/:projectId')
  @ApiOperation({ summary: 'Get rendering progress updates' })
  @ApiResponse({ status: 200, description: 'Progress stream' })
  async getProgress(@Param('projectId') projectId: string) {
    return this.renderService.getProgress(projectId);
  }
}
