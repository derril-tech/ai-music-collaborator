import { Controller, Post, Body, Param, Get, UseGuards, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { ExportService } from './export.service';
import { ExportRequestDto, ExportResponseDto } from './dto/export.dto';

@ApiTags('export')
@Controller('export')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('bundle')
  @ApiOperation({ summary: 'Create export bundle' })
  @ApiResponse({ status: 200, description: 'Export bundle created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async createExportBundle(
    @Body() exportRequestDto: ExportRequestDto,
    @Res() res: Response,
  ) {
    return this.exportService.createExportBundle(exportRequestDto, res);
  }

  @Get('download/:exportId/:filename')
  @ApiOperation({ summary: 'Download export file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('exportId') exportId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.exportService.downloadFile(exportId, filename, res);
  }

  @Get('share/:shareId')
  @ApiOperation({ summary: 'Get shared export' })
  @ApiResponse({ status: 200, description: 'Shared export retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Share not found' })
  async getSharedExport(@Param('shareId') shareId: string) {
    return this.exportService.getSharedExport(shareId);
  }

  @Sse('progress/:exportId')
  @ApiOperation({ summary: 'Get export progress updates' })
  @ApiResponse({ status: 200, description: 'Progress stream' })
  async getProgress(@Param('exportId') exportId: string) {
    return this.exportService.getProgress(exportId);
  }
}
