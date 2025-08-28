import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Project } from '../../entities/project.entity';
import { Stem } from '../../entities/stem.entity';
import { Mix } from '../../entities/mix.entity';
import { Export } from '../../entities/export.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Stem, Mix, Export]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
