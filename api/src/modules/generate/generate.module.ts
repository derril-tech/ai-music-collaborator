import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { Project } from '../../entities/project.entity';
import { Lyrics } from '../../entities/lyrics.entity';
import { MidiPart } from '../../entities/midi-part.entity';
import { Chord } from '../../entities/chord.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Lyrics, MidiPart, Chord]),
  ],
  controllers: [GenerateController],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
