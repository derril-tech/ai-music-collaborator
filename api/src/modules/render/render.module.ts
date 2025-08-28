import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { Project } from '../../entities/project.entity';
import { Stem } from '../../entities/stem.entity';
import { Mix } from '../../entities/mix.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Stem, Mix]),
  ],
  controllers: [RenderController],
  providers: [RenderService],
  exports: [RenderService],
})
export class RenderModule {}
