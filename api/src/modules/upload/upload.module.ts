import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Project } from '../../entities/project.entity';
import { MidiPart } from '../../entities/midi-part.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, MidiPart]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
